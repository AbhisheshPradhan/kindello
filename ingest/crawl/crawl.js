// Keyless enrichment crawler — Puppeteer + DuckDuckGo (the reliable path).
// Stealth Chrome through rotating Webshare residential proxies passes both the
// search-engine bot-check AND operator-site WAFs that 403 plain HTTP.
//
// Per service still missing a website: search DuckDuckGo -> pick the centre's own
// site (filter directories/social/gov) -> fetch it -> verify it mentions the
// centre -> scrape email (+ /contact fallback), hero image, and brand logo ->
// write to services_meta. No API keys.
//
// Pool design: ONE browser per proxy/IP (all of them), but only --workers rows
// run concurrently (WORKERS < IPs), so the pool always has idle IPs. On a block
// a row retries on a *different, not-yet-tried* IP (exclude-aware pool), and the
// failed IP drops to the back of the FIFO -> built-in cooldown. IPs are tried
// last-to-first (the tail of WEBSHARE_PROXIES is the freshest, least-used band).
//
//   node crawl.js --limit 20000 --workers 5   # full loop / mop-up
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const LIMIT = Number(arg("--limit", 20));
// --refresh: re-process EVERY row (not just discovered_at IS NULL). Rows that
// already have a website skip discovery and just get re-inspected with the current
// photo/logo logic (lossless — we don't re-gamble DDG on sites we already found);
// rows with no site still get full discovery. Use it to scrub the old og-junk photos.
const REFRESH = process.argv.includes("--refresh");
// --retry-blocked: re-process ONLY the rows logged in blocked.csv (re-inspect their
// known URL on fresh IP draws). The old blocked.csv is rotated to blocked.prev.csv
// first, so the new blocked.csv ends up holding just the still-failing residual.
const RETRY_BLOCKED = process.argv.includes("--retry-blocked");
const DISCOVER_TRIES = 4;   // distinct IPs to try for the DDG search before deferring the row
const INSPECT_TRIES = 3;    // distinct IPs to try for the operator-site fetch before site-only

const envText = fs.readFileSync(path.join(DIR, "..", ".env"), "utf8");
const envVal = (k) => (envText.split("\n").find((l) => l.startsWith(k + "=")) ?? "").slice(k.length + 1).replace(/^["']|["']$/g, "");
const DATABASE_URL = envVal("DATABASE_URL");
// Reverse so index 0 = the LAST proxy in .env (the freshest / never-used band);
// the pool hands out from the front first, so retries start on fresh IPs.
const PROXIES = envVal("WEBSHARE_PROXIES").split(/[,\n]/).map((s) => s.trim()).filter(Boolean).reverse();
const WORKERS = Math.min(Number(arg("--workers", 5)), PROXIES.length);
const proxyAt = (i) => { const u = new URL(PROXIES[i % PROXIES.length]); return { server: `${u.hostname}:${u.port}`, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) }; };

const BLOCK = /facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|careforkids|kindicare|startingblocks|acecqa|yellowpages|truelocal|whereis|localsearch|mychild|childcarefinder|toddle\.com|google\.|bing\.|duckduckgo|microsoft|wikipedia|abc\.net\.au|gov\.au|seek\.com|indeed|yelp|tripadvisor|pinterest|wix\.com|squarespace\.com/i;
const STOP = new Set(["early","learning","centre","center","child","care","childcare","kindergarten","preschool","school","community","oshc","education","educational","services","service"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tokens = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
const decodeEmail = (e) => { try { e = decodeURIComponent(e); } catch { /* leave */ } return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e) && !/\.(png|jpe?g|gif|webp)$/i.test(e) ? e : null; };
const errMsg = (e) => String((e && e.message) || e || "blocked").replace(/\s+/g, " ").trim().slice(0, 160);

// Failure log: one row per centre that blocked out (every IP tried). Records WHY
// it failed, the website URL we were on, and each IP it tried with that IP's error.
const BLOCKED_LOG = path.join(DIR, "blocked.csv");
const csvCell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
function logBlocked(stage, r, url, attempts) {
  const line = [new Date().toISOString(), stage, r.id, csvCell(r.name), csvCell(r.suburb), csvCell(url), csvCell(attempts.join(" | "))].join(",") + "\n";
  fs.appendFileSync(BLOCKED_LOG, line);
}
// Pull the distinct ids out of blocked.csv (ts,stage,id,... — first 3 cols are
// comma-free/unquoted, so split(",")[2] is the id), for --retry-blocked.
function readBlockedIds() {
  if (!fs.existsSync(BLOCKED_LOG)) return [];
  const ids = new Set();
  for (const l of fs.readFileSync(BLOCKED_LOG, "utf8").split("\n").slice(1)) {
    const id = l.split(",")[2];
    if (id && /^[A-Z]+-\d+$/.test(id)) ids.add(id);
  }
  return [...ids];
}

async function launch(i) {
  const proxy = proxyAt(i);
  // acceptInsecureCerts (Puppeteer 23+ renamed it from ignoreHTTPSErrors): many small
  // operator sites have expired/mismatched certs (net::ERR_CERT_*) — load them anyway.
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, acceptInsecureCerts: true, args: [`--proxy-server=${proxy.server}`, "--no-sandbox"] });
  b.__proxy = proxy;
  return b;
}
async function newPage(browser) {
  const page = await browser.newPage();
  await page.authenticate({ username: browser.__proxy.username, password: browser.__proxy.password });
  await page.setRequestInterception(true);
  page.on("request", (req) => (["image", "stylesheet", "font", "media"].includes(req.resourceType()) ? req.abort() : req.continue()));
  await page.setDefaultNavigationTimeout(20000);
  return page;
}

