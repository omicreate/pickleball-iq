/**
 * 【案・未反映】診断アプリの匿名イベントを受ける Apps Script(既存 pbiq-metrics とは別プロジェクト推奨)。
 * 反映するには omi さんの許可が要る(デプロイ・シートへの書き込みを伴うため)。このファイルは書いただけ。
 *
 * 入口: doPost(e)  本文は text/plain の JSON(sendBeacon)。
 * 方針: 許可リストにあるものだけ記録 / 自由入力は受けない / IDも保存しない / 1分あたり上限で荒らし対策。
 */
var TAB = 'shindan_events';
var MAX_PER_MIN = 60;
var KEYS = ['pow-sta','pow-trk','pow-luv','pow-nrd','pow-vib','sta-pow','sta-trk','sta-luv','sta-nrd','sta-vib',
  'trk-pow','trk-sta','trk-luv','trk-nrd','trk-vib','luv-pow','luv-sta','luv-trk','luv-nrd','luv-vib',
  'nrd-pow','nrd-sta','nrd-trk','nrd-luv','nrd-vib','vib-pow','vib-sta','vib-trk','vib-luv','vib-nrd'];
var AXES = ['pow','sta','trk','luv','nrd','vib'];
var EVENTS = ['open','start','complete','quit','share','follow','sister'];
var TARGETS = { share: ['threads','copy'], follow: ['ig','threads'], sister: ['asobi'] };

/** 純粋関数: 生の本文 → 行(配列) か null。単体テストはこれを呼ぶ。 */
function validate_(raw) {
  var d; try { d = JSON.parse(raw); } catch (err) { return null; }
  if (!d || typeof d !== 'object') return null;
  if (EVENTS.indexOf(d.e) < 0) return null;
  var src = (typeof d.src === 'string' && /^[a-z0-9_]{1,24}$/.test(d.src)) ? d.src : '';
  var v = (typeof d.v === 'string' && /^[0-9.]{1,10}$/.test(d.v)) ? d.v : '';
  var page = (d.page === 'top' || d.page === 'type') ? d.page : '';
  var mode = (d.mode === 'quick' || d.mode === 'deep') ? d.mode : '';
  var type = KEYS.indexOf(d.type) >= 0 ? d.type : '';
  var top = AXES.indexOf(d.top) >= 0 ? d.top : '';
  var n = (typeof d.n === 'number' && d.n >= 0 && d.n <= 30 && d.n % 1 === 0) ? d.n : '';
  var target = (TARGETS[d.e] && TARGETS[d.e].indexOf(d.target) >= 0) ? d.target : '';
  if (d.e === 'complete' && (!mode || !type)) return null;
  if (d.e === 'quit' && (!mode || n === '')) return null;
  if (TARGETS[d.e] && !target) return null;
  return [d.e, v, src, page, mode, type, top, n, target];
}

function doPost(e) {
  var row = validate_(e && e.postData && e.postData.contents);
  if (!row) return ContentService.createTextOutput('ignored');
  var cache = CacheService.getScriptCache();
  var k = 'n' + Math.floor(Date.now() / 60000);
  var c = Number(cache.get(k) || 0);
  if (c >= MAX_PER_MIN) return ContentService.createTextOutput('busy');
  cache.put(k, String(c + 1), 120);
  var lock = LockService.getScriptLock(); lock.waitLock(5000);
  try {
    var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID'); // コードに直書きしない
    var sh = SpreadsheetApp.openById(id).getSheetByName(TAB);
    sh.appendRow([new Date()].concat(row));
  } finally { lock.releaseLock(); }
  return ContentService.createTextOutput('ok');
}
// 列: A 時刻 / B event / C 版 / D src / E page / F mode / G type / H top軸 / I 何問目 / J target

if (typeof module !== 'undefined') module.exports = { validate_: validate_, KEYS: KEYS, EVENTS: EVENTS, TARGETS: TARGETS };
