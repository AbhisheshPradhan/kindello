// Discovery prototype: for each centre, search Bing through a rotating Webshare
// proxy, filter out directories/social/gov, and return the best website candidate.
// Prints a hit-rate so we can judge the approach before looping all 18k.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SAMPLE = [
  ["SE-40005936", "Whoosh Care Annandale Community Centre", "ANNANDALE", "NSW"],
  ["SE-40015913", "Happy Haven OSHC Evanston Gardens", "EVANSTON GARDENS", "SA"],
  ["SE-00011720", "St Joseph's School OSHC - Ottoway", "OTTOWAY", "SA"],
  ["SE-00000405", "Mojo's Nature Nest Early Learning", "LOGAN CENTRAL", "QLD"],
  ["SE-40014347", "Wild Cherry Kindergarten", "BAIRNSDALE", "VIC"],
  ["SE-00008362", "McMahons Point Community Preschool and Early Learning Centre", "MCMAHONS POINT", "NSW"],
  ["SE-40009872", "Kindy Zone Mount Sheridan", "MOUNT SHERIDAN", "QLD"],
  ["SE-00005051", "Kelly Club OSHC - Caroline Springs Brookside College", "CAROLINE SPRINGS", "VIC"],
  ["SE-40014362", "Munchkin Manor Early Learning Centre", "CARLINGFORD", "NSW"],
  ["SE-40001182", "Shepherd Early Learning Centre - St Nicholas", "PUNCHBOWL", "NSW"],
];

// Domains that are never the centre's own site.
const BLOCK = /facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|careforkids|kindicare|startingblocks|acecqa|yellowpages|truelocal|whereis|localsearch|mychild|childcarefinder|google\.|bing\.|microsoft|wikipedia|abc\.net\.au|gov\.au|seek\.com|indeed|yelp|tripadvisor|pinterest/i;

const envText = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env"), "utf8");
const raw = (envText.split("\n").find((l) => l.startsWith("WEBSHARE_PROXIES=")) ?? "").slice("WEBSHARE_PROXIES=".length).replace(/^["']|["']$/g, "");
const PROXIES = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
const pick = (i) => { const u = new URL(PROXIES[i % PROXIES.length]); return { server: `${u.hostname}:${u.port}`, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) }; };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function discover(browser, proxy, [, name, suburb, state]) {
  const page = await browser.newPage();
  await page.authenticate({ username: proxy.username, password: proxy.password });
  try {
    const q = encodeURIComponent(`${name} ${suburb} ${state} childcare`);
    await page.goto(`https://www.bing.com/search?q=${q}`, { waitUntil: "domcontentloaded", timeout: 25000 });
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("#b_results h2 a, #b_results .b_algo a")).map((a) => a.href)
    );
    const cand = links.find((h) => /^https?:\/\//.test(h) && !BLOCK.test(h));
    return cand ? new URL(cand).origin : null;
  } catch (e) {
    return `ERR:${e.message.slice(0, 30)}`;
  } finally {
    await page.close();
  }
}

(async () => {
  let hits = 0;
  for (let i = 0; i < SAMPLE.length; i++) {
    const proxy = pick(i);
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: [`--proxy-server=${proxy.server}`, "--no-sandbox"] });
    try {
      const site = await discover(browser, proxy, SAMPLE[i]);
      if (site && !site.startsWith("ERR")) hits++;
      console.log(`${SAMPLE[i][1].slice(0, 42).padEnd(44)} -> ${site ?? "(none found)"}`);
    } finally {
      await browser.close();
    }
    await sleep(1500 + Math.random() * 1500);
  }
  console.log(`\nhit rate: ${hits}/${SAMPLE.length}`);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
