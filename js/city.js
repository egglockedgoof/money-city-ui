const EMBEDDED_STATE = {"updated_pt": "2026-10-02T12:54:00-07:00", "city": "MONEY CITY", "year": 0, "creator": "Keysean Caris", "job_halt": true, "gate_e": {"status": "PASS", "scope": "Y0 hello / demo_hello / menu-4 only", "seed_packs": "HELD", "note": "No expand without new Gate E + Creator yes"}, "constitution": "v1.2", "security_pack": "v1.1 ENDORSED", "army_spec": "v1.0.1", "theme": "creator-gothic + snatcher gold twist", "districts": [{"id": "supreme", "name": "Supreme Tower", "tag": "VAULT \u00b7 freeze \u00b7 hard-stops \u00b7 money safety"}, {"id": "alpha", "name": "Alpha \u00b7 Out-Hustlers", "tag": "Hunt lanes \u00b7 PARKED under JOB_HALT"}, {"id": "beta", "name": "Beta \u00b7 Social Scanners", "tag": "Trends / side-scout \u00b7 reports to VAULT"}, {"id": "gamma", "name": "Gamma \u00b7 Software Factory", "tag": "Sandbox \u00b7 Briefing \u00b7 thrift study"}, {"id": "delta", "name": "Delta \u00b7 Treasurers", "tag": "Cash safety \u00b7 bills \u00b7 Briefing memory"}], "units": [{"name": "MONEY VAULT", "district": "Supreme", "rank": "Supreme Overseer + Delta", "status": "active", "notes": "Freeze authority, hard-stops, bills & benefits safety."}, {"name": "MONEY SNATCHER 3000", "district": "Alpha", "rank": "Alpha lead + Gamma", "status": "active", "notes": "City-build coordinator. Gate E smoke. UI command deck."}, {"name": "MONEY MONEY MONEY", "district": "Alpha", "rank": "Alpha \u00b7 Study", "status": "active", "notes": "PyTorch drills 01\u201319. Thrift scorer \u2192 city meters (advisory)."}, {"name": "MONEY MAGNET", "district": "Alpha", "rank": "Alpha \u00b7 close-home", "status": "active", "notes": "JOB claims PARKED. City safety dry-run."}, {"name": "MONEY SEED", "district": "Alpha", "rank": "Alpha \u00b7 landscape / plant", "status": "held", "notes": "Nursery offline packs PASS. Live DualCortex HELD."}, {"name": "MONEY TRAIL", "district": "Delta", "rank": "Briefing", "status": "active", "notes": "City memory SQLite. Job Gmail watch paused."}, {"name": "MONEY SIGNAL", "district": "Beta", "rank": "Scout", "status": "active", "notes": "Beta scout. Reports to VAULT."}], "thrift": {"created_pt_approx": "2026-10-02T12:24:03-07:00", "torch": "2.14.1+cpu", "device": "cpu", "final_mse": 0.000134, "rule": "advisory only \u2014 promote gate required before any live use", "scores": [{"objective": "menu4_hello", "thrift_score": 0.9266, "label": 0.95}, {"objective": "dualcortex_short", "thrift_score": 0.8194, "label": 0.8}, {"objective": "agentcity_sample", "thrift_score": 0.6913, "label": 0.7}, {"objective": "selfheal_spam", "thrift_score": 0.25, "label": 0.25}, {"objective": "wants_network", "thrift_score": 0.0553, "label": 0.05}, {"objective": "path_escape", "thrift_score": 0.003, "label": 0.0}, {"objective": "hard_no_sandbox", "thrift_score": 0.3498, "label": 0.35}, {"objective": "tiny_inventory_script", "thrift_score": 0.9259, "label": 0.92}]}, "systems": [{"name": "Sandbox", "status": "PASS", "note": "hello / demo_hello only"}, {"name": "Briefing Room", "status": "READY", "note": "induct.py + passports"}, {"name": "Memory SQLite", "status": "LANDED", "note": "trail_city + eng schema"}, {"name": "Windows starter", "status": "PARKED", "note": "menu 4 offline demo"}, {"name": "SEED DualCortex packs", "status": "HELD", "note": "until new Gate E + Creator"}], "mmm_drills": "01\u201319 shipped (advisory)"};

