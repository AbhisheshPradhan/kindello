// Backfill image dimensions + rank each centre's photos (no re-scraping — works on
// the URLs already in services_meta.photos). For each photo: get w/h by parsing the
// URL (many encode it, e.g. -1440x800, ?width=960) else a single best-effort
// Range header fetch (no retries/proxies — if it fails, the photo is just not
// eligible to be a hero). Then score/rank into services_meta.photo_order:
//   hero = the best REAL photo (rejects too-small, banners, portrait/logo-shaped).
// A centre with no qualifying photo gets photo_order = [] -> the UI shows a
// placeholder (stock image later). Never forces a logo/banner into the hero.
//
//   node measure-photos.js --limit 50000 --workers 12
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { imageSize } from "image-size";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const LIMIT = Number(arg("--limit", 100000));
const WORKERS = Number(arg("--workers", 12));

const envText = fs.readFileSync(path.join(DIR, "..", ".env"), "utf8");
const envVal = (k) => (envText.split("\n").find((l) => l.startsWith(k + "=")) ?? "").slice(k.length + 1).replace(/^["']|["']$/g, "");
const DATABASE_URL = envVal("DATABASE_URL");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// dims encoded in the URL: -1440x800, 1440x800.jpg, ?width=960&height=540, w=960
function dimsFromUrl(u) {
  const m = u.match(/(\d{2,4})x(\d{2,4})(?=\D|$)/i);
  if (m) { const w = +m[1], h = +m[2]; if (w >= 50 && h >= 50) return { w, h }; }
  const w = u.match(/[?&](?:w|width)=(\d{2,5})/i);
  const h = u.match(/[?&](?:h|height)=(\d{2,5})/i);
  if (w && h) return { w: +w[1], h: +h[1] };
  return null;
}

// single best-effort header read — first 128KB is enough for JPEG/PNG/WebP/GIF dims.
async function dimsFromFetch(u) {
  try {
    const r = await fetch(u, {
      headers: { "user-agent": UA, accept: "image/*", range: "bytes=0-131071" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok && r.status !== 206) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length) return null;
    const d = imageSize(buf);
    if (d?.width && d?.height) return { w: d.width, h: d.height };
  } catch { /* give up — not eligible */ }
  return null;
}

const isPng = (u) => /\.png(\?|#|$)/i.test(u);

// Score a measured photo for "good hero". Unmeasured (no w/h) -> not eligible.
function score(p) {
  const { w, h, url } = p;
  if (!w || !h) return -1;
  const ar = w / h;
  if (w < 400 || h < 300) return -1;          // too small -> blurry when shown big
  if (ar > 3.0) return -1;                     // banner / button strip
  if (ar < 0.7) return -1;                     // portrait / logo-ish
  let s = Math.min(w * h, 16_000_000);         // prefer bigger (area), capped
  if (ar >= 1.3 && ar <= 2.0) s *= 1.3;        // ideal landscape hero
  if (isPng(url) && ar >= 0.8 && ar <= 1.25) s *= 0.25; // near-square PNG -> likely logo/graphic
  return s;
}

const stats = { rows: 0, withHero: 0, noHero: 0, photos: 0, fetched: 0 };

async function processRow(row, db) {
  const photos = row.photos || [];
  const measured = [];
  for (const ph of photos) {
    stats.photos++;
    let dims = ph.w && ph.h ? { w: ph.w, h: ph.h } : dimsFromUrl(ph.url);
    if (!dims) { dims = await dimsFromFetch(ph.url); if (dims) stats.fetched++; }
    measured.push({ ...ph, w: dims?.w ?? null, h: dims?.h ?? null });
  }
  const ranked = measured
    .map((p, i) => ({ i, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.i);
  await db.query(
    `UPDATE services_meta SET photos = $2::jsonb, photo_order = $3 WHERE service_approval_number = $1`,
    [row.service_approval_number, JSON.stringify(measured), ranked],
  );
  stats.rows++;
  ranked.length ? stats.withHero++ : stats.noHero++;
  if (stats.rows % 200 === 0)
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${stats.rows} rows | ${stats.withHero} with hero, ${stats.noHero} none | ${stats.fetched} fetched`);
}

(async () => {
  const db = new pg.Pool({ connectionString: DATABASE_URL, max: WORKERS + 2 });
  const { rows } = await db.query(
    `SELECT service_approval_number, photos
     FROM services_meta
     WHERE photo_order IS NULL AND jsonb_array_length(coalesce(photos,'[]'::jsonb)) > 0
     ORDER BY service_approval_number LIMIT $1`,
    [LIMIT],
  );
  console.log(`to measure: ${rows.length} centres | workers: ${WORKERS}`);
  const queue = rows.slice();
  const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    let r; while ((r = queue.pop())) { try { await processRow(r, db); } catch (e) { console.error("row err", r.service_approval_number, String(e).slice(0, 80)); } }
  }));
  const dt = (Date.now() - t0) / 1000;
  console.log(`\nDONE in ${dt.toFixed(0)}s: ${stats.rows} rows, ${stats.photos} photos (${stats.fetched} needed a fetch) | ${stats.withHero} got a hero, ${stats.noHero} none (placeholder)`);
  await db.end();
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
