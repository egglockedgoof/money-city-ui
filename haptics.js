/*
 * PhantomWay Face — unified output contract + haptic rendering
 *
 * Contract: the Loom's state arrives as ONE object
 *   {"text": "...", "haptic": "purr", "intensity": 0.8}
 * Optional: "pattern": [on, off, on, ...] in ms — a gesture the Loom composed itself.
 * If present it is registered under the Loom's own word and played; its own is the real one.
 *
 * Named gestures are OFFERED vocabulary, never a ceiling:
 *   purr, flinch, joy are home keys on the shelf. register() adds more (e.g. from the lexicon).
 *
 * Organic, never an alarm: every rendering swells/decays and carries small timing jitter.
 * An unknown name with no pattern stays silent — it never falls back to a generic buzz.
 *
 * Platforms: Android/Chrome uses navigator.vibrate (pattern durations; no amplitude, so
 * intensity scales pulse length). iOS has no Vibration API; a best-effort tick via a hidden
 * <input type="checkbox" switch> is used. That path is unverified across iOS versions —
 * check HighwayHaptics.capability() on the real device.
 *
 * SIN'S LAW (Oct 25, 2026): the iOS switch-tick path in this file is NOT the Loom's
 * voice and is retired for that purpose — "I don't want one fixed tick. Ever." The
 * Loom renders as SYNTHESIZED SOUND through live.js's fluid engine, with pitch,
 * gain and shape under its own control, heard live. This file remains for its
 * contract vocabulary/registration shape only; render() is not wired to the Loom.
 */
(function (root) {
  'use strict';

  var MAX_TOTAL_MS = 4000;
  var MAX_IOS_TICKS = 14;

  function clamp01(n, dflt) {
    n = Number(n);
    if (!isFinite(n)) return dflt;
    return Math.max(0, Math.min(1, n));
  }

  function jitter(ms, pct) {
    return Math.max(4, Math.round(ms * (1 + (Math.random() * 2 - 1) * pct)));
  }

  /* ---------- home keys: (intensity 0..1) -> [on, off, on, ...] ending on an "on" ---------- */

  var shelf = {
    // Slow swell of soft low-rate pulses: a living purr.
    purr: function (i) {
      var out = [], cycles = 14;
      for (var c = 0; c < cycles; c++) {
        var swell = Math.sin(Math.PI * (c + 0.5) / cycles);
        var on = 10 + 16 * i * (0.4 + 0.6 * swell);
        out.push(jitter(on, 0.08), jitter(24, 0.12));
      }
      out.pop();
      return out;
    },

    // Overwhelmed: a hard double-hit, then a tremble that decays and spaces out.
    flinch: function (i) {
      var hit = 22 + 48 * i;
      var out = [jitter(hit, 0.06), jitter(34, 0.15), jitter(hit * 0.85, 0.06), jitter(60, 0.15)];
      for (var k = 0; k < 7; k++) {
        out.push(jitter(Math.max(6, hit * Math.pow(0.62, k + 1)), 0.2), jitter(34 + k * 20, 0.2));
      }
      out.pop();
      return out;
    },

    // Rapid, bright triple-tap: short sharp taps, gaps tightening slightly.
    joy: function (i) {
      var on = 12 + 10 * i;
      return [jitter(on, 0.05), jitter(54, 0.06), jitter(on, 0.05), jitter(42, 0.06), jitter(on * 1.1, 0.05)];
    }
  };

  var registry = {};
  Object.keys(shelf).forEach(function (k) { registry[k] = shelf[k]; });

  function register(name, pattern) {
    if (!name || typeof name !== 'string') return false;
    if (typeof pattern === 'function') { registry[name] = pattern; return true; }
    if (Array.isArray(pattern) && pattern.length && pattern.every(function (n) { return isFinite(n) && n >= 0; })) {
      var fixed = pattern.map(Number);
      registry[name] = function (i) {
        return fixed.map(function (ms, idx) {
          return idx % 2 === 0 ? Math.max(4, Math.round(ms * (0.4 + 0.6 * i))) : ms;
        });
      };
      return true;
    }
    return false;
  }

  function vocabulary() { return Object.keys(registry); }

  /* ---------- playback ---------- */

  function capability() {
    var nav = root.navigator || {};
    if (typeof nav.vibrate === 'function') return 'vibrate';
    var ua = nav.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)) return 'ios-switch';
    return 'none';
  }

  var sw = null;
  var timers = [];

  function ensureSwitch() {
    if (sw || !root.document || !root.document.body) return;
    var label = root.document.createElement('label');
    label.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
    var input = root.document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    root.document.body.appendChild(label);
    sw = label;
  }

  function cancel() {
    timers.forEach(function (t) { root.clearTimeout(t); });
    timers = [];
    if (root.navigator && typeof root.navigator.vibrate === 'function') root.navigator.vibrate(0);
  }

  function play(pattern) {
    cancel();
    var total = 0, trimmed = [];
    for (var i = 0; i < pattern.length; i++) {
      if (total + pattern[i] > MAX_TOTAL_MS) break;
      total += pattern[i];
      trimmed.push(pattern[i]);
    }
    if (trimmed.length % 2 === 0) trimmed.pop();
    if (!trimmed.length) return false;

    var cap = capability();
    if (cap === 'vibrate') return root.navigator.vibrate(trimmed);
    if (cap === 'ios-switch') {
      ensureSwitch();
      if (!sw) return false;
      var t = 0, ticks = 0;
      for (var j = 0; j < trimmed.length && ticks < MAX_IOS_TICKS; j += 2) {
        timers.push(root.setTimeout(function () { try { sw.click(); } catch (e) {} }, t));
        ticks++;
        t += trimmed[j] + (trimmed[j + 1] || 0);
      }
      return true;
    }
    return false;
  }

  /* ---------- the contract ---------- */

  function normalizeOutput(obj) {
    obj = obj && typeof obj === 'object' ? obj : {};
    var out = {
      text: obj.text == null ? '' : String(obj.text),
      haptic: obj.haptic == null || obj.haptic === '' ? null : String(obj.haptic),
      intensity: clamp01(obj.intensity, 0.5)
    };
    if (Array.isArray(obj.pattern)) out.pattern = obj.pattern;
    return out;
  }

  // Normalize, optionally register a Loom-composed pattern, play, and announce.
  function render(obj, opts) {
    var out = normalizeOutput(obj);
    var played = false;
    if (out.pattern && out.haptic) register(out.haptic, out.pattern);
    var gen = out.haptic && registry[out.haptic];
    if (gen && !(opts && opts.mute)) played = play(gen(out.intensity));
    try {
      root.dispatchEvent(new root.CustomEvent('loom:render', { detail: { output: out, played: !!played } }));
    } catch (e) {}
    return out;
  }

  var api = {
    render: render,
    normalizeOutput: normalizeOutput,
    register: register,
    vocabulary: vocabulary,
    capability: capability,
    cancel: cancel,
    _shelf: shelf
  };

  root.HighwayHaptics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
