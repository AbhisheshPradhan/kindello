import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const envText = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env"), "utf8");
const raw = (envText.split("\n").find((l)=>l.startsWith("WEBSHARE_PROXIES="))??"").slice(17).replace(/^["']|["']$/g,"");
const P = raw.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
const u = new URL(P[0]); const proxy={server:`${u.hostname}:${u.port}`,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)};
const b = await puppeteer.launch({executablePath:CHROME,headless:true,args:[`--proxy-server=${proxy.server}`,"--no-sandbox"]});
const page = await b.newPage();
await page.authenticate({username:proxy.username,password:proxy.password});
await page.goto("https://www.bing.com/search?q="+encodeURIComponent("Munchkin Manor Early Learning Centre Carlingford NSW childcare"),{waitUntil:"domcontentloaded",timeout:25000});
console.log("TITLE:", await page.title());
console.log("URL:", page.url());
const counts = await page.evaluate(()=>({
  allLinks: document.querySelectorAll("a").length,
  b_results: document.querySelectorAll("#b_results").length,
  b_algo: document.querySelectorAll(".b_algo").length,
  h2a: document.querySelectorAll("h2 a").length,
}));
console.log("COUNTS:", JSON.stringify(counts));
console.log("BODY SNIPPET:", (await page.evaluate(()=>document.body.innerText)).slice(0,300).replace(/\n+/g," "));
await b.close();
