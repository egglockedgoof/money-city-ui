/* FACE POLISH — behaviour that makes the room feel like a native app.
   Layout/behaviour only; the PhantomWay realm look is untouched.
   - html.is-scrolling while any list scrolls (heavy canvas/sheen pause → 60fps scroll)
   - full-screen image viewer (tap a picture; tap/swipe/back to close)
   - composer auto-grow that never fights realm.js
   - iOS: no double-tap zoom, no pinch zoom of the chrome, no rubber-band on the shell */
(function () {
  'use strict';
  var d = document, root = d.documentElement;

  /* ---------- scrolling flag ---------- */
  var scrollT = null;
  function onScroll() {
    if (!root.classList.contains('is-scrolling')) root.classList.add('is-scrolling');
    clearTimeout(scrollT);
    scrollT = setTimeout(function () { root.classList.remove('is-scrolling'); }, 140);
  }
  d.addEventListener('scroll', onScroll, { capture: true, passive: true });

  /* ---------- image viewer ---------- */
  var box = null, boxImg = null, opened = false;
  function closeViewer(fromPop) {
    if (!box || !opened) return;
    opened = false; box.classList.remove('on');
    setTimeout(function () { if (!opened) { box.hidden = true; boxImg.removeAttribute('src'); } }, 220);
    if (!fromPop && history.state && history.state.hwViewer) history.back();
  }
  function openViewer(src, alt) {
    if (!box) {
      box = d.createElement('div'); box.className = 'hw-viewer'; box.hidden = true;
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Picture');
      box.innerHTML = '<img alt=""><button type="button" class="hw-viewer-x" aria-label="Close">\u2715</button><a class="hw-viewer-open" target="_blank" rel="noopener">Open original</a>';
      boxImg = box.querySelector('img');
      box.addEventListener('click', function (e) { if (e.target.closest('.hw-viewer-open')) return; closeViewer(); });
      var sy = null;
      box.addEventListener('touchstart', function (e) { sy = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
      box.addEventListener('touchend', function (e) { if (sy !== null && Math.abs(e.changedTouches[0].clientY - sy) > 90) closeViewer(); sy = null; }, { passive: true });
      d.body.appendChild(box);
      window.addEventListener('popstate', function () { if (opened) closeViewer(true); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeViewer(); });
    }
    boxImg.src = src; boxImg.alt = alt || '';
    box.querySelector('.hw-viewer-open').href = src;
    box.hidden = false; void box.offsetWidth; box.classList.add('on'); opened = true;
    try { history.pushState({ hwViewer: 1 }, ''); } catch (e) {}
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.att-img[data-view]');
    if (!a) return;
    e.preventDefault();
    var im = a.querySelector('img');
    openViewer(a.getAttribute('data-view'), im && im.alt);
  });

  /* ---------- iOS gesture zoom of the chrome (user-scalable=no is ignored by iOS Safari) ---------- */
  ['gesturestart', 'gesturechange'].forEach(function (t) {
    d.addEventListener(t, function (e) { if (!(e.target.closest && e.target.closest('.hw-viewer'))) e.preventDefault(); }, { passive: false });
  });

  /* ---------- boot class: no entrance animations for the first paint ---------- */
  root.classList.add('hw-boot');
  setTimeout(function () { root.classList.remove('hw-boot'); }, 1800);
})();
