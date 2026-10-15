// 結果カード画像の確認。全30タイプで 1080x1350 の PNG ができるかを確かめ、見本を書き出す。
// 実行: node scripts/card-shot.mjs [出力フォルダ]   (必要: playwright)
import { createRequire } from "node:module";
import path from "node:path";
import http from "node:http";
import fs from "node:fs";
import assert from "node:assert/strict";
import { build, L } from "./build.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const outDir = process.argv[2] || "card-shots"; fs.mkdirSync(outDir, { recursive: true });
const out = build();
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]).replace(/^\/pickleball-iq/, ""); if (p.endsWith("/")) p += "index.html";
  const f = path.join(out, p); if (!f.startsWith(out) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(fs.readFileSync(f));
}).listen(0);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 900 } }); const errs = [];
p.on("pageerror", e => errs.push(e.message));
await p.goto(`http://localhost:${srv.address().port}/t/trk-nrd/`); await p.waitForSelector("#cardimg:not([hidden])");
const dims = await p.evaluate(() => { const i = document.getElementById("cardimg"); return [i.naturalWidth, i.naturalHeight]; });
assert.deepEqual(dims, [1080, 1350], "プレビューの画像サイズ");
const keep = new Set(["pow-sta", "trk-nrd", "luv-vib", "nrd-luv", "vib-nrd", "sta-trk"]);
for (const k of L.KEYS) {
  const r = await p.evaluate(async k => { const bl = await cardPng(k, protoPct(k)); const du = await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(bl); }); return { n: bl.size, head: Array.from(new Uint8Array(await bl.slice(0, 4).arrayBuffer())), b64: du.split(",")[1] }; }, k);
  assert.deepEqual(r.head, [137, 80, 78, 71], k + " は PNG ではない"); assert.ok(r.n > 20000, k + " が小さすぎる");
  if (keep.has(k)) fs.writeFileSync(path.join(outDir, k + ".png"), Buffer.from(r.b64, "base64"));
}
assert.deepEqual(errs, [], "ブラウザのエラー: " + errs.join(" / "));
await b.close(); srv.close();
console.log("OK: 全30タイプで 1080x1350 の PNG ができる。見本→", outDir);
