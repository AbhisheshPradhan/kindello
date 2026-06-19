// Keyless enrichment crawler — Puppeteer + DuckDuckGo (the reliable path).
// Stealth Chrome through rotating Webshare residential proxies passes both the
// search-engine bot-check AND operator-site WAFs that 403 plain HTTP.
//
// Per service still missing a website: search DuckDuckGo -> pick the centre's own
// site (filter directories/social/gov) -> fetch it -> verify it mentions the
// centre -> scrape email (+ /contact fallback), hero image, and brand logo ->
// write to services_meta. No API keys.
//
//   node crawl.js --limit 200 --workers 8     # benchmark / full loop
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
const PROXY_ROTATE_EVERY = 25;

const envText = fs.readFileSync(path.join(DIR, "..", ".env"), "utf8");
const envVal = (k) => (envText.split("\n").find((l) => l.startsWith(k + "=")) ?? "").slice(k.length + 1).replace(/^["']|["']$/g, "");
const DATABASE_URL = envVal("DATABASE_URL");
const PROXIES = envVal("WEBSHARE_PROXIES").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
const WORKERS = Number(arg("--workers", Math.min(8, PROXIES.length)));
const proxyAt = (i) => { const u = new URL(PROXIES[i % PROXIES.length]); return { server: `${u.hostname}:${u.port}`, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) }; };

const BLOCK = /facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|careforkids|kindicare|startingblocks|acecqa|yellowpages|truelocal|whereis|localsearch|mychild|childcarefinder|toddle\.com|google\.|bing\.|duckduckgo|microsoft|wikipedia|abc\.net\.au|gov\.au|seek\.com|indeed|yelp|tripadvisor|pinterest|wix\.com|squarespace\.com/i;
const STOP = new Set(["early","learning","centre","center","child","care","childcare","kindergarten","preschool","school","community","oshc","education","educational","services","service"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tokens = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
const decodeEmail = (e) => { try { e = decodeURIComponent(e); } catch { /* leave */ } return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e) && !/\.(png|jpe?g|gif|webp)$/i.test(e) ? e : null; };

async function launch(i) {
  const proxy = proxyAt(i);
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: [`--proxy-server=${proxy.server}`, "--no-sandbox"] });
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
  } catch { /* fall through to blocked */ } finally { await page.close().catch(() => {}); }
  return { origin: null, blocked: true };
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
    return {
      text: document.body ? document.body.innerText : "",
      mailtos: Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => a.getAttribute("href").replace(/^mailto:/, "").split("?")[0]),
      og: document.querySelector('meta[property="og:image"]')?.content || null,
      logo: logo ? abs(logo) : null,
    };
  });
}

async function inspect(browser, site, name, suburb) {
  const page = await newPage(browser);
  try {
    const resp = await page.goto(site, { waitUntil: "domcontentloaded" });
    if (resp && resp.status() >= 400) return { verified: false, email: null, photos: [], logo: null };
    const d = await extract(page);
    const hay = d.text.toLowerCase();
    const verified = tokens(name).some((t) => hay.includes(t)) || hay.includes(suburb.toLowerCase());
    let email = null;
    for (const m of d.mailtos) { email = decodeEmail(m); if (email) break; }
    if (!email) { const m = decodeURIComponent(d.text).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i); if (m) email = decodeEmail(m[0]); }
    const photos = d.og ? [{ url: d.og, source: "operator-website", fetched_at: new Date().toISOString().slice(0, 10) }] : [];

    // /contact fallback for email only (common location for it)
    if (!email) {
      for (const p of ["/contact", "/contact-us"]) {
        try {
          const r2 = await page.goto(new URL(p, site).href, { waitUntil: "domcontentloaded" });
          if (r2 && r2.status() < 400) {
            const d2 = await extract(page);
            for (const m of d2.mailtos) { email = decodeEmail(m); if (email) break; }
            if (!email) { const m = decodeURIComponent(d2.text).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i); if (m) email = decodeEmail(m[0]); }
          }
        } catch { /* skip */ }
        if (email) break;
      }
    }
    return { verified, email, photos, logo: d.logo };
  } catch {
    return { verified: false, email: null, photos: [], logo: null };
  } finally { await page.close().catch(() => {}); }
}

const UPDATE = `UPDATE services_meta SET
  website=$2, website_source='search-ddg', website_verified=$3, email=$4, logo_url=$5,
  photos = CASE WHEN $6::jsonb = '[]'::jsonb THEN photos ELSE $6::jsonb END,
  discovered_at=now()
  WHERE service_approval_number=$1`;