function ddgReal(href) { const m = /uddg=([^&]+)/.exec(href || ""); try { return m ? decodeURIComponent(m[1]) : href; } catch { return href; } }

// Single DDG attempt through ONE browser/IP. { origin, blocked }:
// blocked=true => request failed/throttled on this IP -> caller retries on a different IP.
async function discoverOnce(browser, name, suburb, state) {
  const page = await newPage(browser);
  let error = "no DDG results (soft-block?)";
  try {
    const q = encodeURIComponent(`${name} ${suburb} ${state} childcare`);
    await page.goto(`https://html.duckduckgo.com/html/?q=${q}`, { waitUntil: "domcontentloaded" });
    const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll("a.result__a")).map((a) => a.getAttribute("href")));
    for (const href of hrefs) {
      const url = ddgReal(href);
      if (!/^https?:\/\//.test(url) || BLOCK.test(url)) continue;
      try { return { origin: new URL(url).origin, blocked: false }; } catch { /* skip */ }
    }
    if (hrefs.length > 0) return { origin: null, blocked: false }; // results, none qualified -> genuine miss
  } catch (e) { error = errMsg(e); } finally { await page.close().catch(() => {}); }
  return { origin: null, blocked: true, error };
}

// pull text/email/og/logo out of the current page
async function extract(page) {
  return page.evaluate(() => {
    const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
    let logo = null;
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { const d = JSON.parse(s.textContent); for (const o of (Array.isArray(d) ? d : [d])) { let l = o && o.logo; if (l && typeof l === "object") l = l.url; if (typeof l === "string" && l) { logo = l; break; } } } catch { /* skip */ }
      if (logo) break;
    }
    if (!logo) for (const img of document.querySelectorAll("img")) {
      const hay = ((img.getAttribute("src") || "") + " " + (img.getAttribute("alt") || "") + " " + (img.className || "") + " " + (img.id || "")).toLowerCase();
      if (hay.includes("logo") && img.getAttribute("src")) { logo = img.getAttribute("src"); break; }
    }
    if (!logo) { const l = document.querySelector('link[rel~="apple-touch-icon"], link[rel~="icon"]'); if (l) logo = l.getAttribute("href"); }

    // photos: real <img> tags on the page (NOT the logo, icons or sprites). We do
    // NOT use og:image — it's an arbitrary share thumbnail (could be anything), not
    // a reliable centre photo. Carousel/slider/gallery/hero first, then any content img.
    const BADIMG = /logo|icon|favicon|sprite|placeholder|avatar|spinner|load(er|ing)|pixel|map-marker|facebook|twitter|instagram/i;
    const GOODIMG = /\.(jpe?g|png|webp|gif|avif)([?&/#]|$)/i;   // must actually look like a raster image (drops /cron pixels, .svg marks)
    const seen = new Set();
    if (logo) { const la = abs(logo); if (la) seen.add(la); }   // never list the logo as a photo
    const images = [];
    const addImg = (img) => { const u = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || img.getAttribute("data-original"); if (!u) return; const a = abs(u); if (!a || seen.has(a) || /^data:/.test(a) || !GOODIMG.test(a) || BADIMG.test(a)) return; seen.add(a); images.push(a); };
    document.querySelectorAll('.swiper-slide img,.slick-slide img,[class*="carousel"] img,[class*="slide"] img,[class*="gallery"] img,[class*="banner"] img,[class*="hero"] img').forEach(addImg);
    document.querySelectorAll("img").forEach(addImg);

    return {
      text: document.body ? document.body.innerText : "",
      mailtos: Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => a.getAttribute("href").replace(/^mailto:/, "").split("?")[0]),
      images,
      logo: logo ? abs(logo) : null,
    };
  });
}

