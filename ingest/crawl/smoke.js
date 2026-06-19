// Smoke test: launch system Chrome via puppeteer-core + stealth, route through a
// Webshare residential proxy, and confirm the exit IP is the proxy's (not ours).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Read WEBSHARE_PROXIES from ../.env (format: http://user:pass@host:port, comma/newline separated)
const envText = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env"), "utf8");
const line = envText.split("\n").find((l) => l.startsWith("WEBSHARE_PROXIES="));
const raw = (line ?? "").slice("WEBSHARE_PROXIES=".length).replace(/^["']|["']$/g, "");
const proxies = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

function parseProxy(url) {
  const u = new URL(url);
  return { server: `${u.hostname}:${u.port}`, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) };
}

async function exitIp(page) {
  await page.goto("https://api.ipify.org?format=json", { waitUntil: "domcontentloaded", timeout: 20000 });
  return JSON.parse(await page.evaluate(() => document.body.innerText)).ip;
}

(async () => {
  console.log(`proxies available: ${proxies.length}`);
  const proxy = parseProxy(proxies[0]);
  console.log(`using proxy server: ${proxy.server}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--proxy-server=${proxy.server}`, "--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.authenticate({ username: proxy.username, password: proxy.password });
    console.log(`exit IP via proxy: ${await exitIp(page)}`);

    // also confirm we can load a real operator site through the proxy
    await page.goto("https://www.goodstart.org.au", { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log(`operator site title: ${(await page.title()).slice(0, 60)}`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error("SMOKE FAIL:", e.message); process.exit(1); });
