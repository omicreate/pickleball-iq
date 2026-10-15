# 診断アプリの数え方(案・未反映)

**段**: 仕組み化(数える仕組み)。撤退基準は「公開から2週間で #ピックルボール診断 の投稿が10件に届かなければ、問題文とシェア文を作り直す」。
このフォルダは**書いただけ**。反映(Apps Script のデプロイ・シート作成・アプリへの URL 設定・push)は、操作名を挙げた許可が出てから。

## 何を数えるか

| event | いつ | 付く情報 | 何がわかるか |
|---|---|---|---|
| open | ページを開いた | page(top/type)・type | 入口の数、共有リンクから来た数(src=share) |
| start | 診断を始めた | mode(quick/deep) | 開いた→始めた率 |
| complete | 最後まで答えた | mode・type・top軸 | 完走率、タイプの偏り |
| quit | 途中で閉じた | mode・n(何問目まで) | どこで離れるか |
| share | 共有ボタン | target(threads/copy/x) | 共有の押された数(**投稿された数ではない**) |
| follow | フォロー導線 | target(ig/threads) | 導線の強さ |
| sister | 姉妹アプリのカード | asobi | 回遊 |

送らないもの: 名前・回答の中身・IP・端末ID・Cookie。結果画面の「送る内容と、止める設定」で本人が止められる(DoNotTrack / GPC も尊重)。

## 撤退基準の数え方(ここが要)

アプリの数では**投稿数は数えられない**(共有ボタンは押しただけ、コピーは投稿されたか不明)。
→ 投稿数は**手で数える**。週次分析(土曜)に次の行を足す案:

- Threads / Instagram(あれば X)で `#ピックルボール診断` を検索し、**自分・家族を除いた**投稿を数える。件数と日付を `週次分析/日付.md` に残す
- 判定日 = 公開日(2026-10-14)+14日 = **2026-10-28**。10件未満なら問題文とシェア文を作り直す
- アプリの share 数は「傾向」として横に並べるだけ(判定には使わない)

## 受け口の用意(許可後の手順)

1. 新しいスプレッドシート(または既存の「ピックルボールIQ_数値集計」に tab `shindan_events`)を作り、1行目に見出し:`時刻,event,版,src,page,mode,type,top,n,target`
2. `Code.gs.proposal.js` を Apps Script に貼り、スクリプトプロパティ `SHEET_ID` を設定 → ウェブアプリとしてデプロイ(実行:自分/アクセス:全員)
3. 出た `.../exec` を、ビルド時の環境変数 `PBIQ_METRICS_URL` に入れて再ビルド → push
4. 公開版で open/start/complete が1行ずつ入るのを確認

未確認: GAS 無料枠の同時書き込み・日次上限(「未確認」)/ sendBeacon が `/exec` のリダイレクトを越えて届くか(実機で要確認)。

## 集計(シートの数式案)

```
概要(shindan_概要):
 開いた   =COUNTIFS(shindan_events!B:B,"open")
 始めた   =COUNTIFS(shindan_events!B:B,"start")
 完走     =COUNTIFS(shindan_events!B:B,"complete")
 完走率   =完走/始めた
 共有押下 =COUNTIFS(shindan_events!B:B,"share")
 共有リンク経由 =COUNTIFS(shindan_events!B:B,"open",shindan_events!D:D,"share")
タイプ別(shindan_タイプ別):
 =QUERY(shindan_events!A:J,"select G,count(B) where B='complete' group by G order by count(B) desc label count(B) '回数'",1)
```

## ダッシュボード案(既存 CuM7zQQoaZAgyPdoE56KSk に「診断」節を足す)

撤退基準の判定日までの残り日数、開いた→始めた→完走の3段、共有押下、手数えの投稿数(手入力欄)を並べる。
データの渡し方(既存ダッシュボードが何で読んでいるか)は**未確認**。既存の仕組みに合わせる。

## やらないこと
Cookie・端末ID・回答内容の保存 / 広告計測タグ / 個人の追跡 / 判定に share 押下数を使うこと。

副作用: 数える仕組みを入れると「送る内容」の説明を保つ手間が増える。止める設定が効くことは e2e で毎回確認する。
