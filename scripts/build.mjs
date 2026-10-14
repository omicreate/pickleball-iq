// src/app.html を元に dist/ を作る。依存なし(Node 20+)。
//   dist/index.html            診断のトップ
//   dist/t/<タイプ>/index.html  タイプ別の実ページ(30枚。題名・説明つき)
//   dist/fonts.css, fonts/, og.png, sitemap.xml, robots.txt
import fs from "node:fs";
import path from "node:path";

export const SITE = "https://omicreate.github.io/pickleball-iq/";
const root = path.resolve(import.meta.dirname, "..");
const src = fs.readFileSync(path.join(root, "src/app.html"), "utf8");

// ロジック部分(LOGIC START〜END)だけ取り出して、タイプの名前・キャッチ・あるあるを読む
const logic = src.slice(src.indexOf("// ===== LOGIC START"), src.indexOf("// ===== LOGIC END"));
export const L = new Function(logic + "; return {T,KEYS,AXES,AX,pn,scoreOf,gScoreOf,QS,GQ};")();

const esc = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const no = k => String(L.KEYS.indexOf(k) + 1).padStart(2, "0");

function meta({ url, title, desc, type }) {
  return `
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="ピックルボールIQ">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}og.png">
<meta name="theme-color" content="#f2efe8">${type ? `<script>window.__TYPE__=${JSON.stringify(type)}</script>` : ""}`;
}

function page({ root: r, ...m }) {
  return src.replace("%%META%%", meta(m)).replaceAll("%%ROOT%%", r);
}

export function build(out = path.join(root, "dist")) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const w = (p, c) => { fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }); fs.writeFileSync(path.join(out, p), c); };

  w("index.html", page({
    root: "./", url: SITE,
    title: "ピックルボールタイプ診断｜あなたはコートのどこに住む？",
    desc: "10問・約1分。6つのパラメータと全30タイプで、あなたのピックルボールの性格がわかる。ペアにも診断させよう。"
  }));
  for (const k of L.KEYS) {
    const [name, catchy, aru] = L.T[k];
    w(`t/${k}/index.html`, page({
      root: "../../", url: `${SITE}t/${k}/`, type: k,
      title: `${L.pn(k)}｜ピックルボールタイプ診断 No.${no(k)}`,
      desc: `全30タイプのNo.${no(k)}「${L.pn(k)}」。${catchy}。${aru} あなたは何タイプ？10問・約1分で診断。`
    }));
  }
  // 静的ファイル
  fs.copyFileSync(path.join(root, "src/fonts.css"), path.join(out, "fonts.css"));
  fs.cpSync(path.join(root, "src/fonts"), path.join(out, "fonts"), { recursive: true });
  if (fs.existsSync(path.join(root, "src/og.png"))) fs.copyFileSync(path.join(root, "src/og.png"), path.join(out, "og.png"));
  w("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
  w("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[SITE, ...L.KEYS.map(k => `${SITE}t/${k}/`)].map(u => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  w(".nojekyll", "");
  return out;
}

if (process.argv[1] === import.meta.filename) console.log("built", build());
