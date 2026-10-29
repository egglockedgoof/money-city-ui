/* PHANTOM LAYER — behaviour half of phantom-ui.css.
   Purely UI: tab glitch + glider, message grouping, jump-to-latest pill, toast,
   and the Hangout lane (which had no wiring at all before this file).
   Uses window.HW_api from highway.js for auth. Never touches audio/haptics/sockets. */
(function () {
  'use strict';
  var d = document;
  function $(id) { return d.getElementById(id); }
  function api() { return window.HW_api || null; }

  /* ---------- toast (hard-red, soft black edge) ---------- */
  var toastEl, toastT;
  window.HW_toast = function (text) {
    if (!toastEl) { toastEl = d.createElement('div'); toastEl.className = 'ph-toast'; toastEl.setAttribute('role', 'status'); d.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  };

  /* ---------- living grain (dither) ---------- */
  var grain = d.createElement('div'); grain.className = 'ph-grain'; grain.setAttribute('aria-hidden', 'true');
  d.body.insertBefore(grain, d.body.firstChild);

  /* ---------- glitch tear on tab change ---------- */
  var tear = d.createElement('div'); tear.id = 'ph-tear'; tear.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < 6; i++) tear.appendChild(d.createElement('i'));
  d.body.appendChild(tear);
  var tearT;
  function glitch() {
    var s = tear.children;
    for (var k = 0; k < s.length; k++) {
      s[k].style.setProperty('--y', (Math.random() * 92).toFixed(1) + '%');
      s[k].style.setProperty('--h', (2 + Math.random() * 9).toFixed(1) + '%');
      s[k].style.setProperty('--dx', ((Math.random() < .5 ? -1 : 1) * (14 + Math.random() * 60)).toFixed(0) + 'px');
      s[k].style.setProperty('--d', (Math.random() * 90).toFixed(0) + 'ms');
    }
    tear.classList.remove('on'); void tear.offsetWidth; tear.classList.add('on');
    clearTimeout(tearT); tearT = setTimeout(function () { tear.classList.remove('on'); }, 560);
  }

  /* ---------- glider rides the expanding tab, frame by frame ---------- */
  function placeGlider() {
    var a = d.querySelector('.tab.active'), g = d.querySelector('.tab-glider'), t = d.querySelector('.tabs');
    if (!a || !g || !t) return;
    var tr = t.getBoundingClientRect(), ar = a.getBoundingClientRect();
    g.style.left = (ar.left - tr.left) + 'px'; g.style.width = ar.width + 'px';
  }
  function trackGlider() {
    var t0 = performance.now();
    (function step(now) { placeGlider(); if (now - t0 < 720) requestAnimationFrame(step); })(t0);
  }
  d.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.tab');
    if (!tab) return;
    glitch(); trackGlider();
    if (tab.getAttribute('data-v') === 'view-nexus') setTimeout(hangoutPull, 60);
  });
  window.addEventListener('resize', placeGlider);
  [350, 900, 1800].forEach(function (ms) { setTimeout(placeGlider, ms); });

  /* ---------- group consecutive messages from the same person ---------- */
  var GROUP_MS = 180000;
  function whoName(row) { var w = row.querySelector('.who'); return w && w.firstChild ? String(w.firstChild.textContent || '').trim() : ''; }
  function groupRows(box) {
    var prev = null, kids = box.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (!el.classList.contains('row')) { prev = null; continue; }
      var same = prev && prev.side === (el.classList.contains('me-row') ? 'me' : 'them') && prev.name === whoName(el) &&
        Math.abs((Number(el.getAttribute('data-ts')) || 0) - prev.ts) < GROUP_MS;
      el.classList.toggle('grouped', !!same);
      prev = { name: whoName(el), side: el.classList.contains('me-row') ? 'me' : 'them', ts: Number(el.getAttribute('data-ts')) || 0 };
    }
  }
  function watchGroups(box) {
    if (!box || box.__phg) return; box.__phg = 1;
    var q = false;
    new MutationObserver(function () {
      if (q) return; q = true;
      requestAnimationFrame(function () { q = false; groupRows(box); });
    }).observe(box, { childList: true });
    groupRows(box);
  }

  /* ---------- jump-to-latest pill with unread count ---------- */
  var chat = $('chat'), view = $('view-chat'), unread = 0, pill;
  function distance() { return chat.scrollHeight - chat.scrollTop - chat.clientHeight; }
  function pillUpdate() {
    if (!pill) return;
    pill.style.bottom = Math.max(12, view.clientHeight - (chat.offsetTop + chat.offsetHeight) + 14) + 'px';
    pill.classList.toggle('show', distance() > 240 || unread > 0);
    pill.classList.toggle('has-n', unread > 0);
    pill.querySelector('.n').textContent = unread > 99 ? '99+' : String(unread);
    pill.querySelector('b').textContent = unread > 0 ? (unread === 1 ? 'new message' : 'new messages') : 'Latest';
  }
  if (chat && view) {
    pill = d.createElement('button'); pill.type = 'button'; pill.className = 'ph-jump'; pill.setAttribute('aria-label', 'Jump to latest message');
    pill.innerHTML = '<span class="n">0</span><b>Latest</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    view.appendChild(pill);
    pill.addEventListener('click', function () { unread = 0; chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }); setTimeout(pillUpdate, 400); });
    chat.addEventListener('scroll', function () { if (distance() < 120) unread = 0; pillUpdate(); }, { passive: true });
    window.addEventListener('resize', pillUpdate);
    window.HW_unread = function () { unread++; pillUpdate(); };
    watchGroups(chat);
  }
  watchGroups($('hangout-chat'));

  /* ---------- HANGOUT lane: just talk (channel "hangout") ---------- */
  var hSeen = {}, hBusy = false, hList = $('hangout-chat'), hInput = $('hangout-msg'), hBtn = $('hangout-send');
  function hRow(m) {
    var A = api(), name = String(m.name || 'anon'), mine = A && (m.deviceId === A.device || name === A.name());
    var ts = Number(m.tsNum || m.ts || 0) || 0;
    var row = d.createElement('div');
    row.className = 'row ' + (mine ? 'me-row' : 'them-row');
    row.setAttribute('data-id', m.id); row.setAttribute('data-ts', String(ts));
    row.innerHTML = '<div class="bwrap"><div class="who" style="unicode-bidi:isolate">' + A.esc(name) + A.crown(name) +
      '<span class="ts">' + A.fmtTime({ tsNum: ts }) + '</span></div><div class="bubble"><span class="msg-text" style="unicode-bidi:isolate">' +
      A.pingify(m.text || '') + '</span></div></div>';
    return row;
  }
  function hEmpty() {
    if (!hList || hList.querySelector('.row') || hList.querySelector('.ph-empty')) return;
    var e = d.createElement('div'); e.className = 'ph-empty';
    e.innerHTML = '<b>Quiet in the Hangout</b>Ideas, plans, late-night thoughts. Say something.';
    hList.appendChild(e);
  }
  function hangoutPull() {
    var A = api(); if (!A || !A.name() || !hList || d.hidden) return;
    A.get('/api/messages?channel=hangout&limit=60').then(function (body) {
      var near = hList.scrollHeight - hList.scrollTop - hList.clientHeight < 160, added = false;
      var rows = (body.messages || []).slice().sort(function (a, b) { return (Number(a.tsNum || a.ts) || 0) - (Number(b.tsNum || b.ts) || 0); });
      rows.forEach(function (m) {
        if (hSeen[m.id]) return; hSeen[m.id] = 1;
        var emp = hList.querySelector('.ph-empty'); if (emp) emp.remove();
        hList.appendChild(hRow(m)); added = true;
      });
      if (!hList.querySelector('.row')) hEmpty();
      if (added && (near || !hList.__painted)) requestAnimationFrame(function () { hList.scrollTop = hList.scrollHeight; });
      hList.__painted = true;
    }).catch(function () { hEmpty(); });
  }
  function hangoutSend() {
    var A = api(); if (!A || !A.name() || hBusy) return;
    var t = (hInput.value || '').trim(); if (!t) return;
    hBusy = true; hInput.value = '';
    A.post('/api/messages', { name: A.name(), text: t.slice(0, 2000), channel: 'hangout', deviceId: A.device })
      .then(function () { hangoutPull(); setTimeout(hangoutPull, 700); })
      .catch(function (e) { hInput.value = t; window.HW_toast('Hangout send failed — ' + ((e && e.message) || 'try again')); })
      .then(function () { hBusy = false; });
  }
  if (hList && hInput && hBtn) {
    hBtn.addEventListener('click', hangoutSend);
    hInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hangoutSend(); } });
    hEmpty();
    setInterval(hangoutPull, 6000);
    setTimeout(hangoutPull, 2500);
  }
})();
