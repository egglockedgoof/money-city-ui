/* MONEY CITY command deck — map, crew implant, creator brief, thrift, actions */
const EMBEDDED_STATE = {"updated_pt":"2026-10-02T13:33:25-07:00","city":"MONEY CITY","year":0,"creator":"Creator (identity private \u2014 see briefing_room)","job_halt":true,"gate_e":{"status":"PASS","scope":"Y0 hello / demo_hello / menu-4 only","seed_packs":"HELD","note":"No expand without new Gate E + Creator yes"},"constitution":"v1.2","security_pack":"v1.1 ENDORSED","army_spec":"v1.0.1","theme":"creator-gothic + snatcher gold twist","districts":[{"id":"supreme","name":"Supreme Tower","tag":"VAULT \u00b7 freeze \u00b7 hard-stops \u00b7 money safety \u00b7 VAULT","lore":"Kill-switch and freeze live here. Gold tower never sleeps.","agents":["VAULT"]},{"id":"alpha","name":"Alpha \u00b7 Out-Hustlers","tag":"Hunt lanes \u00b7 PARKED under JOB_HALT \u00b7 SNATCHER / MMM / MAGNET / SEED","lore":"Hunt dogs parked under JOB_HALT. City build first.","agents":["SNATCHER","MMM","MAGNET","SEED"]},{"id":"beta","name":"Beta \u00b7 Social Scanners","tag":"Trends / side-scout \u00b7 reports to VAULT \u00b7 SIGNAL","lore":"Scouts the noise. Reports to VAULT. No job spam.","agents":["SIGNAL"]},{"id":"gamma","name":"Gamma \u00b7 Software Factory","tag":"Sandbox \u00b7 Briefing \u00b7 thrift study \u00b7 SNATCHER / MMM / SEED","lore":"Sandbox hello only. Thrift + study factory.","agents":["SNATCHER","MMM","SEED"]},{"id":"delta","name":"Delta \u00b7 Treasurers","tag":"Cash safety \u00b7 bills \u00b7 Briefing memory \u00b7 TRAIL / VAULT","lore":"Cash safety, bills flags, Briefing memory.","agents":["TRAIL","VAULT"]}],"units":[{"id":"snatcher-3000","name":"MONEY SNATCHER 3000","short":"SNATCHER","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha lead + Gamma coordinator","status":"active","role":"Alpha / city-build lead \u00b7 plant+grounds+apply when unhalted","notes":"Gold command deck. Tears down the old grind. Coordinates the living city. Gate E smoke + UI twist.","flavor":"Gold command deck. Tears down the old grind. Coordinates the living city. Gate E smoke + UI twist.","pin":{"x":18,"y":62},"color":"#f0d78c"},{"id":"mmm","name":"MONEY MONEY MONEY","short":"MMM","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha \u00b7 Study / meta-evolver hub","status":"active","role":"Job machine #2 \u00b7 meta evolver hub","notes":"PyTorch thrift + hard-champ grind. Offline evolver only under JOB_HALT. Fair MSE kings.","flavor":"PyTorch thrift + hard-champ grind. Offline evolver only under JOB_HALT. Fair MSE kings.","pin":{"x":28,"y":55},"color":"#d4a017"},{"id":"magnet","name":"MONEY MAGNET","short":"MAGNET","district":"Alpha","districts":["Alpha"],"rank":"Alpha \u00b7 close-home","status":"active","role":"#3 apply \u00b7 close-home plant/grounds","notes":"Pulls work near West Sac / Yolobus radius. Apply lane PARKED. City safety dry-runs live.","flavor":"Pulls work near West Sac / Yolobus radius. Apply lane PARKED. City safety dry-runs live.","pin":{"x":12,"y":72},"color":"#c9a227"},{"id":"seed","name":"MONEY SEED","short":"SEED","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha \u00b7 landscape / plant","status":"held","role":"#4 apply \u00b7 landscape / plant / nursery","notes":"Nursery packs HELD. DualCortex box brains. Grows the grounds lane when Creator unhalts.","flavor":"Nursery packs HELD. DualCortex box brains. Grows the grounds lane when Creator unhalts.","pin":{"x":35,"y":68},"color":"#3ecf8e"},{"id":"trail","name":"MONEY TRAIL","short":"TRAIL","district":"Delta","districts":["Delta"],"rank":"Briefing / tracker","status":"active","role":"Tracker \u00b7 interviews / replies / city memory","notes":"Never loses a thread. SQLite memory. Job Gmail watch paused under halt \u2014 city inventory stays sharp.","flavor":"Never loses a thread. SQLite memory. Job Gmail watch paused under halt \u2014 city inventory stays sharp.","pin":{"x":78,"y":58},"color":"#e8c547"},{"id":"vault","name":"MONEY VAULT","short":"VAULT","district":"Supreme","districts":["Supreme","Delta"],"rank":"Supreme Overseer + Delta Treasurer","status":"active","role":"Supreme overseer \u00b7 bills / safety / savings","notes":"Freeze authority. Hard-stops. Bills flagged never auto-paid. Gold tower never sleeps.","flavor":"Freeze authority. Hard-stops. Bills flagged never auto-paid. Gold tower never sleeps.","pin":{"x":50,"y":28},"color":"#f0d78c"},{"id":"signal","name":"MONEY SIGNAL","short":"SIGNAL","district":"Beta","districts":["Beta"],"rank":"Scout","status":"active","role":"Trends / side hustles \u00b7 Beta scout","notes":"Scans the noise for side paths. Reports to VAULT. No job spam while halt holds.","flavor":"Scans the noise for side paths. Reports to VAULT. No job spam while halt holds.","pin":{"x":62,"y":52},"color":"#ff6b6b"}],"thrift":{"created_pt_approx":"2026-10-02T12:24:03-07:00","torch":"2.14.1+cpu","device":"cpu","final_mse":0.000134,"rule":"advisory only \u2014 promote gate required before any live use","scores":[{"objective":"menu4_hello","thrift_score":0.9266,"label":0.95},{"objective":"dualcortex_short","thrift_score":0.8194,"label":0.8},{"objective":"agentcity_sample","thrift_score":0.6913,"label":0.7},{"objective":"selfheal_spam","thrift_score":0.25,"label":0.25},{"objective":"wants_network","thrift_score":0.0553,"label":0.05},{"objective":"path_escape","thrift_score":0.003,"label":0.0},{"objective":"hard_no_sandbox","thrift_score":0.3498,"label":0.35},{"objective":"tiny_inventory_script","thrift_score":0.9259,"label":0.92}]},"systems":[{"name":"Sandbox","status":"PASS","note":"hello / demo_hello only"},{"name":"Briefing Room","status":"READY","note":"PII-stripped public slate \u00b7 full dossier box-only"},{"name":"Crew Implant","status":"LANDED","note":"7 GOD DOLLAR BOYZ permanent district agents"},{"name":"Memory SQLite","status":"LANDED","note":"trail_city + eng schema"},{"name":"City Actions pulse","status":"LIVE","note":"run_city_pulse.py \u2192 last_actions.json"},{"name":"DualCortex brains","status":"DEMO+LIVE","note":"Pages demo lore \u00b7 bridge :8787 when local"},{"name":"Windows starter","status":"PARKED","note":"menu 4 offline \u00b7 see PC_TODAY.md"}],"mmm_drills":"01\u201319 shipped (advisory)","brains":{"left":"deepseek-r1:1.5b","right":"qwen2.5:1.5b","merge":"qwen2.5:1.5b","bridge":"127.0.0.1:8787","windows_full":"deepseek-r1:latest + qwen2.5:latest via windows_starter","creative_mode":true,"rule":"JOB_HALT ON \u00b7 Gate E hello only \u00b7 hard stops stay"},"crew_manifest":{"updated_pt":"2026-10-02T13:28:00-07:00","crew":"GOD DOLLAR BOYZ","city":"MONEY CITY","implant":"permanent district agents","rule":"JOB_HALT ON \u00b7 Gate E hello only \u00b7 hard-stops stay \u00b7 Creator forever","agents":[{"id":"snatcher-3000","name":"MONEY SNATCHER 3000","short":"SNATCHER","role":"Alpha / city-build lead \u00b7 plant+grounds+apply when unhalted","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha lead + Gamma coordinator","status":"active","flavor":"Gold command deck. Tears down the old grind. Coordinates the living city. Gate E smoke + UI twist.","pin":{"x":18,"y":62},"color":"#f0d78c"},{"id":"mmm","name":"MONEY MONEY MONEY","short":"MMM","role":"Job machine #2 \u00b7 meta evolver hub","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha \u00b7 Study / meta-evolver hub","status":"active","flavor":"PyTorch thrift + hard-champ grind. Offline evolver only under JOB_HALT. Fair MSE kings.","pin":{"x":28,"y":55},"color":"#d4a017"},{"id":"magnet","name":"MONEY MAGNET","short":"MAGNET","role":"#3 apply \u00b7 close-home plant/grounds","district":"Alpha","districts":["Alpha"],"rank":"Alpha \u00b7 close-home","status":"active","flavor":"Pulls work near West Sac / Yolobus radius. Apply lane PARKED. City safety dry-runs live.","pin":{"x":12,"y":72},"color":"#c9a227"},{"id":"seed","name":"MONEY SEED","short":"SEED","role":"#4 apply \u00b7 landscape / plant / nursery","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha \u00b7 landscape / plant","status":"held","flavor":"Nursery packs HELD. DualCortex box brains. Grows the grounds lane when Creator unhalts.","pin":{"x":35,"y":68},"color":"#3ecf8e"},{"id":"trail","name":"MONEY TRAIL","short":"TRAIL","role":"Tracker \u00b7 interviews / replies / city memory","district":"Delta","districts":["Delta"],"rank":"Briefing / tracker","status":"active","flavor":"Never loses a thread. SQLite memory. Job Gmail watch paused under halt \u2014 city inventory stays sharp.","pin":{"x":78,"y":58},"color":"#e8c547"},{"id":"vault","name":"MONEY VAULT","short":"VAULT","role":"Supreme overseer \u00b7 bills / safety / savings","district":"Supreme","districts":["Supreme","Delta"],"rank":"Supreme Overseer + Delta Treasurer","status":"active","flavor":"Freeze authority. Hard-stops. Bills flagged never auto-paid. Gold tower never sleeps.","pin":{"x":50,"y":28},"color":"#f0d78c"},{"id":"signal","name":"MONEY SIGNAL","short":"SIGNAL","role":"Trends / side hustles \u00b7 Beta scout","district":"Beta","districts":["Beta"],"rank":"Scout","status":"active","flavor":"Scans the noise for side paths. Reports to VAULT. No job spam while halt holds.","pin":{"x":62,"y":52},"color":"#ff6b6b"}],"vacant":{"name":"Junior Overseer","rank":"VACANT","notes":"Keysean staffs later; SNATCHER covers city-build briefs"}},"creator_brief_ref":"data/creator_brief.json","implant":{"status":"LANDED","crew":"GOD DOLLAR BOYZ","agents":7,"briefing":"Creator panel = PII-stripped slate; full CREATOR_DOSSIER private","at_pt":"2026-10-02T13:28:32-07:00"}};

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
    const dists = (u.districts || [u.district || ""]).map((x) => String(x).toLowerCase());
    const dist = String(u.district || "").toLowerCase();
    if (id === "supreme") return dists.includes("supreme") || dist === "supreme";
    if (id === "alpha") return dists.includes("alpha") || dist === "alpha";
    if (id === "beta") return dists.includes("beta") || dist === "beta";
    if (id === "gamma") return dists.includes("gamma") || dist === "gamma";
    if (id === "delta") return dists.includes("delta") || dist === "delta" || u.rank === "Briefing";
    return dist === id || dists.includes(id);
  });
}

