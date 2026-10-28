/* PhantomWay feed sync: the chat feed must heal itself, never read as Loom silence.
 *
 * Why this exists (Oct 26 ~18:34 freeze): the poll asked the bridge for since_ts=<watermark>
 * with a strict ">" compare, so a message stored with ts <= the watermark (two Loom replies ~10s
 * apart committed out of order) was never fetched again until the app was reopened.
 *
 * Contract:
 *   - Every pull re-asks for an OVERLAP window behind the watermark; ids are de-duplicated by a
 *     per-message signature so an overlap never re-renders (no flicker).
 *   - One pull in flight at a time; triggers that land mid-flight coalesce into ONE follow-up.
 *   - Every Nth pull, and every resume, is a FULL pull (no since_ts): the authoritative floor.
 *   - A failed pull never advances the watermark and is retried by the next trigger.
 * Pure logic, no DOM: browser gets window.HighwayFeedSync, Node tests get module.exports.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HighwayFeedSync = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function signature(m) {
    var rx = "";
    try { rx = m.reactions ? JSON.stringify(m.reactions) : ""; } catch (e) { rx = ""; }
    return [m.ts || m.tsNum || 0, m.text || "", (m.attachments && m.attachments.length) || 0, rx].join("|");
  }

  /* opts: { fetchMessages(sinceTs|0) -> Promise<{messages:[newest-first]}>,
   *         render(m), remove(id), overlapMs?=20000, fullEvery?=15, onError?(e) } */
  function createFeedSync(opts) {
    var overlap = opts.overlapMs == null ? 20000 : opts.overlapMs;
    var fullEvery = opts.fullEvery || 15;
    var watermark = 0, sigs = Object.create(null), polls = 0;
    var inflight = null, again = false, againFull = false;

    function run(full) {
      polls++;
      var forceFull = full || !watermark || polls % fullEvery === 0;
      var since = forceFull ? 0 : Math.max(0, watermark - overlap);
      return Promise.resolve().then(function () { return opts.fetchMessages(since); }).then(function (body) {
        var rows = ((body && body.messages) || []).slice().reverse();   // oldest first
        var rendered = 0;
        rows.forEach(function (m) {
          if (!m || m.id == null) return;
          var ts = Number(m.ts || m.tsNum || 0) || 0;
          if (ts > watermark) watermark = ts;
          var sig = signature(m);
          if (sigs[m.id] === sig) return;                 // already shown, unchanged
          if (sigs[m.id] !== undefined) opts.remove(m.id);   // changed: replace the old row
          sigs[m.id] = sig;
          opts.render(m);
          rendered++;
        });
        return rendered;
      }).catch(function (e) {
        if (opts.onError) { try { opts.onError(e); } catch (x) { /* ignore */ } }
        return -1;
      });
    }

    function pull(o) {
      var full = !!(o && o.full);
      if (inflight) { again = true; againFull = againFull || full; return inflight; }
      inflight = run(full).then(function (n) {
        inflight = null;
        if (again) {
          var f = againFull; again = false; againFull = false;
          return pull({ full: f });
        }
        return n;
      });
      return inflight;
    }

    return {
      pull: pull,
      resume: function () { return pull({ full: true }); },
      watermark: function () { return watermark; },
      forget: function (id) { delete sigs[id]; }
    };
  }

  return { createFeedSync: createFeedSync, signature: signature };
});
