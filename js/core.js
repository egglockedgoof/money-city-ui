/* MONEY CITY core — pure, testable. No DOM. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.MONEY_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CACHE = "20261004station";
  const FEED_MAX = 28;
  const ROOMS = [
    { id: "research", name: "Research", job: "Demand briefs from public categories. Original only. No listing copies." },
    { id: "factory", name: "Factory", job: "Turn a research brief into a draft asset. Human publishes." },
    { id: "comms", name: "Comms", job: "Draft replies. Never send. needs_human stays true." },
    { id: "treasury", name: "Treasury", job: "Cost and revenue ledger. No spend without a receipt id." },
    { id: "publishing", name: "Publishing", job: "Schedule slots. Drop does not post." },
    { id: "war", name: "War", job: "Kill underperforming lanes. Propose the next lane." },
    { id: "archives", name: "Archives", job: "Append-only memory refs. Nothing deleted." },
    { id: "quarters", name: "Quarters", job: "Crew status. Flavor only." }
  ];
  const ROOM_IDS = ROOMS.map((r) => r.id);
  function capFeed(items, item, max) {
    const limit = max || FEED_MAX;
    const next = [item].concat(items || []);
    return next.length > limit ? next.slice(0, limit) : next;
  }
  function tickerText(rows, futureLines) {
    const live = (rows || []).slice(0, 8).map((r) => (r.short || r.unit || "CITY") + ": " + (r.text || ""));
    const fut = (futureLines || []).slice(0, 6);
    const line = live.concat(fut).join("   ···   ");
    return line ? line + "   ···   " + line + "   ···   " : "";
  }
  function shouldRewriteTicker(prev, next) {
    return String(prev || "") !== String(next || "");
  }
  function acceptJob(job) {
    const errors = [];
    if (!job || typeof job !== "object") errors.push("job must be an object");
    else {
      if (!job.id) errors.push("id required");
      if (!ROOM_IDS.includes(job.room)) errors.push("unknown room");
      if (!job.agent) errors.push("agent required");
      if (!job.kind) errors.push("kind required");
      if (job.room === "comms" && job.kind === "send") errors.push("comms cannot send; draft only");
      if (job.room === "research" && job.kind === "copy_listing") errors.push("copy_listing refused");
    }
    if (errors.length) return { ok: false, errors: errors };
    return {
      ok: true,
      job: {
        id: String(job.id),
        room: job.room,
        agent: String(job.agent),
        kind: String(job.kind),
        text: String(job.text || ""),
        needs_human: job.room === "comms" || job.room === "publishing" || job.needs_human === true,
        ts: job.ts || null
      }
    };
  }
  function mergeLoads(settled) {
    const out = {};
    (settled || []).forEach((row) => { out[row.key] = row.value; });
    return out;
  }
  return { CACHE, FEED_MAX, ROOMS, ROOM_IDS, capFeed, tickerText, shouldRewriteTicker, acceptJob, mergeLoads };
});
