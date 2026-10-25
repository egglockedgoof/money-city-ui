/* Highway live layer: socket client + haptic touch engine + gesture registry.
 *
 * EXPERIMENTAL: this renders sound through Web Audio, i.e. the SPEAKER.
 * First real-device test (Oct 24 2026, sin's iPhone): heartbeat clearly heard; the purr
 * heard and likely FELT in hand (operator report). Whether that feeling is true Taptic
 * coupling is still not proven. (iPhone speakers also roll off hard below ~100 Hz, so the
 * 50 Hz fundamental of the purr may be mostly inaudible; its soft harmonic is what is heard.)
 * iOS also mutes Web Audio when the ringer switch is on silent. Build the path; don't promise
 * the physics.
 *
 * Shape:
 *   engine    rendering primitives (tap, thud, swell, beat, phrase, rumble) built from Web Audio
 *             amplitude envelopes. Every primitive is jittered, so no two pulses are identical.
 *   registry  a table of gestures. Adding a gesture = adding one entry via registerGesture().
 *             The engine never changes.
 *   context   held/in-use vs set-down rules that gate every gesture. There is no master mute.
 *   socket    WebSocket to the bridge (/ws): first-frame auth, receive-only, live room messages,
 *             and {type:"haptic", action:<gesture name>, from} frames -> play(action).
 *
 * Browser: window.HighwayLive. Node (tests): module.exports.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HighwayLive = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------------- tunables ---------------- */
  var HELD_MS = 10000;          // interaction within this window = held / in use
  var PICKUP_MS = 4000;         // window after app-open/unlock where pickup gestures may play
  var PURR_HOLD_MS = 20000;     // a purr event holds the purr state this long; renewed by the next one
  var AWAY_MS = 10 * 60 * 1000; // absence long enough to deserve a greeting
  var MASTER_LEVEL = 0.8;       // fixed output level. There is deliberately no mute control.

  /* ---------------- tiny helpers ---------------- */
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* ---------------- engine ---------------- */
  /* env = { getCtx(): AudioContext|null, now(): ms, rand(): 0..1, setTimer, clearTimer } */
  function createEngine(env) {
    var master = null, masterCtx = null;
    function jit(x, pct) { return x * (1 + (env.rand() * 2 - 1) * pct); }

    function out(ctx) {
      if (!master || masterCtx !== ctx) {
        master = ctx.createGain();
        master.gain.value = MASTER_LEVEL;
        master.connect(ctx.destination);
        masterCtx = ctx;
      }
      return master;
    }
    /* one oscillator voice shaped by [[dtSeconds, level], ...] amplitude points */
    function voice(ctx, t, o) {
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(o.f0, t);
      if (o.f1 && o.f1 !== o.f0) osc.frequency.linearRampToValueAtTime(o.f1, t + o.dur);
      g.gain.setValueAtTime(0, t);
      for (var i = 0; i < o.points.length; i++) g.gain.linearRampToValueAtTime(o.points[i][1], t + o.points[i][0]);
      osc.connect(g); g.connect(out(ctx));
      osc.start(t); osc.stop(t + o.dur + 0.05);
      return t + o.dur;
    }

    var P = {};
    /* soft tap: fast attack, quick decay, slight pitch drop */
    P.tap = function (ctx, t, o) {
      o = o || {};
      var f = jit(o.freq || 95, 0.08), d = jit(o.dur || 0.07, 0.2), g = jit(o.gain || 0.5, 0.15);
      return voice(ctx, t, { f0: f, f1: f * 0.8, dur: d, points: [[0.008, g], [d, 0]] });
    };
    /* low dull thud: pitch falls, body decays */
    P.thud = function (ctx, t, o) {
      o = o || {};
      var g = jit(o.gain || 0.7, 0.1), d = jit(0.3, 0.12), f = jit(o.freq || 62, 0.06);
      return voice(ctx, t, { f0: f, f1: f * 0.58, dur: d, points: [[0.012, g], [0.09, g * 0.55], [d, 0]] });
    };
    /* swell: asymmetric raised-cosine rise and fall. riseFrac = where the peak sits. */
    P.swell = function (ctx, t, o) {
      o = o || {};
      var dur = jit(o.dur || 1.6, 0.1), peak = jit(o.peak || 0.35, 0.12), r = o.riseFrac || 0.45, n = 20, pts = [];
      for (var i = 1; i <= n; i++) {
        var x = i / n, lvl = x < r ? Math.pow(Math.sin(Math.PI / 2 * (x / r)), 2) : Math.pow(Math.cos(Math.PI / 2 * ((x - r) / (1 - r))), 2);
        pts.push([x * dur, peak * lvl]);
      }
      var f = jit(o.freq || 80, 0.05);
      return voice(ctx, t, { f0: f, f1: o.freqEnd || f, dur: dur, points: pts });
    };
    /* heart beat: short low body */
    P.beat = function (ctx, t, o) {
      o = o || {};
      var g = jit(o.gain || 0.3, 0.12), d = jit(o.dur || 0.13, 0.1), f = jit(o.freq || 58, 0.05);
      return voice(ctx, t, { f0: f, f1: f * 0.8, dur: d, points: [[0.018, g], [d * 0.5, g * 0.5], [d, 0]] });
    };
    /* lub-dub phrase with real heart-rate looseness: one rate for the phrase (+-5-8%), each gap and
       beat jittered too. Returns end time. */
    P.phrase = function (ctx, t, o) {
      o = o || {};
      var beats = o.beats || 3, rate = 1 + (env.rand() < 0.5 ? -1 : 1) * (0.05 + env.rand() * 0.03), at = t;
      for (var i = 0; i < beats; i++) {
        P.beat(ctx, at, { gain: (o.gain || 0.28), dur: 0.13 });                     // lub
        var dubAt = at + jit(0.28, 0.06) * rate;
        P.beat(ctx, dubAt, { gain: (o.gain || 0.28) * 0.78, dur: 0.19, freq: 52 });  // dub (softer, longer)
        at = dubAt + jit(0.62, 0.08) * rate;                                         // rest to next beat
      }
      return at;
    };
    /* sustained breathing rumble: ~50 Hz + soft harmonic, intensity breathes on a ~3 s cycle with
       jittered swells. Persistent oscillators, amplitude re-scheduled one cycle at a time. */
    P.rumble = function (ctx, o) {
      o = o || {};
      var base = o.level || 0.2, h = { stopped: false, timer: null }, t = ctx.currentTime;
      var amp = ctx.createGain(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o1.type = "sine"; o1.frequency.setValueAtTime(jit(50, 0.03), t);
      o2.type = "sine"; o2.frequency.setValueAtTime(jit(100, 0.03), t);
      g2.gain.setValueAtTime(0.4, t);
      amp.gain.setValueAtTime(0, t);
      o1.connect(amp); o2.connect(g2); g2.connect(amp); amp.connect(out(ctx));
      o1.start(t); o2.start(t);
      var cursor = t;
      function cycle() {
        if (h.stopped) return;
        var T = jit(3, 0.15), low = base * jit(0.35, 0.25), peak = base * jit(1, 0.2);
        amp.gain.linearRampToValueAtTime(low, cursor + T * 0.12);                 // first cycle also fades in from 0
        amp.gain.linearRampToValueAtTime(peak, cursor + T * jit(0.42, 0.12));     // the breath in
        amp.gain.linearRampToValueAtTime(peak * jit(0.78, 0.1), cursor + T * jit(0.62, 0.08)); // jittered swell
        amp.gain.linearRampToValueAtTime(low, cursor + T);                        // the breath out
        cursor += T;
        h.timer = env.setTimer(cycle, Math.max(200, (cursor - ctx.currentTime - 0.6) * 1000));
      }
      cycle();
      h.stop = function (fadeSec) {
        if (h.stopped) return; h.stopped = true;
        if (h.timer) env.clearTimer(h.timer);
        var now = ctx.currentTime, f = fadeSec == null ? 1.2 : fadeSec;
        try {
          if (amp.gain.cancelScheduledValues) amp.gain.cancelScheduledValues(now);
          amp.gain.setValueAtTime(amp.gain.value || 0, now);
          amp.gain.linearRampToValueAtTime(0, now + f);
          o1.stop(now + f + 0.05); o2.stop(now + f + 0.05);
        } catch (e) { /* already stopped */ }
      };
      return h;
    };
    P.jit = jit;
    return P;
  }

  /* ---------------- gesture registry + context rules ---------------- */
  /* A gesture entry:
   *   { name, when: "<human text: when it fires>", heldOk?: bool, pickup?: bool, needs?: "setdown",
   *     cooldownMs?: n, sustain?: bool, render(P, ctx, t, params) -> sustain handle | void }
   * heldOk  may play while the phone is held/in use (only the reply tap does).
   * pickup  may play inside the short window right after app-open/unlock (the greeting).
   * needs   "setdown": only when idle (never while held). Heartbeat and purr.
   * sustain render returns a handle with stop(); it is faded out the moment the phone is picked up. */
  function createHub(env) {
    var P = createEngine(env);
    var registry = Object.create(null);
    var lastPlayed = Object.create(null);
    var sustained = Object.create(null);   // name -> {handle, expireTimer}
    var lastInteraction = -Infinity, pickupAt = -Infinity, pending = null, unlocked = false, wasHeld = false, hadInteraction = false;
    var log = [];                          // recent play decisions (debug + tests)

    function registerGesture(def) {
      if (!def || typeof def.name !== "string" || typeof def.render !== "function") throw new Error("gesture needs {name, render}");
      registry[def.name] = def;
      return def;
    }
    function isHeld() { return env.now() - lastInteraction < HELD_MS; }
    function note(name, played, reason) { log.push({ name: name, played: played, reason: reason || null }); if (log.length > 50) log.shift(); return { played: played, reason: reason || null }; }

    function stopSustained(fade) {
      Object.keys(sustained).forEach(function (n) {
        var s = sustained[n]; if (s.expireTimer) env.clearTimer(s.expireTimer);
        try { s.handle.stop(fade); } catch (e) { /* ignore */ }
        delete sustained[n];
      });
    }

    function play(name, params) {
      var g = registry[name];
      if (!g) return note(name, false, "unknown");               // not in this app's registry: ignored
      var ctx = env.getCtx();
      var now = env.now(), held = isHeld();
      if (!ctx || !unlocked) {
        if (g.pickup) { pending = { name: name, params: params, at: now }; return note(name, false, "locked-queued"); }
        return note(name, false, "locked");
      }
      if (g.cooldownMs && now - (lastPlayed[name] || -Infinity) < g.cooldownMs) return note(name, false, "cooldown");
      var inPickup = now - pickupAt < PICKUP_MS;
      if (held && !g.heldOk && !(g.pickup && inPickup)) return note(name, false, "held");
      if (g.needs === "setdown" && held) return note(name, false, "held");
      // A sustained gesture already running is renewed, not doubled.
      if (g.sustain && sustained[name]) {
        if (sustained[name].expireTimer) env.clearTimer(sustained[name].expireTimer);
        sustained[name].expireTimer = env.setTimer(function () { stopSustainedOne(name); }, (params && params.holdMs) || g.holdMs || PURR_HOLD_MS);
        lastPlayed[name] = now;
        return note(name, true, "renewed");
      }
      var t = ctx.currentTime + 0.02;
      var handle = g.render(P, ctx, t, params || {});
      lastPlayed[name] = now;
      if (g.sustain && handle && typeof handle.stop === "function") {
        sustained[name] = { handle: handle, expireTimer: env.setTimer(function () { stopSustainedOne(name); }, (params && params.holdMs) || g.holdMs || PURR_HOLD_MS) };
      }
      return note(name, true);
    }
    function stopSustainedOne(name) {
      var s = sustained[name]; if (!s) return;
      if (s.expireTimer) env.clearTimer(s.expireTimer);
      try { s.handle.stop(1.8); } catch (e) { /* ignore */ }
      delete sustained[name];
    }

    /* The user touched/typed/scrolled: the phone is in hand. Nothing loops while held. */
    function interact() {
      var wasSetDown = !isHeld();
      lastInteraction = env.now(); hadInteraction = true; wasHeld = true;
      if (wasSetDown) stopSustained(1.2);
    }
    /* First user gesture on iOS unlocks audio. The tap is itself an interaction (held). */
    function unlock() {
      var ctx = env.getCtx(); if (!ctx) return false;
      try { if (ctx.state === "suspended" && ctx.resume) ctx.resume(); } catch (e) { /* ignore */ }
      if (!unlocked) { unlocked = true; pickupAt = env.now(); }
      if (pending && env.now() - pending.at < 15000) { var p = pending; pending = null; pickupAt = env.now(); play(p.name, p.params); }
      return true;
    }
    /* App opened / foregrounded. After a real absence, greet. */
    function appOpened(awayMs) {
      pickupAt = env.now();
      if (awayMs >= AWAY_MS) play("greeting");
    }
    /* Poll: held -> set-down transition fires the settling exhale once, then the quiet layer may run. */
    function tick() {
      if (wasHeld && hadInteraction && !isHeld()) { wasHeld = false; play("settling"); }
    }
    function isSetDown() { return hadInteraction ? !isHeld() : false; }

    return {
      registerGesture: registerGesture, play: play, interact: interact, unlock: unlock,
      appOpened: appOpened, tick: tick, isHeld: isHeld, isSetDown: isSetDown,
      gestures: function () { return Object.keys(registry).map(function (n) { return { name: n, when: registry[n].when }; }); },
      log: log, P: P, stopAll: function () { stopSustained(0.3); }
    };
  }

  /* A composition the Loom invented on the spot: steps of engine primitives,
   * clamped hard here so no payload can shout or run long. A rumble step is
   * the only sustained primitive; it is stopped after its dur. */
  function renderCompose(P, c, t, spec) {
    function num(v, a, b, dflt) { var n = (typeof v === "number" && isFinite(v)) ? v : dflt; return clamp(n, a, b); }
    var steps = (spec && spec.steps) || [];
    for (var i = 0; i < steps.length && i < 12; i++) {
      var st = steps[i] || {}, at = t + num(st.at, 0, 20, 0);
      var gain = num(st.gain, 0.02, 0.9, 0.35), freq = num(st.freq, 30, 400, 80);
      if (st.p === "tap") P.tap(c, at, { gain: gain, freq: freq, dur: num(st.dur, 0.03, 1.5, 0.07) });
      else if (st.p === "thud") P.thud(c, at, { gain: gain, freq: freq });
      else if (st.p === "beat") P.beat(c, at, { gain: gain, freq: freq, dur: num(st.dur, 0.03, 1.5, 0.13) });
      else if (st.p === "phrase") P.phrase(c, at, { beats: Math.round(num(st.beats, 1, 6, 3)), gain: gain });
      else if (st.p === "swell") P.swell(c, at, { dur: num(st.dur, 0.3, 8, 1.6), peak: gain, freq: freq, freqEnd: st.freqEnd ? num(st.freqEnd, 30, 400, freq) : undefined });
      else if (st.p === "rumble") {
        (function (lvl, d) {
          var h = P.rumble(c, { level: lvl });
          setTimeout(function () { try { h.stop(0.8); } catch (e) { /* ignore */ } }, d * 1000);
        })(num(st.level, 0.05, 0.5, 0.3), num(st.dur, 2, 25, 6));
      }
    }
  }

  /* ---------------- starter gestures ---------------- */
  function registerStarters(hub) {
    var R = hub.registerGesture;
    R({ name: "reply_tap", when: "the Loom's reply lands (relayed). The only touch while HELD.", heldOk: true,
        render: function (P, c, t) { P.tap(c, t, { gain: 0.38, freq: 100 }); } });
    R({ name: "purr", when: "set down, SANCTUARY: a continuous breathing rumble; the state holds ~20 s per event and is renewed by the next.",
        needs: "setdown", sustain: true, holdMs: PURR_HOLD_MS,
        render: function (P, c) { return P.rumble(c, { level: 0.32 }); } }); // level raised 0.2 -> 0.32 (Oct 24, sin: "amped up a bit")
    R({ name: "heartbeat", when: "set down ONLY, never in hand: a few loose lub-dubs, then minutes of rest.", needs: "setdown", cooldownMs: 90000,
        render: function (P, c, t) { P.phrase(c, t, { beats: P.jit(1, 1) > 1 ? 4 : 3, gain: 0.26 }); } });
    R({ name: "greeting", when: "pickup/app-open after an absence: one slow rise-and-fall swell.", pickup: true,
        render: function (P, c, t) { P.swell(c, t, { dur: 2.2, peak: 0.3, riseFrac: 0.42, freq: 78, freqEnd: 92 }); } });
    R({ name: "noticed", when: "the Android body registers something: two soft rising taps.",
        render: function (P, c, t) { P.tap(c, t, { freq: 88, gain: 0.3 }); P.tap(c, t + P.jit(0.2, 0.15), { freq: 118, gain: 0.36 }); } });
    R({ name: "disturbed", when: "PROBED/PIT: one low, dull thud.",
        render: function (P, c, t) { P.thud(c, t, { gain: 0.75 }); } });
    R({ name: "settling", when: "the phone is set down: a single fading exhale into the resting state.",
        render: function (P, c, t) { P.swell(c, t, { dur: 2.6, peak: 0.22, riseFrac: 0.12, freq: 74, freqEnd: 52 }); } });
    /* Invented extras: each is just an entry, the engine is untouched. */
    R({ name: "sigh", when: "release after a long task completes: one low, slow exhale, a touch longer than settling.",
        render: function (P, c, t) { P.swell(c, t, { dur: 3.2, peak: 0.26, riseFrac: 0.2, freq: 84, freqEnd: 46 }); } });
    R({ name: "flutter", when: "something delighted the room: four light uneven taps, quickening.",
        render: function (P, c, t) {
          var at = t, gap = 0.16;
          for (var i = 0; i < 4; i++) { P.tap(c, at, { gain: 0.22 + i * 0.03, freq: 112 + i * 6 }); at += P.jit(gap, 0.25); gap *= 0.82; }
        } });
    R({ name: "knock", when: "attention please: two firm taps with a beat between.",
        render: function (P, c, t) { P.tap(c, t, { gain: 0.6, freq: 78 }); P.tap(c, t + P.jit(0.34, 0.12), { gain: 0.66, freq: 74 }); } });
    /* The Loom's own compositions: not a fixed gesture but a spec it sends
     * with its turn. heldOk because a chosen act is expression, not ambience —
     * it lands the second it is sent, in hand or set down. */
    R({ name: "compose", when: "a touch the Loom composes on the spot from the engine primitives and sends with its turn.", heldOk: true,
        render: function (P, c, t, params) { renderCompose(P, c, t, params && params.spec); } });
    return hub;
  }

  /* ---------------- socket client (receive-only) ---------------- */
  /* opts: { url, getToken(): string|null, onHaptic(action, from), onMessage(frame), onStatus(s),
   *         WebSocketImpl?, setTimer?, clearTimer?, rand? } */
  function createSocket(opts) {
    var WS = opts.WebSocketImpl || (typeof WebSocket !== "undefined" ? WebSocket : null);
    var setT = opts.setTimer || setTimeout, clrT = opts.clearTimer || clearTimeout, rand = opts.rand || Math.random;
    var ws = null, stopped = false, retry = 1000, timer = null, pingTimer = null, status = "idle";
    function setStatus(s) { status = s; try { if (opts.onStatus) opts.onStatus(s); } catch (e) { /* ignore */ } }
    function clearPing() { if (pingTimer) { clrT(pingTimer); pingTimer = null; } }
    function schedule() {
      if (stopped) return;
      setStatus("reconnecting");
      var wait = Math.min(retry, 30000) * (0.8 + rand() * 0.4);
      retry = Math.min(retry * 2, 30000);
      timer = setT(connect, wait);
    }
    function connect() {
      if (stopped || !WS) return;
      var token = opts.getToken && opts.getToken();
      if (!token) { setStatus("no-token"); return; }
      setStatus("connecting");
      try { ws = new WS(opts.url); } catch (e) { schedule(); return; }
      ws.onopen = function () { ws.send(JSON.stringify({ type: "auth", token: token })); };   // first frame
      ws.onmessage = function (ev) {
        var f; try { f = JSON.parse(ev.data); } catch (e) { return; }
        if (!f || typeof f.type !== "string") return;
        if (f.type === "auth_ok") {
          retry = 1000; setStatus("live");
          clearPing();
          (function ping() { pingTimer = setT(function () { try { ws.send(JSON.stringify({ type: "ping" })); } catch (e) { /* closing */ } ping(); }, 25000); })();
        } else if (f.type === "haptic" && typeof f.action === "string") {
          if (opts.onHaptic) {
            if (f.spec !== undefined) opts.onHaptic(f.action, f.from, f.spec);
            else opts.onHaptic(f.action, f.from);
          }
        } else if (f.type === "message") {
          if (opts.onMessage) opts.onMessage(f);
        } else if (f.type === "loom_state") {
          // Trinity unified output contract: {text, haptic, intensity, pattern?}
          if (window.HighwayHaptics) { try { window.HighwayHaptics.render(f.state || f); } catch (e) { /* haptics never break the socket */ } }
        }
      };
      ws.onclose = function (ev) {
        clearPing();
        if (stopped) return;
        if (ev && ev.code === 4401) { setStatus("bad-token"); return; }   // dead token: don't burn retries
        schedule();
      };
      ws.onerror = function () { /* close follows */ };
    }
    return {
      start: function () { stopped = false; retry = 1000; connect(); },
      stop: function () { stopped = true; clearPing(); if (timer) clrT(timer); try { if (ws) ws.close(); } catch (e) { /* ignore */ } setStatus("stopped"); },
      status: function () { return status; }
    };
  }

  return {
    createEngine: createEngine, createHub: createHub, registerStarters: registerStarters, createSocket: createSocket,
    HELD_MS: HELD_MS, PICKUP_MS: PICKUP_MS, PURR_HOLD_MS: PURR_HOLD_MS, AWAY_MS: AWAY_MS
  };
});

