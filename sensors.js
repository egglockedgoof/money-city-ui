/*
 * Highway Face — PWA Sensory Manager (Trinity, Step 1)
 *
 * Local-first. Only computed FEATURES and deliberate captures leave the phone.
 * Every permission is requested from a tap, never on load.
 *
 * Audio features (every 60 s, from a local Web Audio loop; no audio is ever uploaded):
 *   rms_dbfs   20*log10(sqrt(mean(x^2))) over the whole window, full scale = 1.0, floor -120.
 *   f0_mean_hz / f0_std_hz
 *              Normalized-autocorrelation pitch (60-400 Hz) on frames louder than -55 dBFS
 *              whose best correlation is >= 0.5. Mean and population std over voiced frames.
 *              0 / 0 when the window had no voiced frames.
 *   chaos      Mean spectral flux, 0..1. Each frame's magnitude spectrum (20 Hz-8 kHz) is
 *              L1-normalized to sum 1; flux = 0.5 * sum|P_t - P_(t-1)|, i.e. the total-variation
 *              distance between consecutive spectra (0 = identical, 1 = disjoint). Averaged
 *              over frames. Frames sampled every 100 ms.
 *
 * Uploads go to the bridge (BRIDGE + /api/sense/*) with the hw_jwt login token. Only the latest
 * payload per kind is kept and retried on the next cycle. No backlog. Outcomes show on the
 * "uplink" status chip (live = last send OK, no-login = waiting for sign-in, error = see tooltip).
 */
