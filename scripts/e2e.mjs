// 画面の通し(Chromium・スマホ幅)。必要: playwright。 実行: node scripts/e2e.mjs
import { createRequire } from "node:module";
import path from "node:path";
import http from "node:http";
import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "./build.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const out = build(); 
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2", ".xml": "text/xml", ".txt": "text/plain" };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]).replace(/^\/pickleball-iq/, ""); if (p.endsWith("/")) p += "index.html";
  const f = path.join(out, p); if (!f.startsWith(out) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(fs.readFileSync(f));
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const b = await chromium.launch(); const bad = [];
for (const w of [360, 400]) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } });
  p.on("pageerror", e => bad.push(`${w}: ${e.message}`)); p.on("console", m => m.type() === "error" && bad.push(`${w}: ${m.text()}`));
  const noOverflow = async tag => assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${w}px はみ出し: ${tag}`);
  // さくっと診断
  await p.goto(base); await noOverflow("top"); await p.click("#start");
  for (let i = 0; i < 10; i++) { await p.click(".opt >> nth=" + (i % 4)); await p.waitForTimeout(260); }
  await p.waitForSelector(".card"); await noOverflow("result");
  const share = await p.textContent("#sharetext"); assert.match(share, /#ピックルボール診断/); assert.match(share, /omicreate\.github\.io\/pickleball-iq\/t\/[a-z]{3}-[a-z]{3}\/\?src=share/);
  assert.ok(await p.locator('a[href*="threads.net/intent/post"]').count() === 1); assert.ok(await p.locator('a[href*="instagram.com/pickleballiq_jp"]').count() === 1);
  // ガチ分析
  await p.goto(base); await p.click("#gstart");
  for (let i = 0; i < 30; i++) { await p.click(".lk.l" + (i % 5)); await p.waitForTimeout(210); }
  await p.waitForSelector(".report"); await noOverflow("report");
  // タイプ別の実ページ(30枚すべて)
  for (const k of ["pow-sta", "vib-nrd", "trk-nrd"]) { await p.goto(base + `t/${k}/`); await p.waitForSelector(".card"); await noOverflow("t/" + k); }
  await p.goto(base + "#luv-vib"); await p.waitForSelector(".card");
  await p.close();
}
const p2 = await b.newPage(); const fails = []; p2.on("pageerror", e => fails.push(e.message)); p2.on("requestfailed", r => fails.push("req " + r.url()));
const { L } = await import("./build.mjs");
for (const k of L.KEYS) { await p2.goto(base + `t/${k}/`); await p2.waitForSelector(".card .card-name"); const n = await p2.textContent(".card-name"); assert.equal(n.replace(/\s/g, ""), L.pn(k)); }
assert.deepEqual(fails, [], "30ページの読み込み失敗: " + fails.join(","));
await b.close(); srv.close();
assert.deepEqual(bad, [], "ブラウザのエラー: " + bad.join(" / "));
console.log("OK: 360px・400px で さくっと/ガチ/タイプ別ページ。エラー0・はみ出しなし。実ページ30枚の表示も確認");
