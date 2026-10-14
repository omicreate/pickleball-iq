// Google Fonts から書体(OFL)を取り込み、src/fonts/ に同梱する。1回だけ実行すればよい。
import fs from "node:fs";
const CSS = "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Maru+Gothic:wght@700;900&family=Bowlby+One&display=swap";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
let css = await (await fetch(CSS, { headers: { "User-Agent": UA } })).text();
fs.mkdirSync("src/fonts", { recursive: true });
const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))];
let total = 0;
for (const [i, u] of urls.entries()) {
  const name = `f${String(i).padStart(3, "0")}.woff2`;
  const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
  fs.writeFileSync(`src/fonts/${name}`, buf); total += buf.length;
  css = css.split(u).join(`fonts/${name}`);
}
fs.writeFileSync("src/fonts.css", css);
console.log(urls.length, "files", (total / 1024 / 1024).toFixed(2), "MB");
