/* PhantomWay aether: the room is alive. A flow-field of blood-smoke that swirls away from your
 * finger or cursor, leans with the phone's tilt, and surges when a message lands.
 * Visual only (a pointer-events:none canvas). Quality scales itself to hold the frame budget:
 * resolution 0.75x..1.0x and particle count float with measured frame time (North Star:
 * "resolution scaling ... based on rolling frame-time measurements"). Pauses only when hidden. */
(function (root) {
  'use strict';
  if (typeof window === 'undefined') return;
  var d = document, P = root.PhantomProfile || { springs: { light: { K: 55 } }, mass: 1 };
  var cv = d.createElement('canvas'); cv.id = 'aether'; cv.setAttribute('aria-hidden', 'true');
  d.body.insertBefore(cv, d.body.firstChild);
  var ctx = cv.getContext('2d', { alpha: true });
  if (!ctx) return;

  var W = 0, H = 0, DPR = Math.min(root.devicePixelRatio || 1, 1.5), scale = 1, parts = [], target = 0, MAXP = 260, MINP = 70;
  var sprites = [];
  function sprite(r, g, b) {
    var s = 64, c = d.createElement('canvas'); c.width = c.height = s; var x = c.getContext('2d');
    var gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',.30)'); gr.addColorStop(.4, 'rgba(' + r + ',' + g + ',' + b + ',.09)'); gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, s, s); return c;
  }
  sprites = [sprite(255, 45, 70), sprite(200, 12, 34), sprite(255, 120, 135), sprite(120, 4, 20)];

  function size() {
    W = root.innerWidth; H = root.innerHeight;
    cv.width = Math.max(1, Math.round(W * DPR * scale)); cv.height = Math.max(1, Math.round(H * DPR * scale));
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    target = Math.max(MINP, Math.min(MAXP, Math.round(W * H / 9000)));
  }
  root.addEventListener('resize', size); size();

  function spawn(x, y, burst) {
    var a = Math.random() * 6.283, sp = burst ? 60 + Math.random() * 160 : 0;
    return { x: x == null ? Math.random() * W : x, y: y == null ? Math.random() * H : y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: burst ? 0.6 + Math.random() * 1.2 : 4 + Math.random() * 9, age: 0, r: burst ? 8 + Math.random() * 16 : 10 + Math.random() * 30,
      k: (Math.random() * sprites.length) | 0, ph: Math.random() * 6.283 };
  }
  for (var i = 0; i < target; i++) { var p = spawn(); p.age = Math.random() * p.life; parts.push(p); }

  // pointer: smoothed with the light spring (K=55) so the field responds with weight, not a snap
  var ptr = { x: -999, y: -999, tx: -999, ty: -999, vx: 0, vy: 0, on: 0 };
  var Kp = P.springs.light.K, Cp = 2 * Math.sqrt(Kp), ps = { x: 0, y: 0, vx: 0, vy: 0 };
  function mv(e) { ptr.tx = e.clientX; ptr.ty = e.clientY; if (ptr.x < -900) { ptr.x = ps.x = ptr.tx; ptr.y = ps.y = ptr.ty; } ptr.on = 1; }
  d.addEventListener('pointermove', mv, { passive: true });
  d.addEventListener('pointerdown', function (e) { mv(e); burst(e.clientX, e.clientY, 10); }, { passive: true });
  d.addEventListener('pointerleave', function () { ptr.on = 0; });
  var wind = { x: 0, y: 0, tx: 0, ty: 0 };
  root.addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return; wind.tx = Math.max(-1, Math.min(1, e.gamma / 35)) * 40; wind.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 35)) * 26;
  }, { passive: true });

  function burst(x, y, n) { for (var i = 0; i < n && parts.length < MAXP + 80; i++) parts.push(spawn(x, y, true)); }
  root.PhantomAether = { burst: burst };

  // a message landing surges the room (watch both chats for new rows)
  function watch(id) {
    var el = d.getElementById(id); if (!el || el.__ae) return; el.__ae = 1;
    new MutationObserver(function (m) {
      for (var i = 0; i < m.length; i++) for (var j = 0; j < m[i].addedNodes.length; j++) {
        var n = m[i].addedNodes[j];
        if (n.classList && n.classList.contains('row')) burst(n.classList.contains('me-row') ? W * 0.78 : W * 0.22, H * 0.72, 26);
      }
    }).observe(el, { childList: true });
  }
  function boot() { watch('chat'); watch('hangout-chat'); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 900);

  var last = performance.now(), T0 = last, ema = 1 / 60, since = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (d.hidden) { last = now; return; }
    var dt = Math.min((now - last) / 1000, 1 / 20); last = now; if (dt <= 0) return;
    var t = (now - T0) / 1000;
    ema += (dt - ema) * 0.05; since += dt;
    if (since > 1.2) {                      // adapt once per ~1.2 s, never thrash
      since = 0;
      if (ema > 1 / 48) { if (scale > 0.76) { scale = Math.max(0.75, scale - 0.125); size(); } else target = Math.max(MINP, Math.round(target * 0.85)); }
      else if (ema < 1 / 85) { if (target < Math.min(MAXP, Math.round(W * H / 9000))) target = Math.min(MAXP, Math.round(target * 1.1) + 1); else if (scale < 1) { scale = Math.min(1, scale + 0.125); size(); } }
    }
    // pointer spring
    ps.vx += (-Kp * (ps.x - ptr.tx) - Cp * ps.vx) * dt; ps.vy += (-Kp * (ps.y - ptr.ty) - Cp * ps.vy) * dt; ps.x += ps.vx * dt; ps.y += ps.vy * dt;
    wind.x += (wind.tx - wind.x) * Math.min(1, dt * 2); wind.y += (wind.ty - wind.y) * Math.min(1, dt * 2);

    // smoky trails: fade the previous frame instead of clearing it
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    while (parts.length < target) parts.push(spawn());
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.age += dt;
      if (p.age > p.life || p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80) { if (parts.length > target || p.life < 3) { parts.splice(i, 1); continue; } parts[i] = spawn(); continue; }
      // flow field from layered sines (curl-like, never repeating at these ratios)
      var a = (Math.sin(p.x * 0.0021 + t * 0.21) + Math.sin(p.y * 0.0027 - t * 0.17) + Math.sin((p.x + p.y) * 0.0016 + t * 0.11 + p.ph)) * 1.25;
      var fx = Math.cos(a) * 26 + wind.x, fy = Math.sin(a) * 26 - 9 + wind.y;
      // finger / cursor swirls and repels
      var dx = p.x - ps.x, dy = p.y - ps.y, d2 = dx * dx + dy * dy;
      if (ptr.on && d2 < 36000) { var f = (1 - d2 / 36000), dist = Math.sqrt(d2) + 1; fx += (dx / dist) * 240 * f + (-dy / dist) * 140 * f; fy += (dy / dist) * 240 * f + (dx / dist) * 140 * f; }
      p.vx += (fx - p.vx) * Math.min(1, dt * 1.6); p.vy += (fy - p.vy) * Math.min(1, dt * 1.6);
      p.x += p.vx * dt; p.y += p.vy * dt;
      var k = p.age / p.life, al = Math.sin(Math.PI * Math.min(1, k)) * (0.5 + 0.5 * Math.sin(t * 0.9 + p.ph) * 0.4 + 0.2);
      if (al <= 0.01) continue;
      ctx.globalAlpha = Math.min(1, al * 0.5); var r = p.r * (0.7 + 0.5 * k);
      ctx.drawImage(sprites[p.k], p.x - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})(typeof window !== 'undefined' ? window : globalThis);
