// Keyless enrichment crawler (concurrent, bandwidth-frugal).
// For each service still missing a website: search Bing (via rotating Webshare
// residential proxy + stealth Chrome) -> pick the centre's own site (filter out
// directories/social/gov) -> fetch it -> verify it mentions the centre -> scrape
// email + hero image URL -> write to services_meta. No API keys.
//
// A pool of workers runs in parallel, each pinned to its own proxy (rotated every
// PROXY_ROTATE_EVERY centres). Images/CSS/fonts/media are blocked at the network
// layer — we only need the HTML text + the og:image URL — which cuts proxy
// bandwidth ~80% and speeds every page load.
//
// Usage:
//   node crawl.js --limit 50              # process up to 50 (testing)
//   node crawl.js --limit 20000 --workers 10   # full loop
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

const BLOCK = /facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|careforkids|kindicare|startingblocks|acecqa|yellowpages|truelocal|whereis|localsearch|mychild|childcarefinder|toddle\.com|google\.|bing\.|microsoft|wikipedia|abc\.net\.au|gov\.au|seek\.com|indeed|yelp|tripadvisor|pinterest|wix\.com|squarespace\.com/i;
const STOP = new Set(["early","learning","centre","center","child","care","childcare","kindergarten","preschool","school","community","oshc","education","educational","services","service"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tokens = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));

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
  await page.setDefaultNavigationTimeout(25000);
  return page;
}

async function discover(browser, name, suburb, state) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const page = await newPage(browser);
    try {
      const q = encodeURIComponent(`${name} ${suburb} ${state} childcare`);
      await page.goto(`https://www.bing.com/search?q=${q}`, { waitUntil: "domcontentloaded" });
      const cites = await page.evaluate(() => Array.from(document.querySelectorAll(".b_algo cite")).map((c) => c.innerText));
      for (const cite of cites) {
        const url = cite.split(/[›»]/)[0].trim();
        if (!/^https?:\/\//.test(url) || BLOCK.test(url)) continue;
        try { return new URL(url).origin; } catch { /* skip */ }
      }
      if (cites.length > 0) return null;
    } catch { /* retry */ } finally { await page.close().catch(() => {}); }
    await sleep(1500);
  }
  return null;
}

async function inspect(browser, site, name, suburb) {
  const page = await newPage(browser);
  try {
    await page.goto(site, { waitUntil: "domcontentloaded" });
    const data = await page.evaluate(() => ({
      text: document.body.innerText,
      mailtos: Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => a.href.replace(/^mailto:/, "").split("?")[0]),
      og: document.querySelector('meta[property="og:image"]')?.content || null,
    }));
    const hay = data.text.toLowerCase();
    const verified = tokens(name).some((t) => hay.includes(t)) || hay.includes(suburb.toLowerCase());
    const emailMatch = (data.text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i) || [])[0];
    const email = data.mailtos[0] || (emailMatch && !/\.(png|jpg|jpeg|gif|webp)$/i.test(emailMatch) ? emailMatch : null);
    const photos = data.og ? [{ url: new URL(data.og, site).href, source: "operator-website", fetched_at: new Date().toISOString().slice(0, 10) }] : [];
    return { verified, email, photos };
  } catch {
    return { verified: false, email: null, photos: [] };
  } finally { await page.close().catch(() => {}); }
}

const UPDATE = `UPDATE services_meta SET
  website=$2, website_source='search-bing', website_verified=$3, email=$4,
  photos = CASE WHEN $5::jsonb = '[]'::jsonb THEN photos ELSE $5::jsonb END,
  discovered_at=now()
  WHERE service_approval_number=$1`;

const stats = { done: 0, found: 0, verified: 0, emails: 0 };

async function worker(id, queue, pool) {
  let browser = await launch(id), processed = 0;
  while (queue.length) {
    const r = queue.pop();
    if (!r) break;
    if (processed > 0 && processed % PROXY_ROTATE_EVERY === 0) { await browser.close().catch(() => {}); browser = await launch(id + processed); }
    try {
      const site = await discover(browser, r.name, r.suburb, r.state);
      let v = false, email = null, photos = [];
      if (site) ({ verified: v, email, photos } = await inspect(browser, site, r.name, r.suburb));
      await pool.query(UPDATE, [r.id, site, site ? v : null, email, JSON.stringify(photos)]);
      if (site) stats.found++; if (v) stats.verified++; if (email) stats.emails++;
    } catch { /* row stays unprocessed-safe: discovered_at not set on throw before query */ }
    processed++; stats.done++;
    if (stats.done % 25 === 0) console.log(`[${new Date().toISOString().slice(11, 19)}] ${stats.done} done | ${stats.found} sites, ${stats.verified} verified, ${stats.emails} emails`);
    await sleep(500 + Math.random() * 1000);
  }
  await browser.close().catch(() => {});
}

(async () => {
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: WORKERS + 1 });
  const { rows } = await pool.query(
    `SELECT s.service_approval_number AS id, s.service_name AS name, s.suburb, s.state
     FROM services s JOIN services_meta m USING (service_approval_number)
     WHERE m.discovered_at IS NULL AND s.service_name IS NOT NULL
     ORDER BY s.service_approval_number LIMIT $1`, [LIMIT]);
  console.log(`to process: ${rows.length} | workers: ${WORKERS} | proxies: ${PROXIES.length}`);
  const queue = rows.slice().reverse();   // pop() takes from the end
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i, queue, pool)));
  console.log(`\nDONE: ${stats.found}/${rows.length} sites (${stats.verified} verified), ${stats.emails} emails`);
  await pool.end();
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