(function (root) {
  'use strict';

  // The app is served from GitHub Pages, so a relative '/api/...' would hit Pages, not the bridge.
  var BRIDGE = 'https://highway-chat-mcp.onrender.com';
  var API = BRIDGE + '/api/sense/';
  var ENDPOINT = {
    audio: 'audio-features',
    look: 'look',
    orientation: 'orientation',
    geo: 'geo'
  };
  var AUDIO_WINDOW_MS = 60000;
  var FRAME_MS = 100;
  var RETRY_MS = 15000;
  var VOICED_DBFS = -55;
  var LOOK_MAX_SIDE = 1280;
  var LOOK_MAX_BYTES = 1.5 * 1024 * 1024;
  var ORIENT_MIN_DEG = 2;
  var ORIENT_HEARTBEAT_MS = 1000;
  var ORIENT_MIN_GAP_MS = 250;
  var GEO_MIN_METERS = 25;

  /* ---------- pure helpers (exported for tests) ---------- */

  function rmsOf(buf) {
    var s = 0;
    for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  }

  function toDbfs(rms) {
    return rms > 1e-6 ? 20 * Math.log10(rms) : -120;
  }

  // Returns {f0, clarity}; f0 = 0 when unvoiced.
  function estimateF0(buf, sr) {
    var n = buf.length;
    var minLag = Math.floor(sr / 400);
    var maxLag = Math.min(Math.floor(sr / 60), (n >> 1) - 1);
    if (maxLag <= minLag) return { f0: 0, clarity: 0 };

    var cum = new Float64Array(n + 1); // cumulative energy
    for (var i = 0; i < n; i++) cum[i + 1] = cum[i] + buf[i] * buf[i];
    if (cum[n] <= 0) return { f0: 0, clarity: 0 };

    var corr = new Float64Array(maxLag + 2);
    var best = 0;
    for (var lag = minLag; lag <= maxLag; lag++) {
      var dot = 0;
      for (var j = 0; j < n - lag; j++) dot += buf[j] * buf[j + lag];
      var ea = cum[n - lag];
      var eb = cum[n] - cum[lag];
      var denom = Math.sqrt(ea * eb);
      var c = denom > 0 ? dot / denom : 0;
      corr[lag] = c;
      if (c > best) best = c;
    }
    if (best < 0.5) return { f0: 0, clarity: best };

    // smallest lag that is a local peak within 15% of the best (avoids octave-down errors)
    var thresh = best * 0.85;
    var pick = 0;
    for (var l = minLag + 1; l < maxLag; l++) {
      if (corr[l] >= thresh && corr[l] >= corr[l - 1] && corr[l] >= corr[l + 1]) {
        pick = l;
        break;
      }
    }
    if (!pick) return { f0: 0, clarity: best };

    var a = corr[pick - 1], b = corr[pick], c2 = corr[pick + 1];
    var shift = a - 2 * b + c2 !== 0 ? 0.5 * (a - c2) / (a - 2 * b + c2) : 0;
    var period = pick + Math.max(-1, Math.min(1, shift));
    return { f0: sr / period, clarity: best };
  }

  // dB spectrum (analyser output) -> L1-normalized linear magnitudes over bins [lo, hi)
  function normalizeSpectrum(db, lo, hi) {
    var out = new Float32Array(hi - lo);
    var sum = 0;
    for (var i = lo; i < hi; i++) {
      var v = isFinite(db[i]) ? Math.pow(10, db[i] / 20) : 0;
      out[i - lo] = v;
      sum += v;
    }
    if (sum <= 0) return null;
    for (var k = 0; k < out.length; k++) out[k] /= sum;
    return out;
  }

  function spectralFlux(prev, cur) {
    var d = 0;
    for (var i = 0; i < cur.length; i++) d += Math.abs(cur[i] - prev[i]);
    return d / 2;
  }

  function meanStd(arr) {
    if (!arr.length) return { mean: 0, std: 0 };
    var m = 0, i;
    for (i = 0; i < arr.length; i++) m += arr[i];
    m /= arr.length;
    var v = 0;
    for (i = 0; i < arr.length; i++) v += (arr[i] - m) * (arr[i] - m);
    return { mean: m, std: Math.sqrt(v / arr.length) };
  }

  function angDelta(a, b) {
    var d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function haversineM(lat1, lon1, lat2, lon2) {
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function round(n, p) {
    var f = Math.pow(10, p);
    return Math.round(n * f) / f;
  }

  /* ---------- state: status + latest-only upload queue ---------- */

  var cfg = { getJwt: defaultJwt };
  var statusEl = null;
  var status = {
    mic: { state: 'off', note: '' },
    camera: { state: 'off', note: '' },
    orientation: { state: 'off', note: '' },
    geo: { state: 'off', note: '' },
    uplink: { state: 'idle', note: 'Nothing sent yet' }
  };
  var LABEL = { mic: 'mic', camera: 'camera', orientation: 'orientation', geo: 'geo', uplink: 'uplink' };

  function defaultJwt() {
    try { return root.localStorage.getItem('hw_jwt'); } catch (e) { return null; }
  }

  function setStatus(name, state, note) {
    var prev = status[name];
    if (prev && prev.state === state && prev.note === (note || '')) return;
    status[name] = { state: state, note: note || '' };
    renderStatus();
  }

  function renderStatus() {
    if (!statusEl) return;
    statusEl.textContent = '';
    ['mic', 'camera', 'orientation', 'geo', 'uplink'].forEach(function (k) {
      var s = status[k];
      var span = root.document.createElement('span');
      span.className = 'hs-s';
      span.setAttribute('data-state', s.state);
      if (s.note) span.title = s.note;
      span.textContent = LABEL[k] + ' ' + s.state;
      statusEl.appendChild(span);
    });
  }

  var pending = { audio: null, look: null, orientation: null, geo: null };
  var inflight = {};
  var retryTimer = null;

  function queue(kind, payload) {
    pending[kind] = payload; // latest only
    flush(kind);
    ensureRetry();
  }

  function flush(kind) {
    var p = pending[kind];
    if (!p || inflight[kind]) return;
    var jwt;
    try { jwt = cfg.getJwt(); } catch (e) { jwt = null; }
    if (!jwt) { setStatus('uplink', 'no-login', 'Not signed in: ' + kind + ' is waiting to be sent'); return; }
    inflight[kind] = true;
    try {
      root.fetch(API + ENDPOINT[kind], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
        body: JSON.stringify(p)
      }).then(function (r) {
        if (r && r.ok) {
          if (pending[kind] === p) pending[kind] = null;
          setStatus('uplink', 'live', kind + ' sent ' + new Date().toLocaleTimeString());
        } else {
          setStatus('uplink', 'error', kind + ' rejected: HTTP ' + (r && r.status));
        }
      }).catch(function () {
        setStatus('uplink', 'error', kind + ' not sent: bridge unreachable');
      }).then(function () {
        inflight[kind] = false;
      });
    } catch (e) {
      inflight[kind] = false;
    }
  }

  function ensureRetry() {
    if (retryTimer) return;
    retryTimer = root.setInterval(function () {
      var any = false;
      Object.keys(pending).forEach(function (k) {
        if (pending[k]) { any = true; flush(k); }
      });
      if (!any) { root.clearInterval(retryTimer); retryTimer = null; }
    }, RETRY_MS);
  }

  /* ---------- microphone: features only ---------- */

  var mic = null;

  function resetAcc(m) {
    m.sumSq = 0; m.frames = 0; m.f0s = []; m.fluxSum = 0; m.fluxN = 0;
  }

  function enableMic() {
    if (mic) return Promise.resolve();
    var md = root.navigator && root.navigator.mediaDevices;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!md || !md.getUserMedia || !AC) {
      setStatus('mic', 'unavailable', 'Web Audio or getUserMedia not supported here');
      return Promise.resolve();
    }
    // Create/resume inside the tap so iOS lets the context run.
    var ctx = new AC();
    try { ctx.resume(); } catch (e) {}

    return md.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    }).then(function (stream) {
      var src = ctx.createMediaStreamSource(stream);
      var an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0;
      src.connect(an);

      var binHz = ctx.sampleRate / an.fftSize;
      var m = {
        ctx: ctx, stream: stream, an: an,
        td: new Float32Array(an.fftSize),
        fd: new Float32Array(an.frequencyBinCount),
        lo: Math.max(1, Math.floor(20 / binHz)),
        hi: Math.min(an.frequencyBinCount, Math.ceil(8000 / binHz)),
        prev: null, frameTimer: null, windowTimer: null
      };
      resetAcc(m);
      mic = m;

      var track = stream.getAudioTracks()[0];
      if (track) {
        track.onended = function () { setStatus('mic', 'denied', 'Mic stream ended'); };
        track.onmute = function () { setStatus('mic', 'denied', 'Mic muted by system'); };
        track.onunmute = function () { setStatus('mic', 'live'); };
      }

      m.frameTimer = root.setInterval(function () { micFrame(m); }, FRAME_MS);
      m.windowTimer = root.setInterval(function () { micEmit(m); }, AUDIO_WINDOW_MS);

      // Do not fake it: confirm the context is running and the track is live.
      root.setTimeout(function () {
        if (mic !== m) return;
        var ok = ctx.state === 'running' && track && track.readyState === 'live' && !track.muted;
        if (ok) setStatus('mic', 'live');
        else setStatus('mic', 'denied', 'No live audio (iOS standalone mic can be blocked)');
      }, 1500);
    }).catch(function (err) {
      try { ctx.close(); } catch (e) {}
      var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setStatus('mic', denied ? 'denied' : 'unavailable',
        denied ? 'Mic permission denied or blocked in standalone mode' : String(err && err.name || err));
    });
  }

  function micFrame(m) {
    if (m.ctx.state !== 'running') return;
    m.an.getFloatTimeDomainData(m.td);
    var rms = rmsOf(m.td);
    m.sumSq += rms * rms;
    m.frames++;

    if (toDbfs(rms) > VOICED_DBFS) {
      var r = estimateF0(m.td, m.ctx.sampleRate);
      if (r.f0 > 0) m.f0s.push(r.f0);
    }

    m.an.getFloatFrequencyData(m.fd);
    var spec = normalizeSpectrum(m.fd, m.lo, m.hi);
    if (spec && m.prev) {
      m.fluxSum += spectralFlux(m.prev, spec);
      m.fluxN++;
    }
    m.prev = spec;
  }

  function micEmit(m) {
    if (m.frames === 0) return;
    var ms = meanStd(m.f0s);
    var payload = {
      rms_dbfs: round(toDbfs(Math.sqrt(m.sumSq / m.frames)), 1),
      f0_mean_hz: round(ms.mean, 1),
      f0_std_hz: round(ms.std, 1),
      chaos: round(m.fluxN ? Math.min(1, m.fluxSum / m.fluxN) : 0, 3),
      ts: Date.now()
    };
    resetAcc(m);
    queue('audio', payload);
  }

  function disableMic() {
    var m = mic;
    if (!m) return;
    mic = null;
    root.clearInterval(m.frameTimer);
    root.clearInterval(m.windowTimer);
    try { m.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { m.ctx.close(); } catch (e) {}
    setStatus('mic', 'off');
  }

  /* ---------- vision: the Look button (one deliberate photo per tap) ---------- */

  var looking = false;

  function drawScaled(src, w, h) {
    var scale = Math.min(1, LOOK_MAX_SIDE / Math.max(w, h));
    var c = root.document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  function stopStream(stream) {
    try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
  }

  function grabFromCamera() {
    var md = root.navigator.mediaDevices;
    return md.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    }).then(function (stream) {
      var v = root.document.createElement('video');
      v.setAttribute('playsinline', '');
      v.muted = true;
      v.srcObject = stream;
      return new Promise(function (resolve, reject) {
        v.onloadedmetadata = function () {
          v.play().then(function () {
            root.setTimeout(function () { resolve(v); }, 350); // let exposure settle
          }, reject);
        };
        v.onerror = reject;
      }).then(function (video) {
        var c = drawScaled(video, video.videoWidth, video.videoHeight);
        stopStream(stream);
        return c;
      }, function (e) {
        stopStream(stream);
        throw e;
      });
    });
  }

  function grabFromPicker() {
    return new Promise(function (resolve) {
      var input = root.document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.style.display = 'none';
      input.addEventListener('cancel', function () { resolve(null); });
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        if (!f) { resolve(null); return; }
        var url = root.URL.createObjectURL(f);
        var img = new root.Image();
        img.onload = function () {
          var c = drawScaled(img, img.naturalWidth, img.naturalHeight);
          root.URL.revokeObjectURL(url);
          resolve(c);
        };
        img.onerror = function () { root.URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      });
      root.document.body.appendChild(input);
      input.click();
      root.setTimeout(function () { if (input.parentNode) input.parentNode.removeChild(input); }, 120000);
    });
  }

  function blobOf(canvas, q) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/jpeg', q); });
  }

  function encodeJpeg(canvas) {
    var q = 0.7;
    function attempt(c, quality) {
      return blobOf(c, quality).then(function (blob) {
        if (!blob) throw new Error('encode failed');
        if (blob.size <= LOOK_MAX_BYTES) return blob;
        if (quality > 0.45) return attempt(c, quality - 0.1);
        var smaller = root.document.createElement('canvas');
        smaller.width = Math.round(c.width * 0.85);
        smaller.height = Math.round(c.height * 0.85);
        smaller.getContext('2d').drawImage(c, 0, 0, smaller.width, smaller.height);
        return attempt(smaller, 0.6);
      });
    }
    return attempt(canvas, q).then(function (blob) {
      return new Promise(function (resolve, reject) {
        var fr = new root.FileReader();
        fr.onload = function () { resolve(String(fr.result).split(',')[1] || ''); };
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
    });
  }

  function look() {
    if (looking) return Promise.resolve();
    looking = true;
    var md = root.navigator && root.navigator.mediaDevices;
    var viaPicker = false;

    var grab = (md && md.getUserMedia) ? grabFromCamera() : Promise.reject(new Error('no getUserMedia'));
    return grab.catch(function (err) {
      var denied = err && err.name === 'NotAllowedError';
      if (denied) setStatus('camera', 'denied', 'Camera permission denied');
      viaPicker = true;
      return grabFromPicker();
    }).then(function (canvas) {
      if (!canvas) return;
      return encodeJpeg(canvas).then(function (b64) {
        queue('look', { image: b64, ts: Date.now() });
        setStatus('camera', 'live', viaPicker ? 'Captured via photo picker' : 'Captured one frame');
      });
    }).catch(function () {
      if (status.camera.state === 'off') setStatus('camera', 'unavailable', 'Capture failed');
    }).then(function () {
      looking = false;
    });
  }

  /* ---------- device orientation ---------- */

  var orient = null;

  function enableOrientation() {
    if (orient) return Promise.resolve();
    var DOE = root.DeviceOrientationEvent;
    if (!DOE) {
      setStatus('orientation', 'unavailable', 'DeviceOrientationEvent not supported');
      return Promise.resolve();
    }
    var ask = typeof DOE.requestPermission === 'function'
      ? DOE.requestPermission() // must be called from a tap (iOS)
      : Promise.resolve('granted');

    return ask.then(function (res) {
      if (res !== 'granted') {
        setStatus('orientation', 'denied', 'Motion & orientation permission denied');
        return;
      }
      var o = { last: null, lastTs: 0, got: false };
      o.handler = function (e) {
        if (e.alpha == null && e.beta == null && e.gamma == null) return;
        var now = Date.now();
        var cur = { alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 };
        if (!o.got) { o.got = true; setStatus('orientation', 'live'); }
        var changed = !o.last ||
          angDelta(cur.alpha, o.last.alpha) > ORIENT_MIN_DEG ||
          Math.abs(cur.beta - o.last.beta) > ORIENT_MIN_DEG ||
          Math.abs(cur.gamma - o.last.gamma) > ORIENT_MIN_DEG;
        var since = now - o.lastTs;
        if ((changed && since >= ORIENT_MIN_GAP_MS) || since >= ORIENT_HEARTBEAT_MS) {
          o.last = cur;
          o.lastTs = now;
          queue('orientation', {
            alpha: round(cur.alpha, 1), beta: round(cur.beta, 1), gamma: round(cur.gamma, 1), ts: now
          });
        }
      };
      orient = o;
      root.addEventListener('deviceorientation', o.handler);
      root.setTimeout(function () {
        if (orient === o && !o.got) setStatus('orientation', 'denied', 'No orientation events arrived');
      }, 2500);
    }).catch(function () {
      setStatus('orientation', 'denied', 'Orientation permission request failed');
    });
  }

  function disableOrientation() {
    if (!orient) return;
    root.removeEventListener('deviceorientation', orient.handler);
    orient = null;
    setStatus('orientation', 'off');
  }

  /* ---------- geolocation ---------- */

  var geo = null;

  function enableGeo() {
    if (geo) return Promise.resolve();
    var nav = root.navigator;
    if (!nav || !nav.geolocation) {
      setStatus('geo', 'unavailable', 'Geolocation not supported');
      return Promise.resolve();
    }
    var g = { last: null };
    g.id = nav.geolocation.watchPosition(function (pos) {
      var c = pos.coords;
      if (status.geo.state !== 'live') setStatus('geo', 'live');
      var moved = !g.last ||
        haversineM(g.last.lat, g.last.lon, c.latitude, c.longitude) >
        Math.max(GEO_MIN_METERS, (c.accuracy || 0) * 0.5);
      if (!moved) return;
      g.last = { lat: c.latitude, lon: c.longitude };
      queue('geo', {
        lat: round(c.latitude, 6), lon: round(c.longitude, 6),
        accuracy_m: round(c.accuracy || 0, 1), ts: Date.now()
      });
    }, function (err) {
      if (err && err.code === 1) {
        setStatus('geo', 'denied', 'Location permission denied');
        if (geo === g) { nav.geolocation.clearWatch(g.id); geo = null; }
      } else {
        setStatus('geo', 'no-fix', 'Waiting for a location fix');
      }
    }, { enableHighAccuracy: false, maximumAge: 10000, timeout: 30000 });
    geo = g;
    return Promise.resolve();
  }

  function disableGeo() {
    if (!geo) return;
    root.navigator.geolocation.clearWatch(geo.id);
    geo = null;
    setStatus('geo', 'off');
  }

  /* ---------- UI: buttons + SENSOR STATUS line ---------- */

  var CSS =
    '.hs-wrap{display:flex;flex-direction:column;gap:10px;font:14px/1.3 system-ui,-apple-system,sans-serif}' +
    '.hs-row{display:flex;flex-wrap:wrap;gap:8px}' +
    '.hs-btn{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid #c1121f;background:transparent;' +
    'color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.hs-btn[aria-pressed="true"]{background:#c1121f;border-color:#7b2cbf;box-shadow:0 0 14px rgba(123,44,191,.55);color:#fff}' +
    '.hs-btn:disabled{opacity:.5}' +
    '.hs-btn:focus-visible{outline:2px solid #7b2cbf;outline-offset:2px}' +
    '.hs-status{display:flex;flex-wrap:wrap;gap:6px 14px;opacity:.9}' +
    '.hs-s::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;' +
    'background:#6b6b73;vertical-align:middle}' +
    '.hs-s[data-state="live"]::before{background:#7b2cbf;box-shadow:0 0 8px #7b2cbf}' +
    '.hs-s[data-state="denied"]::before,.hs-s[data-state="unavailable"]::before{background:#c1121f}' +
    '.hs-s[data-state="no-fix"]::before{background:#b8860b}';

  function injectCss() {
    if (root.document.getElementById('hs-css')) return;
    var st = root.document.createElement('style');
    st.id = 'hs-css';
    st.textContent = CSS;
    root.document.head.appendChild(st);
  }

  function toggleButton(label, isOn, on, off) {
    var b = root.document.createElement('button');
    b.type = 'button';
    b.className = 'hs-btn';
    b.textContent = label;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      var p = isOn() ? (off(), Promise.resolve()) : on();
      Promise.resolve(p).then(function () {
        root.setTimeout(function () { b.setAttribute('aria-pressed', isOn() ? 'true' : 'false'); }, 0);
      });
    });
    return b;
  }

  function mount(container) {
    injectCss();
    var wrap = root.document.createElement('div');
    wrap.className = 'hs-wrap';

    var row = root.document.createElement('div');
    row.className = 'hs-row';
    row.appendChild(toggleButton('Listen', function () { return !!mic; }, enableMic, disableMic));
    var lookBtn = root.document.createElement('button');
    lookBtn.type = 'button';
    lookBtn.className = 'hs-btn';
    lookBtn.textContent = 'Look';
    lookBtn.addEventListener('click', function () {
      lookBtn.disabled = true;
      look().then(function () { lookBtn.disabled = false; });
    });
    row.appendChild(lookBtn);
    row.appendChild(toggleButton('Tilt', function () { return !!orient; }, enableOrientation, disableOrientation));
    row.appendChild(toggleButton('Place', function () { return !!geo; }, enableGeo, disableGeo));

    var st = root.document.getElementById('sensor-status');
    if (!st) { st = root.document.createElement('div'); st.id = 'sensor-status'; }
    st.className = 'hs-status';
    st.setAttribute('aria-live', 'polite');
    statusEl = st;

    wrap.appendChild(row);
    wrap.appendChild(st);
    container.appendChild(wrap);
    renderStatus();

    root.document.addEventListener('visibilitychange', function () {
      if (!root.document.hidden && mic) { try { mic.ctx.resume(); } catch (e) {} }
    });
    return wrap;
  }

  var api = {
    mount: mount,
    configure: function (o) { if (o && typeof o.getJwt === 'function') cfg.getJwt = o.getJwt; },
    enableMic: enableMic, disableMic: disableMic,
    look: look,
    enableOrientation: enableOrientation, disableOrientation: disableOrientation,
    enableGeo: enableGeo, disableGeo: disableGeo,
    status: function () { return JSON.parse(JSON.stringify(status)); },
    _internals: {
      rmsOf: rmsOf, toDbfs: toDbfs, estimateF0: estimateF0, normalizeSpectrum: normalizeSpectrum,
      spectralFlux: spectralFlux, meanStd: meanStd, angDelta: angDelta, haversineM: haversineM
    }
  };

  root.HighwaySense = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