// blocked=true => the fetch failed/WAF'd on this IP (caller retries on another IP).
// A clean load with no email/logo is NOT blocked — it's a genuine result.
async function inspect(browser, site, name, suburb) {
  const page = await newPage(browser);
  try {
    const resp = await page.goto(site, { waitUntil: "domcontentloaded" });
    if (resp && resp.status() >= 400) return { blocked: true, error: `HTTP ${resp.status()}`, verified: false, email: null, photos: [], logo: null };
    const d = await extract(page);
    const hay = d.text.toLowerCase();
    const verified = tokens(name).some((t) => hay.includes(t)) || hay.includes(suburb.toLowerCase());
    let email = null;
    for (const m of d.mailtos) { email = decodeEmail(m); if (email) break; }
    if (!email) { const m = d.text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i); if (m) email = decodeEmail(m[0]); }
    const today = new Date().toISOString().slice(0, 10);
    const photos = d.images.slice(0, 6).map((url) => ({ url, source: "operator-website", fetched_at: today }));

    // /contact fallback for email only (common location for it)
    if (!email) {
      for (const p of ["/contact", "/contact-us"]) {
        try {
          const r2 = await page.goto(new URL(p, site).href, { waitUntil: "domcontentloaded" });
          if (r2 && r2.status() < 400) {
            const d2 = await extract(page);
            for (const m of d2.mailtos) { email = decodeEmail(m); if (email) break; }
            if (!email) { const m = d2.text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i); if (m) email = decodeEmail(m[0]); }
          }
        } catch { /* skip */ }
        if (email) break;
      }
    }
    return { blocked: false, verified, email, photos, logo: d.logo };
  } catch (e) {
    return { blocked: true, error: errMsg(e), verified: false, email: null, photos: [], logo: null };
  } finally { await page.close().catch(() => {}); }
}

// COALESCE on the enrichment cols: a param is NULL only when inspect never
// succeeded (every IP blocked) -> keep whatever was already there. On a SUCCESSFUL
// inspect we pass the fresh values, INCLUDING photos='[]' (a real empty array) so
// stale/junk photos get cleared. website is always set (we always have a URL or null).
const UPDATE = `UPDATE services_meta SET
  website=$2, website_source='search-ddg',
  website_verified = COALESCE($3, website_verified),
  email   = COALESCE($4, email),
  logo_url = COALESCE($5, logo_url),
  photos   = COALESCE($6::jsonb, photos),
  discovered_at=now()
  WHERE service_approval_number=$1`;

const stats = { done: 0, found: 0, verified: 0, emails: 0, logos: 0, photos: 0, blocked: 0, inspectBlocked: 0 };
const ipStats = [];  // per browser index: { server, ok, blk } — filled at startup

