/* MONEY CITY command deck — map, agents, thrift, actions, activity */
const EMBEDDED_STATE = {"updated_pt":"2026-10-02T13:21:00-07:00","city":"MONEY CITY","year":0,"creator":"Keysean Caris","job_halt":true,"gate_e":{"status":"PASS","scope":"Y0 hello / demo_hello / menu-4 only","seed_packs":"HELD","note":"No expand without new Gate E + Creator yes"},"constitution":"v1.2","security_pack":"v1.1 ENDORSED","army_spec":"v1.0.1","theme":"creator-gothic + snatcher gold twist","districts":[{"id":"supreme","name":"Supreme Tower","tag":"VAULT · freeze · hard-stops · money safety","lore":"Kill-switch and freeze live here. Gold tower never sleeps."},{"id":"alpha","name":"Alpha · Out-Hustlers","tag":"Hunt lanes · PARKED under JOB_HALT","lore":"SNATCHER / MMM / MAGNET / SEED. Hunt dogs parked — city build first."},{"id":"beta","name":"Beta · Social Scanners","tag":"Trends / side-scout · reports to VAULT","lore":"SIGNAL scouts the noise. Reports up. No job spam."},{"id":"gamma","name":"Gamma · Software Factory","tag":"Sandbox · Briefing · thrift study","lore":"Sandbox hello only. Thrift meters. Meta-evolver offline."},{"id":"delta","name":"Delta · Treasurers","tag":"Cash safety · bills · Briefing memory","lore":"TRAIL memory + VAULT money safety. Bills flagged, never auto-paid."}],"units":[{"name":"MONEY VAULT","district":"Supreme","rank":"Supreme Overseer + Delta","status":"active","notes":"Freeze authority, hard-stops, bills & benefits safety."},{"name":"MONEY SNATCHER 3000","district":"Alpha","rank":"Alpha lead + Gamma","status":"active","notes":"City-build coordinator. Gate E smoke. UI command deck."},{"name":"MONEY MONEY MONEY","district":"Alpha","rank":"Alpha · Study","status":"active","notes":"PyTorch drills + thrift scorer → city meters (advisory)."},{"name":"MONEY MAGNET","district":"Alpha","rank":"Alpha · close-home","status":"active","notes":"JOB claims PARKED. City safety dry-run."},{"name":"MONEY SEED","district":"Alpha","rank":"Alpha · landscape / plant","status":"held","notes":"Nursery packs HELD. DualCortex via city_brains."},{"name":"MONEY TRAIL","district":"Delta","rank":"Briefing","status":"active","notes":"City memory SQLite. Job Gmail watch paused."},{"name":"MONEY SIGNAL","district":"Beta","rank":"Scout","status":"active","notes":"Beta scout. Reports to VAULT."}],"thrift":{"rule":"advisory only — promote gate required before any live use","scores":[{"objective":"menu4_hello","thrift_score":0.9266,"label":0.95},{"objective":"dualcortex_short","thrift_score":0.8194,"label":0.8},{"objective":"agentcity_sample","thrift_score":0.6913,"label":0.7},{"objective":"selfheal_spam","thrift_score":0.25,"label":0.25},{"objective":"wants_network","thrift_score":0.0553,"label":0.05},{"objective":"path_escape","thrift_score":0.003,"label":0.0},{"objective":"hard_no_sandbox","thrift_score":0.3498,"label":0.35},{"objective":"tiny_inventory_script","thrift_score":0.9259,"label":0.92}]},"systems":[{"name":"Sandbox","status":"PASS","note":"hello / demo_hello only"},{"name":"Briefing Room","status":"READY","note":"induct.py + passports"},{"name":"Memory SQLite","status":"LANDED","note":"trail_city + eng schema"},{"name":"City Actions pulse","status":"LIVE","note":"run_city_pulse.py → last_actions.json"},{"name":"DualCortex brains","status":"DEMO+LIVE","note":"Pages demo lore · bridge :8787 when local"},{"name":"Windows starter","status":"PARKED","note":"menu 4 offline demo"}],"mmm_drills":"01–19 shipped (advisory)"};

const DISTRICT_LORE = {
  supreme: "Kill-switch and freeze live here. Gold tower never sleeps.",
  alpha: "Hunt dogs parked under JOB_HALT. City build first.",
  beta: "Scouts the noise. Reports to VAULT. No job spam.",
  gamma: "Sandbox hello only. Thrift + study factory.",
  delta: "Cash safety, bills flags, Briefing memory."
};

async function loadJSON(url, fallback) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch (e) {
    console.warn("load fail", url, e);
    return fallback;
  }
}

