/* Ops floor. Valid script. Full screen. Blood and gold. */
(function () {
  var KEY = 'money_city_inbox_v1';
  var ROOMS = [
    { id: 'research', name: 'Research', agent: 'SIGNAL', job: 'Writes the brief' },
    { id: 'factory', name: 'Factory', agent: 'SEED', job: 'Cuts the draft' },
    { id: 'comms', name: 'Comms', agent: 'TRAIL', job: 'Holds the reply' },
    { id: 'treasury', name: 'Treasury', agent: 'VAULT', job: 'Keeps the ledger' },
    { id: 'publishing', name: 'Publishing', agent: 'MAGNET', job: 'Holds the slot' },
    { id: 'war', name: 'War', agent: 'SNATCHER', job: 'Cuts the dead lane' },
    { id: 'archives', name: 'Archives', agent: 'MMM', job: 'Files the night' },
    { id: 'quarters', name: 'Quarters', agent: 'CREW', job: 'Who is home' }
  ];
  var open = 'factory';
  var tick = 0;
  var running = true;
  function load() { try { var p = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(p) ? p : []; } catch (e) { return []; } }
  function save(items) { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 160))); }
  function post(room, agent, kind, text) {
    var bus = window.MONEY_CITY_BUS;
    var job = { id: room + '-' + Date.now(), room: room, agent: agent, kind: kind, text: text };
    if (bus && bus.post) return bus.post(job);
    var row = { id: job.id, ts: new Date().toISOString(), room: room, agent: agent, kind: kind, text: text, status: (room === 'comms' || room === 'publishing') ? 'waiting on you' : 'on the desk', needs_human: room === 'comms' || room === 'publishing' };
    save([row].concat(load()));
    return { ok: true, job: row };
  }
  function mine(room) { return load().filter(function (job) { return job.room === room; }); }
  function style() {
    if (document.getElementById('ops-style')) return;
    var s = document.createElement('style');
    s.id = 'ops-style';
    s.textContent = '#ops{position:fixed;inset:0;z-index:80;background:#070304;color:#efe2c6;display:flex;flex-direction:column;font:14px/1.35 system-ui,sans-serif;overflow:hidden}#ops header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #6b0f16;color:#e8c96a}#ops .crew{display:flex;gap:6px;overflow:auto;padding:8px;border-bottom:1px solid #331515}#ops button{background:#140b0b;color:#efe2c6;border:1px solid #6b0f16;padding:8px;font:inherit}#ops .on{border-color:#d4a017;color:#e8c96a}#ops .body{flex:1;overflow:auto;padding:10px}#ops .row{border-top:1px solid #331515;padding:8px 0}#ops input{width:100%;box-sizing:border-box;background:#1a0f0f;color:#efe2c6;border:1px solid #6b0f16;padding:10px;margin:8px 0;font:inherit}#ops .go{background:#6b0f16;color:#e8c96a;border-color:#d4a017}#ops .live{color:#e8c96a}';
    document.head.appendChild(s);
  }
  function paint() {
    style();
    var root = document.getElementById('ops');
    if (!root) { root = document.createElement('div'); root.id = 'ops'; document.body.appendChild(root); }
    var room = ROOMS.filter(function (r) { return r.id === open; })[0];
    var items = mine(open).slice(0, 8);
    var html = '<header><strong>MONEY CITY FLOOR</strong><span class="live">' + (running ? 'SHIFT LIVE' : 'HOLD') + '</span></header>';
    html += '<div class="crew">';
    ROOMS.forEach(function (r) { html += '<button data-room="' + r.id + '" class="' + (r.id === open ? 'on' : '') + '">' + r.agent + ' ' + mine(r.id).length + '</button>'; });
    html += '</div><div class="body"><h2>' + room.name + ' · ' + room.agent + '</h2><p>' + room.job + '</p>';
    html += '<form id="ops-form"><input id="ops-in" placeholder="Leave work for ' + room.agent + '"><button class="go" type="submit">Leave it in the room</button></form>';
    html += '<p id="ops-pass"></p>';
    items.forEach(function (job) { html += '<div class="row">' + (job.status || 'on the desk') + ' — ' + job.text + '</div>'; });
    if (!items.length) html += '<div class="row">Desk is clear. The shift will pass work here.</div>';
    html += '<button id="ops-run" class="go">' + (running ? 'Hold the shift' : 'Run the shift') + '</button></div>';
    root.innerHTML = html;
    root.querySelectorAll('[data-room]').forEach(function (btn) { btn.addEventListener('click', function () { open = btn.getAttribute('data-room'); paint(); }); });
    root.querySelector('#ops-form').addEventListener('submit', function (e) { e.preventDefault(); var v = root.querySelector('#ops-in').value.trim(); if (!v) return; post(open, room.agent, 'note', v); paint(); });
    root.querySelector('#ops-run').addEventListener('click', function () { running = !running; paint(); });
  }
  function shift() {
    if (!running) return;
    var chain = [
      ['research', 'SIGNAL', 'brief', 'Public category. Original only. No copied listing.'],
      ['factory', 'SEED', 'draft', 'Took the brief. Cut an original draft.'],
      ['comms', 'TRAIL', 'draft', 'Reply is on the desk. Not sent.'],
      ['publishing', 'MAGNET', 'schedule', 'Slot held. Not posted.'],
      ['war', 'SNATCHER', 'pivot', 'Dead lane named. Next lane is the one that moved.'],
      ['archives', 'MMM', 'memory', 'Pass filed.']
    ];
    var step = chain[tick % chain.length];
    tick += 1;
    open = step[0];
    post(step[0], step[1], step[2], step[3] + ' Pass ' + tick + '.');
    paint();
    var pass = document.getElementById('ops-pass');
    if (pass) pass.textContent = step[1] + ' just handed work to the next room.';
  }
  function boot() { paint(); setInterval(shift, 4000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
