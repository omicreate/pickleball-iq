// 共有用の画像 src/og.png (1200x630) を作る。アプリ本体のマーク描画をそのまま使う。
// 実行: node scripts/make-og.mjs  (playwright が必要。dist/ を先にビルドしておく)
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const root = path.resolve(import.meta.dirname, "..");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto("file://" + path.join(root, "dist/index.html"));
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => {
  document.body.style.cssText = "margin:0;padding:0;width:1200px;height:630px;overflow:hidden";
  const ks = ["pow-vib", "sta-trk", "trk-nrd", "luv-vib", "nrd-vib", "vib-luv"];
  document.getElementById("app").style.cssText = "max-width:none;margin:0;padding:0;width:1200px;height:630px;position:relative;display:block";
  document.getElementById("app").innerHTML = `
  <div style="position:absolute;left:60px;top:54px;width:640px">
    <span class="tag red" style="font-size:24px">10問・約1分</span> <span class="tag yellow" style="font-size:24px">全30タイプ</span>
    <div style="font-family:var(--f-head);font-size:84px;line-height:1.2;margin-top:22px">あなたは、<br>コートの<br>どこに住む？</div>
    <div style="margin-top:22px;font-size:34px;font-weight:900">ピックルボールタイプ診断</div>
  </div>
  <div style="position:absolute;left:730px;top:60px;width:420px;display:grid;grid-template-columns:repeat(2,200px);gap:14px">${ks.map(k => `<div style="width:200px;height:170px;display:flex;justify-content:center">${mark(k).replace("<svg", '<svg style="height:170px;width:auto"')}</div>`).join("")}</div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:34px;background-image:repeating-linear-gradient(90deg,var(--navy) 0 34px,var(--cloud) 34px 68px)"></div>`;
  document.querySelector(".checker")?.remove();
});
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(root, "src/og.png"), clip: { x: 0, y: 0, width: 1200, height: 630 } });
await b.close(); console.log("src/og.png");
