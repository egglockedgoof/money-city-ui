const assert = require("assert");
const core = require("../js/core.js");
function testCap() {
  let items = [];
  for (let i = 0; i < 40; i += 1) items = core.capFeed(items, { id: i }, 28);
  assert.strictEqual(items.length, 28);
  assert.strictEqual(items[0].id, 39);
}
function testTicker() {
  const a = core.tickerText([{ short: "VAULT", text: "halt" }], []);
  assert.strictEqual(core.shouldRewriteTicker(a, a), false);
}
function testJobs() {
  assert.strictEqual(core.acceptJob({ id: "1", room: "research", agent: "NOVA", kind: "copy_listing" }).ok, false);
  assert.strictEqual(core.acceptJob({ id: "2", room: "comms", agent: "TRAIL", kind: "send" }).ok, false);
  const draft = core.acceptJob({ id: "3", room: "comms", agent: "TRAIL", kind: "draft", text: "reply" });
  assert.strictEqual(draft.ok, true);
  assert.strictEqual(draft.job.needs_human, true);
}
testCap(); testTicker(); testJobs();
console.log("money-city core tests passed");