// Async pool of browsers (one per proxy/IP). take(exclude) hands out a free IP
// index NOT in `exclude`; give() returns it to the back of the FIFO (cooldown).
// Because WORKERS < #browsers the pool always has slack, so a retry that passes
// the IP(s) it already tried in `exclude` is guaranteed a fresh, distinct IP.
const NOEXCLUDE = new Set();
function makePool(n) {
  const idle = Array.from({ length: n }, (_, i) => i);
  const waiters = [];  // { res, exclude }
  const serve = () => {
    for (let w = 0; w < waiters.length; w++) {
      const j = idle.findIndex((i) => !waiters[w].exclude.has(i));
      if (j >= 0) { const i = idle.splice(j, 1)[0]; const { res } = waiters[w]; waiters.splice(w, 1); res(i); return; }
    }
  };
  return {
    take: (exclude = NOEXCLUDE) => new Promise((res) => {
      const j = idle.findIndex((i) => !exclude.has(i));
      if (j >= 0) res(idle.splice(j, 1)[0]);
      else waiters.push({ res, exclude });
    }),
    give: (i) => { idle.push(i); serve(); },
  };
}

async function processCentre(r, browsers, uses, pool, db) {
  let site = null, ok = false;
  if ((REFRESH || RETRY_BLOCKED) && r.website) {     // reuse the site we already found — no re-gamble on DDG
    site = r.website; ok = true;
  } else {
    // discover with cross-IP retry: try up to DISCOVER_TRIES *distinct* IPs.
    const triedD = new Set();
    const attempts = [];                            // [ "ip reason", ... ] for the failure log
    for (let k = 0; k < DISCOVER_TRIES; k++) {
      const bi = await pool.take(triedD);
      triedD.add(bi);
      let res;
      try { res = await discoverOnce(browsers[bi], r.name, r.suburb, r.state); }
      catch (e) { res = { origin: null, blocked: true, error: errMsg(e) }; }
      finally { await recycle(bi, browsers, uses); pool.give(bi); }
      ipStats[bi][res.blocked ? "blk" : "ok"]++;
      if (res.blocked) attempts.push(`${ipStats[bi].server} ${res.error || "blocked"}`);
      if (!res.blocked) { site = res.origin; ok = true; break; }
      await sleep(250);
    }
    if (!ok) { stats.blocked++; logBlocked("discovery", r, "", attempts); return; }  // every IP blocked -> leave for re-run
  }

  // inspect with the same cross-IP retry; if every IP blocks, `inspected` stays
  // false -> we pass NULLs so the UPDATE's COALESCE keeps the existing enrichment.
  let v = false, email = null, photos = [], logo = null, inspected = false;
  if (site) {
    const triedI = new Set();
    const attempts = [];
    for (let k = 0; k < INSPECT_TRIES; k++) {
      const bi = await pool.take(triedI);
      triedI.add(bi);
      let res;
      try { res = await inspect(browsers[bi], site, r.name, r.suburb); }
      catch (e) { res = { blocked: true, error: errMsg(e) }; }
      finally { await recycle(bi, browsers, uses); pool.give(bi); }
      ipStats[bi][res.blocked ? "blk" : "ok"]++;
      if (res.blocked) attempts.push(`${ipStats[bi].server} ${res.error || "blocked"}`);
      if (!res.blocked) { ({ verified: v, email, photos, logo } = res); inspected = true; break; }
      await sleep(250);
    }
    // We have the URL but couldn't fetch the page on any IP -> log it for manual retrieval.
    if (!inspected) { stats.inspectBlocked++; logBlocked("inspect", r, site, attempts); }
  }
  // On a successful inspect pass fresh values (photos incl. '[]' to clear junk);
  // on a fully-blocked inspect pass NULLs so COALESCE preserves what's there.
  await db.query(UPDATE, [r.id, site, inspected ? v : null, email, logo, inspected ? JSON.stringify(photos) : null]);
  stats.done++;
  if (site) stats.found++; if (v) stats.verified++; if (email) stats.emails++; if (logo) stats.logos++; if (photos.length) stats.photos++;
  if (stats.done % 50 === 0) console.log(`[${new Date().toISOString().slice(11, 19)}] ${stats.done} done (${stats.blocked} disc-blk, ${stats.inspectBlocked} insp-blk) | ${stats.found} sites, ${stats.verified} verified, ${stats.logos} logos, ${stats.photos} photos, ${stats.emails} emails`);
}