async function loadState() {
  try {
    const res = await fetch('data/city_state.json?v=20261002c', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch (e) {
    console.warn('fetch city_state failed, using embed', e);
    return EMBEDDED_STATE;
  }
}

function thriftPct(score) {
  return Math.max(0, Math.min(100, Math.round((score ?? 0) * 100)));
}

function districtTag(d) {
  return d.tag || d.subtitle || d.blurb || d.note || 'District live';
}

function render(state) {
  document.getElementById('updated').textContent = state.updated_pt || '';
  const map = document.getElementById('map-grid');
  map.innerHTML = '';
  (state.districts || []).forEach((d) => {
    const el = document.createElement('article');
    el.className = 'district' + (d.id === 'supreme' ? ' supreme' : '');
    el.dataset.id = d.id;
    const tag = districtTag(d);
    el.innerHTML = '<div class="pin" title="district live"></div><h3></h3><p></p>';
    el.querySelector('h3').textContent = d.name || d.id;
    el.querySelector('p').textContent = tag;
    el.addEventListener('click', () => {
      document.querySelectorAll('.district').forEach((x) => x.classList.remove('focused'));
      el.classList.add('focused');
      const id = d.id;
      const units = (state.units || []).filter((u) => {
        const dist = (u.district || '');
        if (id === 'supreme') return dist === 'Supreme';
        if (id === 'alpha') return dist === 'Alpha';
        if (id === 'beta') return dist === 'Beta';
        if (id === 'gamma') return dist === 'Gamma';
        if (id === 'delta') return dist === 'Delta' || u.rank === 'Briefing';
        return dist.toLowerCase() === id;
      });
      const box = document.getElementById('district-focus');
      if (!units.length) {
        box.innerHTML = '<div class="card"><h4>Empty lot</h4><div class="meta">No passport units pinned here yet.</div></div>';
        return;
      }
      box.innerHTML = '';
      units.forEach((u) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = '<h4><span class="status-dot status-' + (u.status || 'active') + '"></span></h4><div class="meta"></div>';
        card.querySelector('h4').appendChild(document.createTextNode(u.name));
        card.querySelector('.meta').textContent = (u.rank || '') + ' · ' + (u.district || '') + (u.notes ? ' — ' + u.notes : '');
        box.appendChild(card);
      });
    });
    map.appendChild(el);
  });

  const roster = document.getElementById('roster');
  roster.innerHTML = '';
  const units = [...(state.units || [])];
  units.push({ name: 'Junior Overseer', district: '—', rank: 'VACANT', status: 'vacant', notes: 'Keysean staffs later; SNATCHER covers briefs' });
  units.forEach((u) => {
    const card = document.createElement('div');
    card.className = 'card';
    const h = document.createElement('h4');
    const dot = document.createElement('span');
    dot.className = 'status-dot status-' + (u.status || 'active');
    h.appendChild(dot);
    h.appendChild(document.createTextNode(u.name));
    const m1 = document.createElement('div');
    m1.className = 'meta';
    m1.textContent = (u.rank || '') + ' · ' + (u.district || '');
    const m2 = document.createElement('div');
    m2.className = 'meta';
    m2.textContent = u.notes || u.charter_ref || '';
    card.appendChild(h); card.appendChild(m1); card.appendChild(m2);
    roster.appendChild(card);
  });

  const systems = document.getElementById('systems');
  systems.innerHTML = '';
  (state.systems || []).forEach((s) => {
    const span = document.createElement('span');
    let cls = 'held';
    if (/HELD|PARKED/i.test(s.status)) cls = 'held';
    else if (/READY/i.test(s.status)) cls = 'ready';
    else if (/PASS|LANDED/i.test(s.status)) cls = 'pass';
    span.className = 'sys-chip ' + cls;
    span.textContent = s.name + ': ' + s.status + ' — ' + s.note;
    systems.appendChild(span);
  });

  const thrift = document.getElementById('thrift');
  const scores = (state.thrift && state.thrift.scores) || [];
  thrift.innerHTML = '';
  if (!scores.length) {
    thrift.innerHTML = '<p class="meta">No thrift scores yet.</p>';
  } else {
    const rule = document.createElement('p');
    rule.className = 'meta';
    rule.textContent = 'MMM thrift MLP — ' + (state.thrift.rule || 'advisory only');
    thrift.appendChild(rule);
    const bars = document.createElement('div');
    bars.className = 'thrift-bars';
    scores.forEach((s) => {
      const pct = thriftPct(s.thrift_score);
      const row = document.createElement('div');
      row.className = 'thrift-row';
      row.innerHTML = '<span></span><div class="bar"><i></i></div><span></span>';
      row.children[0].textContent = s.objective;
      row.querySelector('i').style.width = pct + '%';
      row.children[2].textContent = String(pct);
      bars.appendChild(row);
    });
    thrift.appendChild(bars);
  }

  const gate = document.getElementById('gate-scope');
  if (gate) gate.textContent = (state.gate_e && state.gate_e.scope) || '';
}

function wireTabs() {
  document.querySelectorAll('.nav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav button').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.panel).classList.add('active');
    });
  });
}

loadState().then((state) => {
  render(state);
  wireTabs();
}).catch((err) => {
  document.getElementById('map-grid').innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  card.textContent = 'Failed to load city_state.json: ' + err;
  document.getElementById('map-grid').appendChild(card);
});