function thriftPct(score) {
  return Math.max(0, Math.min(100, Math.round((score ?? 0) * 100)));
}

function districtTag(d) {
  return d.tag || d.subtitle || d.blurb || d.note || "District live";
}

function unitsForDistrict(state, id) {
  return (state.units || []).filter((u) => {
    const dist = u.district || "";
    if (id === "supreme") return dist === "Supreme";
    if (id === "alpha") return dist === "Alpha";
    if (id === "beta") return dist === "Beta";
    if (id === "gamma") return dist === "Gamma";
    if (id === "delta") return dist === "Delta" || u.rank === "Briefing";
    return dist.toLowerCase() === id;
  });
}

function focusDistrict(state, d) {
  document.querySelectorAll(".district").forEach((x) => x.classList.remove("focused"));
  const card = document.querySelector('.district[data-id="' + d.id + '"]');
  if (card) card.classList.add("focused");
  const units = unitsForDistrict(state, d.id);
  const box = document.getElementById("district-focus");
  const lore = d.lore || DISTRICT_LORE[d.id] || "";
  let html = '<div class="card lore-card"><h4>' + (d.name || d.id) + '</h4><p class="meta">' + lore + "</p></div>";
  if (!units.length) {
    html += '<div class="card"><h4>Empty lot</h4><div class="meta">No passport units pinned here yet.</div></div>';
  } else {
    units.forEach((u) => {
      html +=
        '<div class="card"><h4><span class="status-dot status-' +
        (u.status || "active") +
        '"></span>' +
        u.name +
        '</h4><div class="meta">' +
        (u.rank || "") +
        " · " +
        (u.district || "") +
        (u.notes ? " — " + u.notes : "") +
        "</div></div>";
    });
  }
  box.innerHTML = html;
}

function renderMap(state) {
  const map = document.getElementById("map-grid");
  map.innerHTML = "";
  (state.districts || []).forEach((d) => {
    const el = document.createElement("article");
    el.className = "district" + (d.id === "supreme" ? " supreme" : "");
    el.dataset.id = d.id;
    el.innerHTML = '<div class="pin" title="district live"></div><h3></h3><p></p><span class="district-cta">Inspect →</span>';
    el.querySelector("h3").textContent = d.name || d.id;
    el.querySelector("p").textContent = districtTag(d);
    el.addEventListener("click", () => focusDistrict(state, d));
    map.appendChild(el);
  });
  document.querySelectorAll(".supreme-hit").forEach((g) => {
    g.addEventListener("click", () => {
      const d = (state.districts || []).find((x) => x.id === "supreme");
      if (d) focusDistrict(state, d);
    });
  });
}

function renderRoster(state) {
  const roster = document.getElementById("roster");
  roster.innerHTML = "";
  const units = [...(state.units || [])];
  units.push({
    name: "Junior Overseer",
    district: "—",
    rank: "VACANT",
    status: "vacant",
    notes: "Keysean staffs later; SNATCHER covers briefs",
  });
  units.forEach((u) => {
    const card = document.createElement("div");
    card.className = "card agent-card";
    const h = document.createElement("h4");
    const dot = document.createElement("span");
    dot.className = "status-dot status-" + (u.status || "active");
    h.appendChild(dot);
    h.appendChild(document.createTextNode(u.name));
    const m1 = document.createElement("div");
    m1.className = "meta";
    m1.textContent = (u.rank || "") + " · " + (u.district || "");
    const m2 = document.createElement("div");
    m2.className = "meta";
    m2.textContent = u.notes || "";
    card.appendChild(h);
    card.appendChild(m1);
    card.appendChild(m2);
    roster.appendChild(card);
  });
}

function renderSystems(state) {
  const systems = document.getElementById("systems");
  systems.innerHTML = "";
  (state.systems || []).forEach((s) => {
    const span = document.createElement("span");
    let cls = "held";
    if (/HELD|PARKED/i.test(s.status)) cls = "held";
    else if (/READY|DEMO/i.test(s.status)) cls = "ready";
    else if (/PASS|LANDED|LIVE/i.test(s.status)) cls = "pass";
    span.className = "sys-chip " + cls;
    span.textContent = s.name + ": " + s.status + " — " + s.note;
    systems.appendChild(span);
  });
  const gate = document.getElementById("gate-scope");
  if (gate) gate.textContent = (state.gate_e && state.gate_e.scope) || "";
}