const stats = { done: 0, found: 0, verified: 0, emails: 0, logos: 0, photos: 0, blocked: 0 };

// Async pool of browsers (one per proxy/IP). take() hands out a free IP index,
// give() returns it (waking any waiter). A request that blocks on one IP releases
// it and take()s another, so retries land on a DIFFERENT IP.
function makePool(n) {
  const idle = Array.from({ length: n }, (_, i) => i);
  const waiters = [];
  return {
    take: () => new Promise((res) => (idle.length ? res(idle.shift()) : waiters.push(res))),
    give: (i) => (waiters.length ? waiters.shift()(i) : idle.push(i)),
  };
}

async function processCentre(r, browsers, uses, pool, db) {
  // discover with cross-IP retry: try up to 4 *different* IPs before giving up.
  let site = null, ok = false;
  for (let k = 0; k < 4; k++) {
    const bi = await pool.take();
    let res;
    try { res = await discoverOnce(browsers[bi], r.name, r.suburb, r.state); }
    catch { res = { origin: null, blocked: true }; }
    finally { await recycle(bi, browsers, uses); pool.give(bi); }
    if (!res.blocked) { site = res.origin; ok = true; break; }
    await sleep(250);
  }
  if (!ok) { stats.blocked++; return; }            // every IP blocked -> leave for re-run

  let v = false, email = null, photos = [], logo = null;
  if (site) {
    const bi = await pool.take();
    try { ({ verified: v, email, photos, logo } = await inspect(browsers[bi], site, r.name, r.suburb)); }
    catch { /* keep the site, lose enrichment */ }
    finally { await recycle(bi, browsers, uses); pool.give(bi); }
  }
  await db.query(UPDATE, [r.id, site, site ? v : null, email, logo, JSON.stringify(photos)]);
  stats.done++;
  if (site) stats.found++; if (v) stats.verified++; if (email) stats.emails++; if (logo) stats.logos++; if (photos.length) stats.photos++;
  if (stats.done % 50 === 0) console.log(`[${new Date().toISOString().slice(11, 19)}] ${stats.done} done (${stats.blocked} blk) | ${stats.found} sites, ${stats.verified} verified, ${stats.logos} logos, ${stats.photos} photos, ${stats.emails} emails`);
}

// Recycle a browser process every N uses for memory hygiene (stays on same IP).
async function recycle(i, browsers, uses) {
  if (++uses[i] >= 120) { try { await browsers[i].close(); } catch { /* ignore */ } browsers[i] = await launch(i); uses[i] = 0; }
}

(async () => {
  const db = new pg.Pool({ connectionString: DATABASE_URL, max: Math.min(WORKERS, PROXIES.length) + 2 });
  const { rows } = await db.query(
    `SELECT s.service_approval_number AS id, s.service_name AS name, s.suburb, s.state
     FROM services s JOIN services_meta m USING (service_approval_number)
     WHERE m.discovered_at IS NULL AND s.service_name IS NOT NULL
     ORDER BY s.service_approval_number LIMIT $1`, [LIMIT]);

  const N = Math.min(WORKERS, PROXIES.length);     // one browser per IP
  console.log(`to process: ${rows.length} | IPs/browsers: ${N} | proxies: ${PROXIES.length}`);
  const browsers = await Promise.all(Array.from({ length: N }, (_, i) => launch(i)));
  const uses = new Array(N).fill(0);
  const pool = makePool(N);
  const queue = rows.slice().reverse();

  const t0 = Date.now();
  // N concurrent runners pull from the shared queue; the pool caps real parallelism to N IPs.
  await Promise.all(Array.from({ length: N }, async () => {
    let r; while ((r = queue.pop())) { try { await processCentre(r, browsers, uses, pool, db); } catch { /* skip */ } await sleep(200 + Math.random() * 400); }
  }));
  const dt = (Date.now() - t0) / 1000;
  console.log(`\nDONE in ${dt.toFixed(0)}s (${(dt / Math.max(stats.done, 1)).toFixed(1)}s/centre): ${stats.found}/${stats.done} sites, ${stats.verified} verified, ${stats.logos} logos, ${stats.photos} photos, ${stats.emails} emails | ${stats.blocked} blocked(retry)`);
  await Promise.all(browsers.map((b) => b.close().catch(() => {})));
  await db.end();
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
