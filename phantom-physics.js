/* PhantomWay presence physics (North Star, Horizon 1).
 *  - Critically damped chase springs, K = 55 / 35 / 20 (light / medium / heavy), c = 2*sqrt(K), zeta = 1.
 *  - Layered prime-ratio sine idle so stillness never visibly repeats.
 *  - Integrated in ONE requestAnimationFrame loop on plain numbers; only CSS transforms
 *    (translate3d / scale) are committed to the DOM, so layout and paint are bypassed.
 *  - Link telemetry: RTT bands from the Latency Thresholds table, shown in the Face tab.
 * Visual only. Never touches audio, haptics, sockets or app state. */
(function (root) {
  'use strict';
  var P = root.PhantomProfile;
  if (!P) return;

  /* ---------- spring (semi-implicit, sub-stepped; stable at 120 Hz and after a stall) ---------- */
  function Spring(K, m) {
    this.K = K; this.m = m || 1; this.c = 2 * Math.sqrt(this.m * K);
    this.x = 0; this.v = 0; this.t = 0;
  }
  Spring.prototype.step = function (dt) {
    var h = 1 / 240, n = Math.max(1, Math.ceil(dt / h)); h = dt / n;
    for (var i = 0; i < n; i++) {
      var a = (-this.K * (this.x - this.t) - this.c * this.v) / this.m;
      this.v += a * h; this.x += this.v * h;
    }
  };
  Spring.prototype.settled = function () { return Math.abs(this.x - this.t) < 0.01 && Math.abs(this.v) < 0.01; };
  // Analytic critically damped step response x(t) = T(1 - (1 + wn t) e^{-wn t}), used to verify the integrator.
  function analytic(K, m, T, t) { var w = Math.sqrt(K / m); return T * (1 - (1 + w * t) * Math.exp(-w * t)); }

  function idle(t, phases) {
    var s = 0, I = P.idle;
    for (var i = 0; i < I.amps.length; i++) s += I.amps[i] * Math.sin(2 * Math.PI * I.freqs[i] * t + phases[i]);
    return s;
  }

  var api = { Spring: Spring, analytic: analytic, idle: idle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window === 'undefined') return;
  root.PhantomPhysics = api;

  var d = document, html = d.documentElement;
  html.classList.add('ph-on');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- the Face orb: heavy mass, leans toward the finger / the tilt, breathes with the idle layer ---------- */
  var ox = new Spring(P.springs.heavy.K, P.mass), oy = new Spring(P.springs.heavy.K, P.mass);
  var orb = null, ptr = { x: 0, y: 0, at: -1e9 }, tilt = { g: null, b: null }, T0 = performance.now(), last = T0, raf = 0;
  var link = { state: 'measuring', ms: 0 };

  d.addEventListener('pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = performance.now(); wake(); }, { passive: true });
  d.addEventListener('pointerdown', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = performance.now(); wake(); }, { passive: true });
  root.addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return; tilt.g = e.gamma; tilt.b = e.beta; wake();
  }, { passive: true });

  function faceActive() { var v = d.getElementById('view-face'); return !!(v && v.offsetParent !== null); }   // visible: active tab, or the PC side pane

  function frame(now) {
    raf = 0;
    if (d.hidden) return;
    var dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    var t = (now - T0) / 1000;
    if (faceActive()) {
      orb = orb || d.querySelector('.face-orb');
      if (orb) {
        var r = orb.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, tx = 0, ty = 0;
        if (tilt.g != null && now - ptr.at > 1500) { tx = clamp(tilt.g * 0.5, -16, 16); ty = clamp((tilt.b - 45) * 0.3, -14, 14); }
        else if (now - ptr.at < 2500) { tx = clamp((ptr.x - cx) * 0.07, -P.reach, P.reach); ty = clamp((ptr.y - cy) * 0.07, -P.reach, P.reach); }
        var amp = (P.link.suspendOnCollapse && link.state === 'collapsed') ? 0 : 1;      // "suspended state", opt-in
        ox.t = tx; oy.t = ty; ox.step(dt); oy.step(dt);
        var ix = idle(t, P.idle.phasesX) * amp, iy = idle(t, P.idle.phasesY) * amp;
        var sc = 1 + 0.012 * (idle(t * 0.7, P.idle.phasesX) / 3) * amp;
        orb.style.transform = 'translate3d(' + (ox.x + ix).toFixed(2) + 'px,' + (oy.x + iy).toFixed(2) + 'px,0) scale(' + sc.toFixed(4) + ')';
      }
      raf = requestAnimationFrame(frame);       // idle respiration needs continuous frames, only while Face is open
    }
  }
  function wake() { if (!raf && !d.hidden && faceActive()) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* ---------- tab weight: the incoming view settles on a medium spring, no overshoot ---------- */
  var vs = new Spring(P.springs.medium.K, P.mass), vEl = null, vraf = 0, vlast = 0;
  function settleView(el) {
    vEl = el; vs.x = 22; vs.v = 0; vs.t = 0; vlast = performance.now();
    if (!vraf) vraf = requestAnimationFrame(viewFrame);
  }
  function viewFrame(now) {
    vraf = 0; if (!vEl) return;
    var dt = Math.min((now - vlast) / 1000, 1 / 20); vlast = now; vs.step(dt);
    var k = clamp(1 - Math.abs(vs.x) / 22, 0, 1);
    if (vs.settled()) { vEl.style.transform = ''; vEl.style.opacity = ''; vEl = null; return; }
    vEl.style.transform = 'translate3d(0,' + vs.x.toFixed(2) + 'px,0)'; vEl.style.opacity = k.toFixed(3);
    vraf = requestAnimationFrame(viewFrame);
  }
  var mo = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      var el = m.target;
      if (el.classList && el.classList.contains('view') && el.classList.contains('active') && !(m.oldValue || '').split(' ').includes('active')) {
        settleView(el); if (el.id === 'view-face') wake();
      }
    });
  });
  function observeViews() { d.querySelectorAll('.view').forEach(function (v) { mo.observe(v, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }); }); }
  d.addEventListener('visibilitychange', function () { if (!d.hidden) wake(); });

  /* ---------- link telemetry: round trip to the bridge, banded per the Latency Thresholds table ---------- */
  var samples = [], pingN = 0, spark = null;
  function band(ms) {
    var L = P.link;
    return ms <= L.directMs ? 'direct' : ms <= L.relayMs ? 'relay' : ms <= L.collapseMs ? 'strained' : 'collapsed';
  }
  var LABEL = { direct: 'Full co-presence', relay: 'Acceptable', strained: 'Straining', collapsed: 'Presence collapsing', offline: 'No link', measuring: 'Measuring' };
  var NOTE = {
    direct: 'Direct path. Motion and sensing stay in step with you.',
    relay: 'Relayed path. A slight lag on fast movement; tracking holds.',
    strained: 'Close to the limit where presence detaches from your hand.',
    collapsed: 'Over 100 ms. The room feels like a remote video feed, not a place.',
    offline: 'The bridge did not answer.', measuring: ''
  };
  function paintLink() {
    var ms = d.getElementById('pl-ms'), lb = d.getElementById('pl-label'), nt = d.getElementById('pl-note'), card = d.getElementById('face-link');
    if (!ms) return;
    ms.textContent = link.ms ? Math.round(link.ms) + ' ms' : '—';
    lb.textContent = LABEL[link.state]; nt.textContent = NOTE[link.state];
    if (card) card.setAttribute('data-link', link.state);
    html.setAttribute('data-link', link.state);
    spark = spark || d.querySelector('#pl-spark polyline');
    if (spark && samples.length) {
      var mx = Math.max(120, Math.max.apply(null, samples)), n = samples.length;
      spark.setAttribute('points', samples.map(function (v, i) {
        return ((n === 1 ? 0 : i / (n - 1)) * 120).toFixed(1) + ',' + (30 - Math.min(v, mx) / mx * 28).toFixed(1);
      }).join(' '));
    }
  }
  function ping() {
    var base = root.PHANTOM_BRIDGE; if (!base) return;
    var t0 = performance.now(), n = ++pingN;
    fetch(base + '/health', { cache: 'no-store', mode: 'cors' }).then(function (r) {
      var ms = performance.now() - t0;
      if (!r.ok) throw new Error('http ' + r.status);
      if (n === 1) return;                                   // first request carries the TLS handshake: discard
      samples.push(ms); if (samples.length > 30) samples.shift();
      var w = samples.slice(-P.link.window).sort(function (a, b) { return a - b; });
      link.ms = w[Math.floor(w.length / 2)]; link.state = band(link.ms); paintLink();
    }).catch(function () { link.state = 'offline'; link.ms = 0; paintLink(); });
  }

  function boot() {
    observeViews(); paintLink(); wake();
    ping(); setInterval(function () { if (!d.hidden) ping(); }, P.link.intervalMs);
    setTimeout(ping, 1200);                                   // second sample early so the card fills in quickly
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);