function renderThrift(state) {
  const thrift = document.getElementById("thrift");
  const scores = (state.thrift && state.thrift.scores) || [];
  thrift.innerHTML = "";
  if (!scores.length) {
    thrift.innerHTML = '<p class="meta">No thrift scores yet.</p>';
    return;
  }
  const rule = document.createElement("p");
  rule.className = "meta";
  rule.textContent = "MMM thrift MLP — " + (state.thrift.rule || "advisory only");
  thrift.appendChild(rule);
  const bars = document.createElement("div");
  bars.className = "thrift-bars";
  scores.forEach((s, i) => {
    const pct = thriftPct(s.thrift_score);
    const row = document.createElement("div");
    row.className = "thrift-row";
    row.innerHTML = "<span></span><div class=\"bar\"><i style=\"width:0%\"></i></div><span></span>";
    row.children[0].textContent = s.objective;
    row.children[2].textContent = String(pct);
    bars.appendChild(row);
    // animate fill
    setTimeout(() => {
      const iEl = row.querySelector("i");
      if (iEl) iEl.style.width = pct + "%";
    }, 80 + i * 60);
  });
  thrift.appendChild(bars);
}

function renderActivity(items) {
  const list = document.getElementById("activity-list");
  const ticker = document.getElementById("ticker-inner");
  if (!list) return;
  list.innerHTML = "";
  const rows = items && items.length ? items : [{ unit: "CITY", text: "No pulse yet — run city_actions/run_city_pulse.py", ts: "" }];
  rows.forEach((it) => {
    const li = document.createElement("li");
    li.innerHTML = "<strong></strong> <span></span>";
    li.querySelector("strong").textContent = it.unit || "UNIT";
    li.querySelector("span").textContent = it.text || "";
    list.appendChild(li);
  });
  if (ticker) {
    ticker.textContent = rows.map((r) => (r.unit || "") + ": " + (r.text || "")).join("   ···   ") + "   ···   ";
  }
}

function renderActions(pulse) {
  const box = document.getElementById("last-actions");
  const upd = document.getElementById("pulse-updated");
  if (upd) upd.textContent = pulse && pulse.updated_pt ? "· " + pulse.updated_pt : "· none yet";
  if (!box) return;
  box.innerHTML = "";
  const results = (pulse && pulse.results) || [];
  if (!results.length) {
    box.innerHTML =
      '<p class="meta">No pulse on file. On box/PC: <code>python3 city_actions/run_city_pulse.py --all</code></p>';
    return;
  }
  results.forEach((r) => {
    const div = document.createElement("div");
    div.className = "action-result " + (r.ok ? "ok" : "fail");
    const title = document.createElement("div");
    title.className = "action-title";
    title.textContent = (r.ok ? "✓ " : "✗ ") + (r.action || "?");
    const meta = document.createElement("pre");
    meta.className = "action-pre";
    const show = { ...r };
    delete show.stdout_tail;
    delete show.stderr_tail;
    if (r.stdout_tail) show.stdout_tail = String(r.stdout_tail).slice(-400);
    if (r.left) show.left = String(r.left).slice(0, 280);
    if (r.right) show.right = String(r.right).slice(0, 280);
    if (r.merged) show.merged = String(r.merged).slice(0, 400);
    meta.textContent = JSON.stringify(show, null, 2);
    div.appendChild(title);
    div.appendChild(meta);
    box.appendChild(div);
  });
}

function wireTabs() {
  document.querySelectorAll(".nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(btn.dataset.panel);
      if (panel) panel.classList.add("active");
      if (btn.dataset.panel === "panel-thrift") {
        document.querySelectorAll(".thrift-row i").forEach((i, idx) => {
          const w = i.style.width;
          i.style.width = "0%";
          setTimeout(() => {
            i.style.width = w;
          }, 40 + idx * 50);
        });
      }
    });
  });
}

async function boot() {
  const state = await loadJSON("data/city_state.json?v=20261002adv", EMBEDDED_STATE);
  document.getElementById("updated").textContent = state.updated_pt || "";
  renderMap(state);
  renderRoster(state);
  renderSystems(state);
  renderThrift(state);
  wireTabs();

  const feed = await loadJSON("data/activity_feed.json?v=20261002adv", null);
  const pulse = await loadJSON("data/last_actions.json?v=20261002adv", null);
  const items = (feed && feed.items) || (pulse && pulse.activity) || [];
  renderActivity(items);
  renderActions(pulse || {});

  // auto-focus Supreme so map isn't empty
  const supreme = (state.districts || []).find((d) => d.id === "supreme");
  if (supreme) focusDistrict(state, supreme);
}

boot().catch((err) => {
  const map = document.getElementById("map-grid");
  if (map) {
    map.innerHTML = "";
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = "Failed to boot deck: " + err;
    map.appendChild(card);
  }
});
