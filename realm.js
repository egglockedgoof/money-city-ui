/* Realm interaction + iPhone layout controller. Purely visual/layout: never touches
   audio, haptics, sockets or app state. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, vv = window.visualViewport;
  var chat = null, msg = null;

  /* ---------- keyboard-aware frame ---------- */
  var lastKb = false;
  function nearBottom(el) { return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120; }
  function sync() {
    chat = chat || d.getElementById('chat');
    var h = vv ? vv.height : window.innerHeight;
    var top = vv ? vv.offsetTop : 0;
    var layoutH = root.clientHeight || window.innerHeight;
    var kb = (layoutH - h) > 110;
    var stick = nearBottom(chat);
    root.style.setProperty('--vvh', Math.round(h) + 'px');
    root.style.setProperty('--vvt', Math.round(top) + 'px');
    root.style.setProperty('--viewport-height', Math.round(h) + 'px'); // keep highway.js var in step
    if (kb !== lastKb) { lastKb = kb; root.classList.toggle('kb-open', kb); }
    // iOS scrolls the layout viewport to reveal the focused field; pin it back.
    if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    if (stick && chat) chat.scrollTop = chat.scrollHeight;
  }
  if (vv) { vv.addEventListener('resize', sync); vv.addEventListener('scroll', sync); }
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', function () { setTimeout(sync, 120); setTimeout(sync, 420); });
  d.addEventListener('focusin', function () { sync(); setTimeout(sync, 60); setTimeout(sync, 320); });
  d.addEventListener('focusout', function () { setTimeout(sync, 60); setTimeout(sync, 320); });
  window.addEventListener('pageshow', sync);
  sync();

  /* ---------- composer ---------- */
  function fit() {
    msg = msg || d.getElementById('msg');
    if (!msg) return;
    if (!msg.value) { msg.style.height = ''; return; }   // empty -> back to one line
    msg.style.height = 'auto';
    msg.style.height = Math.min(msg.scrollHeight, 120) + 'px';
  }
  function afterSend() { [0, 60, 400].forEach(function (t) { setTimeout(fit, t); }); }
  d.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#send')) afterSend(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.id === 'msg') afterSend(); });
  d.addEventListener('input', function (e) { if (e.target && e.target.id === 'msg') fit(); });

  // Tapping Send / attach / mic must not blur the textbox (keeps the keyboard up, like iMessage).
  // iOS fires a compat mousedown after touchend; cancelling it keeps focus without eating the click.
  d.addEventListener('mousedown', function (e) {
    var b = e.target.closest && e.target.closest('#send, #attachBtn, #voiceBtn, #clear');
    if (b && d.activeElement && d.activeElement.id === 'msg') e.preventDefault();
  });


  /* ---------- copy any message (button + native long-press selection both work) ---------- */
  var toastEl, toastT;
  function toast(t) {
    if (!toastEl) { toastEl = d.createElement('div'); toastEl.className = 'rl-toast'; d.body.appendChild(toastEl); }
    toastEl.textContent = t; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 1400);
  }
  function copyText(t) {
    function legacy() {
      var ta = d.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px'; d.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, t.length); var ok = false;
      try { ok = d.execCommand('copy'); } catch (e) {}
      d.body.removeChild(ta); return ok;
    }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacy(); });
    return Promise.resolve(legacy());
  }
  function addCopy(row) {
    if (!row || row.__rl) return; var who = row.querySelector('.who'), txt = row.querySelector('.msg-text, .bubble');
    if (!who || !txt) return; row.__rl = 1;
    var b = d.createElement('button'); b.type = 'button'; b.className = 'rl-copy'; b.setAttribute('aria-label', 'Copy message'); b.textContent = '⧉';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var node = row.querySelector('.msg-text') || row.querySelector('.bubble');
      var t = (node.innerText || node.textContent || '').trim();
      copyText(t).then(function (ok) { toast(ok ? 'Copied' : 'Press and hold the text to copy');
        if (ok) { b.classList.add('done'); b.textContent = '✓'; setTimeout(function () { b.classList.remove('done'); b.textContent = '⧉'; }, 1200); } });
    });
    who.appendChild(b);
  }
  function scanCopy(root) { (root || d).querySelectorAll('.row').forEach(addCopy); }
  function watchChats() {
    ['chat', 'hangout-chat'].forEach(function (id) {
      var el = d.getElementById(id); if (!el || el.__rlw) return; el.__rlw = 1;
      new MutationObserver(function () { scanCopy(el); }).observe(el, { childList: true, subtree: true });
      scanCopy(el);
    });
  }

  /* ---------- clear-room button lives in the Face tab's Room card (same element, same handler) ---------- */
  function moveClear() {
    var c = d.getElementById('clear'), room = d.getElementById('face-room');
    if (c && room && c.parentNode !== room) room.appendChild(c);
  }

  function boot() { watchChats(); moveClear(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 800);


  /* ---------- PhantomWay wordmark: every UI occurrence gets the ethereal treatment ---------- */
  var SKIP = 'script,style,textarea,input,select,option,.pw,.bubble,#notes,#tasklist,#actlist,#newslist,[contenteditable]';
  var NAME = /PhantomWay/g, wmQueued = false;
  function wrapName(rootEl) {
    var w = d.createTreeWalker(rootEl || d.body, NodeFilter.SHOW_TEXT, null), hits = [], n;
    while ((n = w.nextNode())) {
      if (n.nodeValue.indexOf('PhantomWay') < 0) continue;
      var p = n.parentElement; if (!p || p.closest(SKIP)) continue;
      hits.push(n);
    }
    hits.forEach(function (node) {
      var parts = node.nodeValue.split(NAME), frag = d.createDocumentFragment();
      parts.forEach(function (txt, i) {
        if (txt) frag.appendChild(d.createTextNode(txt));
        if (i < parts.length - 1) { var s = d.createElement('span'); s.className = 'pw'; s.setAttribute('data-text', 'PhantomWay'); s.setAttribute('aria-label', 'PhantomWay'); s.innerHTML = 'PhantomWay'.split('').map(function (ch, n) { return '<i class="pwl" style="--i:' + n + '">' + ch + '</i>'; }).join(''); frag.appendChild(s); }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  function queueWrap() { if (wmQueued) return; wmQueued = true; requestAnimationFrame(function () { wmQueued = false; wrapName(); }); }
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) { var t = muts[i].target; if (!(t.closest && t.closest('.pw'))) { queueWrap(); return; } }
  }).observe(d.documentElement, { childList: true, subtree: true, characterData: true });
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', queueWrap); else queueWrap();

  /* ---------- pointer ripple ---------- */
  function ripple(e) {
    var b = e.target.closest && e.target.closest('button, .tab, .hs-btn');
    if (!b || b.disabled) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.4;
    var i = d.createElement('span');
    i.className = 'rl-ripple';
    i.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(i);
    setTimeout(function () { if (i.parentNode) i.parentNode.removeChild(i); }, 800);
  }
  d.addEventListener('pointerdown', ripple, { passive: true });

  /* ---------- light follows the finger across glass ---------- */
  var raf = 0, px = 0, py = 0;
  function move(e) {
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      ['.head', '.tabs', '.foot'].forEach(function (sel) {
        var el = d.querySelector(sel); if (!el) return;
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (px - r.left) + 'px');
        el.style.setProperty('--my', (py - r.top) + 'px');
      });
    });
  }
  d.addEventListener('pointermove', move, { passive: true });
  d.addEventListener('pointerdown', move, { passive: true });
})();