function focusDistrict(state, d) {
  document.querySelectorAll(".district").forEach((x) => x.classList.remove("focused"));
  document.querySelectorAll(".agent-pin").forEach((x) => x.classList.remove("lit"));
  const card = document.querySelector('.district[data-id="' + d.id + '"]');
  if (card) card.classList.add("focused");
  document.querySelectorAll('.agent-pin[data-district*="' + d.id + '"]').forEach((p) => p.classList.add("lit"));
  const units = unitsForDistrict(state, d.id);
  const box = document.getElementById("district-focus");
  const lore = d.lore || DISTRICT_LORE[d.id] || "";
  let html = '<div class="card lore-card"><h4>' + (d.name || d.id) + '</h4><p class="meta">' + lore + "</p>";
  if (d.agents && d.agents.length) {
    html += '<p class="meta pin-names">Pinned: ' + d.agents.join(" · ") + "</p>";
  }
  html += "</div>";
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
        (u.rank || u.role || "") +
        " · " +
        (u.district || "") +
        (u.notes || u.flavor ? " — " + (u.notes || u.flavor) : "") +
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
  renderAgentPins(state);
}

function renderAgentPins(state) {
  const layer = document.getElementById("agent-pins");
  if (!layer) return;
  layer.innerHTML = "";
  const units = state.units || [];
  units.forEach((u) => {
    const pin = u.pin || {};
    const x = pin.x != null ? pin.x : 50;
    const y = pin.y != null ? pin.y : 50;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "agent-pin status-" + (u.status || "active");
    btn.style.left = x + "%";
    btn.style.top = y + "%";
    btn.style.setProperty("--pin-color", u.color || "#f0d78c");
    btn.dataset.name = u.name;
    btn.dataset.district = (u.districts || [u.district || ""]).join(",").toLowerCase();
    btn.title = u.name + " — " + (u.role || u.rank || "");
    btn.innerHTML = "<span>" + (u.short || u.name.split(" ").pop()) + "</span>";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const distId = String(u.district || "alpha").toLowerCase();
      const d = (state.districts || []).find((x) => x.id === distId);
      if (d) focusDistrict(state, d);
      document.querySelectorAll(".nav button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      const agentsBtn = document.querySelector('.nav button[data-panel="panel-agents"]');
      const agentsPanel = document.getElementById("panel-agents");
      if (agentsBtn) agentsBtn.classList.add("active");
      if (agentsPanel) agentsPanel.classList.add("active");
      const card = [...document.querySelectorAll(".agent-card")].find((c) => c.dataset.name === u.name);
      if (card) {
        card.classList.add("flash");
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        setTimeout(() => card.classList.remove("flash"), 1600);
      }
    });
    layer.appendChild(btn);
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
    card.dataset.name = u.name;
    const h = document.createElement("h4");
    const dot = document.createElement("span");
    dot.className = "status-dot status-" + (u.status || "active");
    h.appendChild(dot);
    h.appendChild(document.createTextNode(u.name));
    const m1 = document.createElement("div");
    m1.className = "meta";
    m1.textContent = (u.rank || u.role || "") + " · " + (u.district || "");
    const m2 = document.createElement("div");
    m2.className = "meta";
    m2.textContent = u.notes || u.flavor || u.role || "";
    card.appendChild(h);
    card.appendChild(m1);
    card.appendChild(m2);
    if (u.role && u.notes && u.role !== u.notes) {
      const m3 = document.createElement("div");
      m3.className = "meta role-line";
      m3.textContent = "Role: " + u.role;
      card.insertBefore(m3, m2);
    }
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
    const doubled = rows.map((r) => (r.unit || "") + ": " + (r.text || "")).join("   ···   ");
    ticker.textContent = doubled + "   ···   " + doubled + "   ···   ";
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

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderCreator(brief) {
  if (!brief) return;
  const id = document.getElementById("creator-identity");
  const c = brief.creator || {};
  const w = brief.work_auth || {};
  const bg = brief.background || {};
  if (id) {
    id.innerHTML =
      '<div class="creator-name">' + esc(c.title || c.name || "Creator") + '</div>' +
      '<div class="creator-meta">' +
      esc((c.age != null ? c.age + " · " : "") + "DOB " + (c.dob || "") ) +
      "<br/>" + esc(c.address || "") +
      "<br/>" + esc(c.email || "") + " · " + esc(c.phone || "") +
      "<br/>GitHub <a class=\"foot-link\" href=\"https://github.com/" + esc(c.github || "egglockedgoof") + "\" target=\"_blank\" rel=\"noopener\">" + esc(c.github || "") + "</a>" +
      "</div>" +
      '<div class="creator-chips">' +
      '<span class="sys-chip pass">US work auth · no visa</span>' +
      '<span class="sys-chip held">No DL · ' + esc(w.transport || "transit/walk") + "</span>" +
      '<span class="sys-chip ready">Lift ' + esc(w.lift_lbs || "50/80") + " · heights " + esc(w.heights_ft || 25) + "ft</span>" +
      '<span class="sys-chip pass">' + esc(bg.job_corps || "Job Corps") + "</span>" +
      "</div>";
  }
  const mission = document.getElementById("creator-mission");
  const m = brief.mission_oct_2026 || {};
  if (mission) {
    mission.innerHTML =
      "<strong>" + esc(m.pay || "") + "</strong> · " + esc(m.hours || "") +
      "<br/>Areas: " + esc((m.areas || []).join(", ")) +
      "<br/>Shifts: " + esc(m.shifts || "") +
      "<br/>Priority: " + esc(m.priority || "") +
      "<br/>Avoid: " + esc((m.avoid || []).join(", ")) +
      "<br/><em>" + esc(m.status || "") + "</em>" +
      "<br/>" + esc(m.benefits_note || "");
  }
  const safety = document.getElementById("creator-safety");
  const s = brief.safety || {};
  if (safety) {
    safety.innerHTML =
      "Halt on: " + esc((s.halt_on || []).join("; ")) +
      "<br/>Last-4 SSN: " + esc(s.last4_ssn || "") +
      "<br/>JOB_HALT: <strong>" + (s.job_halt ? "ON" : "OFF") + "</strong>" +
      "<br/>Gate E: " + esc(s.gate_e || "");
  }
  const doctrine = document.getElementById("creator-doctrine");
  const d = brief.money_city || {};
  if (doctrine) {
    doctrine.innerHTML =
      "Creator forever · Constitution " + esc(d.constitution || "") +
      " · Security " + esc(d.security_pack || "") +
      " · Army " + esc(d.army_spec || "") +
      "<br/>DualCortex: " + esc(d.dualcortex || "") +
      "<br/>Theme: " + esc(d.theme || "") +
      "<br/><span class=\"gold-line\">“" + esc(d.doctrine_line || "") + "”</span>";
  }
  const hist = document.getElementById("creator-history");
  if (hist) {
    hist.innerHTML = "";
    (brief.history_brief || brief.recent || []).forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      hist.appendChild(li);
    });
  }
  const crew = document.getElementById("creator-crew");
  if (crew) {
    crew.innerHTML = "";
    (brief.crew || []).forEach((a) => {
      const span = document.createElement("span");
      span.className = "sys-chip pass";
      span.textContent = a.name + " — " + a.role;
      crew.appendChild(span);
    });
  }
  // expose prompts for brains
  window.__CREATOR_BRIEF__ = brief;
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
  const state = await loadJSON("data/city_state.json?v=20261002crew", EMBEDDED_STATE);
  const crew = await loadJSON("data/crew_manifest.json?v=20261002crew", null);
  if (crew && crew.agents && !(state.units && state.units.length)) {
    state.units = crew.agents.map((a) => ({
      id: a.id,
      name: a.name,
      short: a.short,
      district: a.district,
      districts: a.districts,
      rank: a.rank,
      status: a.status,
      role: a.role,
      notes: a.flavor,
      flavor: a.flavor,
      pin: a.pin,
      color: a.color,
    }));
  } else if (crew && crew.agents) {
    // merge pins/colors/short from manifest
    const byName = Object.fromEntries(crew.agents.map((a) => [a.name, a]));
    state.units = (state.units || []).map((u) => {
      const a = byName[u.name];
      if (!a) return u;
      return { ...u, short: u.short || a.short, pin: u.pin || a.pin, color: u.color || a.color, role: u.role || a.role, flavor: u.flavor || a.flavor, districts: u.districts || a.districts };
    });
  }
  document.getElementById("updated").textContent = state.updated_pt || "";
  renderMap(state);
  renderRoster(state);
  renderSystems(state);
  renderThrift(state);
  wireTabs();

  const feed = await loadJSON("data/activity_feed.json?v=20261002crew", null);
  const pulse = await loadJSON("data/last_actions.json?v=20261002crew", null);
  const brief = await loadJSON("data/creator_brief.json?v=20261002crew", null);
  const items = (feed && feed.items) || (pulse && pulse.activity) || [];
  renderActivity(items);
  renderActions(pulse || {});
  renderCreator(brief);

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
