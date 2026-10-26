// ear-app.js: Face -> Ear wire (hold-to-talk). Glue between the PWA and ear.js.
//
// Sin holds "Talk" -> his voice streams as raw PCM to the Ear (hear_node on
// Money Snatcher's box) -> the Ear answers with JSON {language, words, sound,
// affect_vector} -> this module forwards that JSON to the bridge as a
// hearing-result, and the Loom's felt state quotes his words verbatim.
//
// NO TTS anywhere in this path: sound goes out, text comes back, nothing speaks.
// The Ear link (a wss URL carrying the hear token) is pasted once by sin and
// stored ONLY in this phone's localStorage. It never ships in the repo.
import { startListening } from './ear.js';

var BRIDGE = 'https://phantomway-door.tail0a8095.ts.net';
var LINK_KEY = 'hw_ear_link';

var strip = null, statusEl = null, rec = null, starting = false, wantStop = false;

function say(msg) { if (statusEl) statusEl.textContent = msg; }

function getLink() { try { return localStorage.getItem(LINK_KEY) || ''; } catch (e) { return ''; } }

function askLink() {
  var cur = getLink();
  var v = window.prompt('Paste the Ear link (the full wss:// address, token included). It is stored only on this phone.', cur);
  if (v === null) return;
  v = v.trim();
  try {
    if (v) localStorage.setItem(LINK_KEY, v); else localStorage.removeItem(LINK_KEY);
  } catch (e) {}
  say(v ? 'Ear link saved on this phone.' : 'Ear link cleared.');
}

function parseLink(raw) {
  try {
    var u = new URL(raw.trim());
    return { host: u.origin, token: u.searchParams.get('t') || '' };
  } catch (e) { return null; }
}

function forward(reply) {
  var payload = {};
  if (reply.language) payload.language = reply.language;
  if (reply.words) payload.words = reply.words;
  if (reply.sound) payload.sound = reply.sound;
  if (Array.isArray(reply.affect_vector)) payload.affect_vector = reply.affect_vector;
  if (!Object.keys(payload).length) { say('The Ear heard nothing it could name.'); return; }
  say('Heard you: \u201C' + String(reply.words || '').slice(0, 80) + '\u201D \u2014 passing it to the Loom\u2026');
  postHearing(payload, 0);
}

function postHearing(payload, attempt) {
  var jwt = null;
  try { jwt = localStorage.getItem('hw_jwt'); } catch (e) {}
  if (!jwt) { say('Heard you, but you are signed out here \u2014 the words cannot reach the Loom.'); return; }
  fetch(BRIDGE + '/api/sense/hearing-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(payload)
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    say('Your words are with the Loom now.');
  }).catch(function () {
    if (attempt < 4) setTimeout(function () { postHearing(payload, attempt + 1); }, 15000);
    else say('The bridge did not take your words \u2014 they are gone unless you say them again.');
  });
}

async function begin() {
  if (rec || starting) return;
  var link = getLink();
  if (!link) { askLink(); return; }
  var p = parseLink(link);
  if (!p || !p.host) { say('That Ear link does not parse \u2014 tap Ear link and paste it again.'); return; }
  // One mic at a time: hand the mic over from Listen if it is running.
  try { if (window.HighwaySense && window.HighwaySense.status().mic.state === 'live') window.HighwaySense.disableMic(); } catch (e) {}
  starting = true;
  say('Opening the Ear\u2026');
  try {
    rec = await startListening(p.host, p.token);
    say('Listening \u2014 release to send.');
  } catch (e) {
    rec = null;
    say('Could not open the Ear: ' + ((e && e.message) || e));
  }
  starting = false;
  if (wantStop) { wantStop = false; end(); }
}

async function end() {
  if (starting) { wantStop = true; return; }
  if (!rec) return;
  var r = rec; rec = null;
  say('Sending to the Ear\u2026');
  try {
    var reply = await r.stop();
    if (reply && reply.error) { say('The Ear said: ' + reply.error); return; }
    if (reply) forward(reply);
  } catch (e) {
    say('The Ear link dropped: ' + ((e && e.message) || e));
  }
}

function mount(tries) {
  strip = document.querySelector('#sense');
  if (!strip) { if (tries < 10) setTimeout(function () { mount(tries + 1); }, 200); return; }

  var talk = document.createElement('button');
  talk.className = 'hs-btn';
  talk.id = 'ear-talk';
  talk.textContent = 'Talk (hold)';
  talk.style.touchAction = 'none';
  talk.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    try { talk.setPointerCapture(e.pointerId); } catch (err) {}
    begin();
  });
  talk.addEventListener('pointerup', function (e) { e.preventDefault(); end(); });
  talk.addEventListener('pointercancel', function () { end(); });
  talk.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  var linkBtn = document.createElement('button');
  linkBtn.className = 'hs-btn';
  linkBtn.id = 'ear-link';
  linkBtn.textContent = 'Ear link';
  linkBtn.addEventListener('click', function () { askLink(); });

  statusEl = document.createElement('div');
  statusEl.id = 'ear-status';
  statusEl.style.cssText = 'flex-basis:100%;font-size:11px;opacity:.75;min-height:14px;';
  statusEl.textContent = getLink() ? 'Ear link on this phone. Hold Talk and speak.' : 'No Ear link yet \u2014 tap Ear link and paste it.';

  strip.appendChild(talk);
  strip.appendChild(linkBtn);
  strip.appendChild(statusEl);
}

mount(0);
