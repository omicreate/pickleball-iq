// 受け口案の検証と、アプリが送る event 名が受け口の許可リストに入っているかの確認。実行: node scripts/test-metrics.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
import { L } from "./build.mjs";
const mod = { exports: {} };
vm.runInNewContext(fs.readFileSync(new URL("../docs/metrics/Code.gs.proposal.js", import.meta.url), "utf8"), { module: mod });
const gs = mod.exports;
const ok = o => gs.validate_(JSON.stringify(o));
// 受け口: 正しいもの
assert.ok(ok({ e: "open", v: "0.1.0", src: "share", page: "type", type: "pow-sta" }));
assert.ok(ok({ e: "complete", mode: "quick", type: "vib-nrd", top: "vib" }));
assert.ok(ok({ e: "quit", mode: "deep", n: 12 }));
assert.ok(ok({ e: "share", target: "copy" }));
// 受け口: 弾くもの
assert.equal(ok({ e: "evil" }), null);
assert.equal(ok({ e: "complete", mode: "quick", type: "xxx-yyy" }), null);
assert.equal(ok({ e: "share", target: "mail" }), null);
assert.equal(ok({ e: "quit", mode: "quick", n: 99 }), null);
assert.equal(gs.validate_("not json"), null);
assert.equal(ok({ e: "open", src: "<script>" })[2], "", "src は英数字24字まで。それ以外は空にする");
// 自由入力が行に残らない(余計なキーは捨てる)
assert.equal(ok({ e: "open", name: "taro", answers: [1, 2] }).length, 9);
// 受け口のタイプ一覧がアプリと一致
assert.equal(JSON.stringify(gs.KEYS), JSON.stringify(L.KEYS));
// アプリ側の event / target が受け口の許可内
const app = fs.readFileSync(new URL("../src/app.html", import.meta.url), "utf8");
const used = new Set([...app.matchAll(/track\("([a-z]+)"/g)].map(m => m[1]));
for (const e of used) assert.ok(gs.EVENTS.includes(e), "受け口にない event: " + e);
for (const m of app.matchAll(/data-track="([a-z]+):([a-z]+)"/g)) assert.ok(gs.TARGETS[m[1]]?.includes(m[2]), "受け口にない target: " + m[0]);
console.log("OK: 受け口の検証(許可・拒否)・タイプ30一致・アプリの event/target が許可内");
