"""Download the ACECQA National Registers (open data, CC-BY) via Webshare proxies.

The official catalogue WAF-blocks datacenter/automated requests (HTTP 403), so we
route through residential/rotating proxies. The data itself is public open data.

Flow:
  1. Hit the CKAN package_show API to list the dataset's resources.
  2. Filter to CSV resources (services + providers registers).
  3. Download each into data/raw/, rotating proxies and retrying on failure.

Config (ingest/.env):
  WEBSHARE_PROXIES   = list of proxies (newline/comma separated), OR
  WEBSHARE_LIST_URL  = Webshare proxy-list download URL.

Usage:
  python download_acecqa.py            # download all CSV resources
  python download_acecqa.py --list     # just list resources, download nothing
"""
from __future__ import annotations

import argparse
import os
import random
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

load_dotenv()

# The national registers dataset on the federal infrastructure catalogue.
CKAN_BASE = "https://catalogue.data.infrastructure.gov.au"
DATASET_ID = "rdh-nationalregistersofapprovededucationandcareservices"
PACKAGE_SHOW = f"{CKAN_BASE}/api/3/action/package_show?id={DATASET_ID}"

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/json,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
}

MAX_ATTEMPTS = 8
TIMEOUT = 60


def _normalise_proxy(line: str) -> str | None:
    """Accept 'http://user:pass@host:port' or Webshare's 'host:port:user:pass'."""
    line = line.strip()
    if not line:
        return None
    if line.startswith("http://") or line.startswith("https://"):
        return line
    parts = line.split(":")
    if len(parts) == 4:  # host:port:user:pass
        host, port, user, pwd = parts
        return f"http://{user}:{pwd}@{host}:{port}"
    if len(parts) == 2:  # host:port (no auth)
        host, port = parts
        return f"http://{host}:{port}"
    return None


def load_proxies() -> list[str]:
    proxies: list[str] = []

    raw = os.getenv("WEBSHARE_PROXIES", "")
    for chunk in raw.replace(",", "\n").splitlines():
        p = _normalise_proxy(chunk)
        if p:
            proxies.append(p)

    list_url = os.getenv("WEBSHARE_LIST_URL", "").strip()
    if list_url:
        try:
            resp = requests.get(list_url, timeout=TIMEOUT)
            resp.raise_for_status()
            for chunk in resp.text.splitlines():
                p = _normalise_proxy(chunk)
                if p:
                    proxies.append(p)
        except requests.RequestException as e:
            print(f"  ! could not fetch WEBSHARE_LIST_URL: {e}", file=sys.stderr)

    # de-dupe, keep order
    seen, out = set(), []
    for p in proxies:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def fetch(url: str, proxies: list[str], *, stream: bool = False) -> requests.Response:
    """GET `url` through a random proxy, rotating on failure."""
    if not proxies:
        raise SystemExit(
            "No proxies configured. Set WEBSHARE_PROXIES or WEBSHARE_LIST_URL in ingest/.env"
        )
    last_err: Exception | None = None
    pool = proxies[:]
    random.shuffle(pool)
    for attempt in range(1, MAX_ATTEMPTS + 1):
        proxy = pool[(attempt - 1) % len(pool)]
        host = urlparse(proxy).hostname
        try:
            resp = requests.get(
                url,
                headers=HEADERS,
                proxies={"http": proxy, "https": proxy},
                timeout=TIMEOUT,
                stream=stream,
            )
            if resp.status_code == 200:
                return resp
            last_err = RuntimeError(f"HTTP {resp.status_code}")
            print(f"  attempt {attempt}: {host} -> HTTP {resp.status_code}")
        except requests.RequestException as e:
            last_err = e
            print(f"  attempt {attempt}: {host} -> {type(e).__name__}")
        time.sleep(1.5)
    raise RuntimeError(f"Failed after {MAX_ATTEMPTS} attempts: {last_err}")


def list_resources(proxies: list[str]) -> list[dict]:
    print(f"Fetching resource list for dataset '{DATASET_ID}' ...")
    resp = fetch(PACKAGE_SHOW, proxies)
    data = resp.json()
    if not data.get("success"):
        raise RuntimeError(f"CKAN returned success=false: {data}")
    return data["result"]["resources"]


def safe_filename(res: dict) -> str:
    url = res.get("url", "")
    name = os.path.basename(urlparse(url).path) or (res.get("name", "resource") + ".csv")
    return name.replace(" ", "_")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="list resources, download nothing")
    args = ap.parse_args()

    proxies = load_proxies()
    print(f"Loaded {len(proxies)} proxy/proxies.")

    resources = list_resources(proxies)
    csvs = [r for r in resources if (r.get("format") or "").upper() == "CSV"]
    print(f"\nDataset license: see catalogue. Resources: {len(resources)} total, {len(csvs)} CSV.\n")
    for r in resources:
        print(f"  [{(r.get('format') or '?').upper():5}] {r.get('name')}")
        print(f"          {r.get('url')}")

    if args.list:
        return

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nDownloading {len(csvs)} CSV file(s) into {RAW_DIR} ...")
    for r in csvs:
        fname = safe_filename(r)
        dest = RAW_DIR / fname
        print(f"  -> {fname}")
        resp = fetch(r["url"], proxies, stream=True)
        with open(dest, "wb") as fh:
            for block in resp.iter_content(chunk_size=1 << 16):
                fh.write(block)
        print(f"     saved {dest.stat().st_size:,} bytes")

    print("\nDone. Next: inspect columns and build the schema.")


if __name__ == "__main__":
    main()