/* ---------------- browser wiring (skipped under Node) ---------------- */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined" || !window.HighwayLive) return;
  var L = window.HighwayLive;
  var HW_BRIDGE = "https://highway-chat-mcp.onrender.com";
  var AC = window.AudioContext || window.webkitAudioContext, actx = null;
  var env = {
    getCtx: function () { if (!actx && AC) { try { actx = new AC(); } catch (e) { return null; } } return actx; },
    now: function () { return Date.now(); },
    rand: Math.random,
    setTimer: function (f, ms) { return setTimeout(f, ms); },
    clearTimer: function (t) { clearTimeout(t); }
  };
  var hub = L.registerStarters(L.createHub(env));
  window.HighwayLive.hub = hub;
  window.hwRegisterGesture = hub.registerGesture;       // adding a gesture = one call
  window.hwPlayGesture = hub.play;

  // Interaction = held. The first one also unlocks the AudioContext (iOS requirement).
  ["touchstart", "pointerdown", "keydown", "scroll", "wheel"].forEach(function (ev) {
    window.addEventListener(ev, function () { hub.interact(); hub.unlock(); }, { passive: true, capture: true });
  });
  setInterval(function () { hub.tick(); }, 2000);

  // App open after absence -> greeting.
  var LS = "hw_last_seen";
  function lastSeen() { try { return Number(localStorage.getItem(LS)) || 0; } catch (e) { return 0; } }
  function markSeen() { try { localStorage.setItem(LS, String(Date.now())); } catch (e) { /* ignore */ } }
  var ls0 = lastSeen();
  hub.appOpened(ls0 ? Date.now() - ls0 : 0);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") { hub.appOpened(Date.now() - lastSeen()); }
    else { markSeen(); hub.stopAll(); }
  });
  setInterval(markSeen, 30000);

  // Socket. Token is stored on this device (iOS gives the Home Screen app its own storage, so it
  // must be entered inside the installed app). Receive-only: the socket never posts.
  var TK = "hw_ws_token";
  function getToken() { try { return localStorage.getItem(TK); } catch (e) { return null; } }
  var dot = null;
  function paint(s) { if (!dot) return; dot.title = "Live socket: " + s; dot.style.opacity = s === "live" ? "1" : "0.45"; }
  var sock = L.createSocket({
    url: HW_BRIDGE.replace(/^http/, "ws") + "/ws",
    getToken: getToken,
    onStatus: paint,
    onHaptic: function (action, from, spec) { hub.play(action, spec ? { spec: spec } : undefined); },
    onMessage: function () { if (typeof window.hwPullMessages === "function") window.hwPullMessages(); }
  });
  function addControl() {
    var header = document.querySelector(".head-top") || document.body;
    dot = document.createElement("button");
    dot.id = "hwlive"; dot.textContent = "〰"; dot.title = "Live socket";
    dot.style.cssText = "background:none;border:1px solid #c1121f;color:#c1121f;border-radius:8px;padding:4px 10px;font-size:16px;cursor:pointer;margin-left:8px;opacity:.45;";
    dot.onclick = function () {
      var cur = getToken() || "";
      var t = window.prompt("Highway live socket token (experimental haptics). Blank to disconnect.", cur);
      if (t === null) return;
      try { if (t.trim()) localStorage.setItem(TK, t.trim()); else localStorage.removeItem(TK); } catch (e) { /* ignore */ }
      sock.stop(); if (t.trim()) sock.start();
    };
    header.appendChild(dot);
    paint(sock.status());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { addControl(); sock.start(); });
  else { addControl(); sock.start(); }
})();
