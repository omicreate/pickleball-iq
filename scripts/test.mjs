// 依存なしのテスト(CI でも動く): ビルドの中身と、診断ロジックの網羅を確かめる。
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { build, L, SITE } from "./build.mjs";

const out = path.join(import.meta.dirname, "..", "dist");
build(out);
const read = p => fs.readFileSync(path.join(out, p), "utf8");

// 1. 30タイプ、実ページ30枚、題名・OGP・正規URL
assert.equal(L.KEYS.length, 30);
const titles = new Set();
for (const k of L.KEYS) {
  const h = read(`t/${k}/index.html`);
  assert.ok(h.includes(`window.__TYPE__="${k}"`), k + " type");
  assert.ok(h.includes(`<link rel="canonical" href="${SITE}t/${k}/">`), k + " canonical");
  assert.ok(h.includes(`${SITE}og.png`), k + " og:image");
  assert.ok(h.includes('href="../../fonts.css"'), k + " fonts path");
  assert.ok(!h.includes("%%"), k + " 置き換え漏れ");
  titles.add(h.match(/<title>(.*?)<\/title>/)[1]);
}
assert.equal(titles.size, 30, "題名は30種すべて別");
assert.ok(read("index.html").includes('href="./fonts.css"'));
assert.ok(read("index.html").includes("script.google.com/macros/") && read("index.html").includes('ev:"home"'), "入口の集計");
assert.ok(read("index.html").includes('path:"shindan/"') && !read("index.html").includes("%%"), "入口から診断へ");
assert.ok(read("shindan/index.html").includes('href="../fonts.css"') && !read("shindan/index.html").includes("%%"));
assert.ok(fs.existsSync(path.join(out, "og.png")) && fs.statSync(path.join(out, "og.png")).size > 10000);
assert.equal((read("sitemap.xml").match(/<loc>/g) || []).length, 32);

// 2. 書体は同梱(外部の Google Fonts を読まない)
assert.ok(!read("shindan/index.html").includes("fonts.googleapis.com"));
assert.ok(!read("fonts.css").includes("fonts.gstatic.com"));
for (const m of read("fonts.css").matchAll(/url\((fonts\/[^)]+)\)/g)) assert.ok(fs.existsSync(path.join(out, m[1])), m[1]);

// 3. さくっと診断: 全 4^10 通りで30タイプすべてが出る
const cnt = {};
for (let m = 0; m < 4 ** 10; m++) { const p = []; for (let i = 0, x = m; i < 10; i++, x >>= 2) p.push(x & 3); const k = L.scoreOf(p).key; cnt[k] = (cnt[k] || 0) + 1; }
assert.equal(Object.keys(cnt).length, 30);
// 4. ガチ分析: ランダム回答でも全30タイプが出る
const g = {}; for (let t = 0; t < 100000; t++) { const a = Array.from({ length: 30 }, () => 1 + Math.floor(Math.random() * 5)); const k = L.gScoreOf(a).key; g[k] = (g[k] || 0) + 1; }
assert.equal(Object.keys(g).length, 30);
// 5. 共有文のリンクはタイプ別の実ページ
const app = fs.readFileSync(path.join(import.meta.dirname, "../src/app.html"), "utf8");
assert.ok(app.includes('typeUrl = k => SITE + "t/" + k + "/?src=share"'));
console.log("OK: 実ページ30・題名30種・書体同梱・全30タイプ(さくっと/ガチ)");