// Recycle a browser process every N uses for memory hygiene (stays on same IP).
async function recycle(i, browsers, uses) {
  if (++uses[i] >= 120) { try { await browsers[i].close(); } catch { /* ignore */ } browsers[i] = await launch(i); uses[i] = 0; }
}

(async () => {
  const db = new pg.Pool({ connectionString: DATABASE_URL, max: Math.min(WORKERS, PROXIES.length) + 2 });

  // --retry-blocked: load the ids from blocked.csv, then rotate it aside so the run
  // writes a fresh blocked.csv = only the rows that STILL fail this pass.
  let retryIds = null;
  if (RETRY_BLOCKED) {
    retryIds = readBlockedIds();
    if (!retryIds.length) { console.log(`no blocked rows in ${BLOCKED_LOG} — nothing to retry`); await db.end(); return; }
    fs.renameSync(BLOCKED_LOG, BLOCKED_LOG.replace(/\.csv$/, ".prev.csv"));
    console.log(`retrying ${retryIds.length} blocked rows (old log -> blocked.prev.csv)`);
  }

  const { rows } = RETRY_BLOCKED
    ? await db.query(
        `SELECT s.service_approval_number AS id, s.service_name AS name, s.suburb, s.state, m.website
         FROM services s JOIN services_meta m USING (service_approval_number)
         WHERE s.service_approval_number = ANY($1) AND s.service_name IS NOT NULL
         ORDER BY s.service_approval_number LIMIT $2`, [retryIds, LIMIT])
    : await db.query(
        `SELECT s.service_approval_number AS id, s.service_name AS name, s.suburb, s.state, m.website
         FROM services s JOIN services_meta m USING (service_approval_number)
         WHERE s.service_name IS NOT NULL ${REFRESH ? "" : "AND m.discovered_at IS NULL"}
         ORDER BY s.service_approval_number LIMIT $1`, [LIMIT]);

  const N = PROXIES.length;                        // one browser per IP — all of them
  if (!fs.existsSync(BLOCKED_LOG)) fs.writeFileSync(BLOCKED_LOG, "ts,stage,id,name,suburb,url,attempts\n");
  console.log(`to process: ${rows.length} | workers: ${WORKERS} | IPs/browsers: ${N} | failures -> ${BLOCKED_LOG}`);
  const browsers = await Promise.all(Array.from({ length: N }, (_, i) => launch(i)));
  for (let i = 0; i < N; i++) ipStats[i] = { server: proxyAt(i).server, ok: 0, blk: 0 };
  const uses = new Array(N).fill(0);
  const pool = makePool(N);
  const queue = rows.slice().reverse();

  const t0 = Date.now();
  // WORKERS concurrent runners pull from the shared queue; the pool spreads their
  // requests (and retries) across all N IPs, keeping each IP's hit-rate low.
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    let r; while ((r = queue.pop())) { try { await processCentre(r, browsers, uses, pool, db); } catch { /* skip */ } await sleep(200 + Math.random() * 400); }
  }));
  const dt = (Date.now() - t0) / 1000;
  console.log(`\nDONE in ${dt.toFixed(0)}s (${(dt / Math.max(stats.done, 1)).toFixed(1)}s/centre): ${stats.found}/${stats.done} sites, ${stats.verified} verified, ${stats.logos} logos, ${stats.photos} photos, ${stats.emails} emails | ${stats.blocked} discovery-blocked(retry), ${stats.inspectBlocked} inspect-blocked(logged)`);
  console.log("per-IP (ok/blk):");
  for (const s of ipStats) { const t = s.ok + s.blk; console.log(`  ${s.server.padEnd(22)} ${s.ok}/${s.blk}${t ? `  ${Math.round((100 * s.blk) / t)}% blk` : ""}`); }
  await Promise.all(browsers.map((b) => b.close().catch(() => {})));
  await db.end();
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
