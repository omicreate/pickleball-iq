# ピックルボールIQ(診断)

ピックルボールタイプ診断(6パラメータ・全30タイプ)。公開先: https://omicreate.github.io/pickleball-iq/
置き場の方針・計画は Vault の `PickleballIQ/アプリ/ピックルボール診断.md`。

## 構成
- `src/app.html` … 診断の本体(1ファイル。ロジック部は `LOGIC START〜END`)
- `scripts/build.mjs` … `dist/` を作る(トップ + `t/<タイプ>/` の実ページ30枚 + sitemap)
- `scripts/test.mjs` … 依存なしのテスト(CI でも実行)
- `scripts/e2e.mjs` … スマホ幅の通し(playwright が必要。手元だけ)
- `scripts/make-og.mjs` … 共有画像 `src/og.png` を作り直す
- `scripts/vendor-fonts.mjs` … 書体(OFL)を `src/fonts/` に同梱(取り込み済み。再実行は不要)

## 使い方
```
npm test          # ビルド+検査
npm run build     # dist/ を作る
npm run test:e2e  # 画面の通し
```
`main` に push → テストが通れば GitHub Pages に公開(Settings > Pages の Source を「GitHub Actions」に)。

## 決まりごと
- 外に送るのは匿名の回数だけ: `open`(開いた・タイプ紹介ページはtype付き)/`start`(さくっと・ガチ)/`finish`(タイプ・さくっと・ガチ)・`?src=`・版。姉妹アプリと同じ Apps Script(正本 `dev\pbiq-metrics`)→スプレッドシート「pickleball_iq_数値集計」の `iq_events` / `iq_概要`。公開URL以外・DNT/GPC では送らない。ログイン・名前の登録なし。
- 共有リンクは `/t/<タイプ>/?src=share`。`?src=` の印: Instagram `pb_ig_bio` / Threads `pb_th_bio` / 姉妹アプリから `pb_asobi_cross`(予定)。
- リポジトリ名(URL)は変えない(Pages は転送されない)。
