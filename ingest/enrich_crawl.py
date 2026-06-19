"""Keyless enrichment crawler (fast HTTP path).

For each service still missing a website: search DuckDuckGo HTML through a rotating
Webshare residential proxy -> pick the centre's own site (filter out
directories/social/gov) -> fetch it -> verify it mentions the centre -> scrape
email + hero-image URL -> write to services_meta. No API keys, no browser.

Plain `requests` (DDG's HTML endpoint and operator pages are static — no JS needed
for og:image/email/text), so we run high thread concurrency: the full 18k loop is
~1-2h instead of ~2 days. Resumable: only rows with discovered_at IS NULL are
pulled, and discovered_at is set once a row is written, so a re-run continues.

Usage:
  python enrich_crawl.py --limit 40                 # test batch
  python enrich_crawl.py --limit 20000 --workers 25 # full loop
"""
from __future__ import annotations

import argparse
import os
import random
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import unquote, urlsplit

import psycopg
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
PROXIES = [x.strip() for x in (os.getenv("WEBSHARE_PROXIES", "")).replace(",", "\n").split("\n") if x.strip()]

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept-Language": "en-AU,en;q=0.9"}
BLOCK = re.compile(r"facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|careforkids|kindicare|startingblocks|acecqa|yellowpages|truelocal|whereis|localsearch|mychild|childcarefinder|toddle\.com|google\.|bing\.|duckduckgo|microsoft|wikipedia|abc\.net\.au|gov\.au|seek\.com|indeed|yelp|tripadvisor|pinterest|wix\.com|squarespace\.com", re.I)
STOP = {"early", "learning", "centre", "center", "child", "care", "childcare", "kindergarten", "preschool", "school", "community", "oshc", "education", "educational", "services", "service", "the", "and"}
EMAIL_RE = re.compile(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", re.I)

_local = threading.local()


def conn() -> psycopg.Connection:
    if not hasattr(_local, "conn"):
        _local.conn = psycopg.connect(DATABASE_URL, autocommit=True)
    return _local.conn


def proxy_dict() -> dict:
    p = random.choice(PROXIES)
    return {"http": p, "https": p}


def tokens(name: str) -> list[str]:
    return [w for w in re.sub(r"[^a-z0-9 ]", " ", (name or "").lower()).split() if len(w) > 3 and w not in STOP]


def ddg_real(href: str) -> str:
    m = re.search(r"uddg=([^&]+)", href)
    return unquote(m.group(1)) if m else href


def discover(name: str, suburb: str, state: str) -> tuple[str | None, bool]:
    """Returns (origin, blocked). blocked=True means the request failed/was
    throttled (no usable results page) -> caller should NOT record it as a miss,
    leave the row for a later retry. blocked=False with origin=None is a genuine
    "DDG had results, none were the centre's own site"."""
    q = requests.utils.quote(f"{name} {suburb} {state} childcare")
    for _ in range(3):
        try:
            r = requests.get(f"https://html.duckduckgo.com/html/?q={q}", headers=HEADERS, proxies=proxy_dict(), timeout=15)
            if r.status_code != 200 or not r.text:
                time.sleep(1.5)
                continue
            hrefs = re.findall(r'class="result__a"[^>]*href="([^"]+)"', r.text)
            for href in hrefs:
                url = ddg_real(href.replace("&amp;", "&"))
                if not url.startswith("http") or BLOCK.search(url):
                    continue
                s = urlsplit(url)
                return f"{s.scheme}://{s.netloc}", False
            if hrefs:
                return None, False  # had results, none qualified -> genuine miss
            # 200 but zero result links == DDG served a challenge/empty page -> blocked
        except Exception:
            pass
        time.sleep(1.5)
    return None, True  # all attempts failed/empty -> blocked, retry later


def inspect(site: str, name: str, suburb: str) -> tuple[bool, str | None, list]:
    try:
        r = requests.get(site, headers=HEADERS, proxies=proxy_dict(), timeout=15)
        html = r.text
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text(" ").lower()
        verified = any(t in text for t in tokens(name)) or suburb.lower() in text

        email = None
        for a in soup.select('a[href^="mailto:"]'):
            email = a.get("href", "").replace("mailto:", "").split("?")[0].strip()
            if email:
                break
        if not email:
            m = EMAIL_RE.search(soup.get_text(" "))
            if m and not re.search(r"\.(png|jpe?g|gif|webp)$", m.group(0), re.I):
                email = m.group(0)

        photos = []
        og = soup.find("meta", attrs={"property": "og:image"})
        if og and og.get("content"):
            from urllib.parse import urljoin
            photos = [{"url": urljoin(site, og["content"]), "source": "operator-website", "fetched_at": time.strftime("%Y-%m-%d")}]
        return verified, email, photos
    except Exception:
        return False, None, []


UPDATE = """
UPDATE services_meta SET
  website=%s, website_source='search-ddg', website_verified=%s, email=%s,
  photos = CASE WHEN %s::jsonb = '[]'::jsonb THEN photos ELSE %s::jsonb END,
  discovered_at=now()
WHERE service_approval_number=%s
"""

stats = {"done": 0, "found": 0, "verified": 0, "emails": 0, "blocked": 0}
lock = threading.Lock()


def handle(row: dict) -> None:
    import json
    site, blocked = discover(row["name"], row["suburb"] or "", row["state"] or "")
    if blocked:
        with lock:
            stats["blocked"] += 1
        return  # leave discovered_at NULL -> retried on a later run
    verified, email, photos = (False, None, [])
    if site:
        verified, email, photos = inspect(site, row["name"], row["suburb"] or "")
    pj = json.dumps(photos)
    conn().execute(UPDATE, (site, verified if site else None, email, pj, pj, row["id"]))
    with lock:
        stats["done"] += 1
        if site:
            stats["found"] += 1
        if verified:
            stats["verified"] += 1
        if email:
            stats["emails"] += 1
        if stats["done"] % 100 == 0:
            print(f"[{time.strftime('%H:%M:%S')}] {stats['done']} done ({stats['blocked']} blocked/retry) | {stats['found']} sites, {stats['verified']} verified, {stats['emails']} emails", flush=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=40)
    ap.add_argument("--workers", type=int, default=10)
    args = ap.parse_args()
    if not DATABASE_URL:
        sys.exit("DATABASE_URL not set (ingest/.env).")

    with psycopg.connect(DATABASE_URL, row_factory=psycopg.rows.dict_row) as c:
        rows = c.execute(
            """SELECT s.service_approval_number AS id, s.service_name AS name, s.suburb, s.state
               FROM services s JOIN services_meta m USING (service_approval_number)
               WHERE m.discovered_at IS NULL AND s.service_name IS NOT NULL
               ORDER BY s.service_approval_number LIMIT %s""", (args.limit,)
        ).fetchall()

    print(f"to process: {len(rows)} | workers: {args.workers} | proxies: {len(PROXIES)}", flush=True)
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        list(ex.map(handle, rows))
    dt = time.time() - t0
    print(f"\nDONE: {stats['found']}/{stats['done']} sites ({stats['verified']} verified), {stats['emails']} emails, "
          f"{stats['blocked']} blocked(left for retry) in {dt:.0f}s ({dt / max(len(rows),1):.1f}s/centre)", flush=True)


if __name__ == "__main__":
    main()
