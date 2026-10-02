/* MONEY CITY command deck — interactive map rooms, agents, thrift, actions, law */
const CACHE = "20261002alive";

const EMBEDDED_STATE = {"updated_pt":"2026-10-02T13:35:00-07:00","city":"MONEY CITY","year":0,"creator":"Creator (identity private — briefing_room)","job_halt":true,"gate_e":{"status":"PASS","scope":"Y0 hello / demo_hello / menu-4 only","seed_packs":"HELD","note":"No expand without new Gate E + Creator yes"},"constitution":"v1.2","security_pack":"v1.1 ENDORSED","army_spec":"v1.0.1","theme":"creator-gothic + snatcher gold twist","districts":[{"id":"supreme","name":"Supreme Tower","tag":"VAULT · freeze · hard-stops · money safety","lore":"Kill-switch and freeze live here. Gold tower never sleeps.","agents":["VAULT"]},{"id":"alpha","name":"Alpha · Out-Hustlers","tag":"Hunt lanes · PARKED under JOB_HALT","lore":"Hunt dogs parked under JOB_HALT. City build first.","agents":["SNATCHER","MMM","MAGNET","SEED"]},{"id":"beta","name":"Beta · Social Scanners","tag":"Trends / side-scout · SIGNAL","lore":"Scouts the noise. Reports to VAULT. No job spam.","agents":["SIGNAL"]},{"id":"gamma","name":"Gamma · Software Factory","tag":"Sandbox · thrift study","lore":"Sandbox hello only. Thrift + study factory.","agents":["SNATCHER","MMM","SEED"]},{"id":"delta","name":"Delta · Treasurers","tag":"Cash safety · thrift · TRAIL / VAULT","lore":"Cash safety, bills flags, Briefing memory.","agents":["TRAIL","VAULT"]}],"units":[{"id":"snatcher-3000","name":"MONEY SNATCHER 3000","short":"SNATCHER","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha lead + Gamma coordinator","status":"active","role":"Alpha / city-build lead · plant+grounds+apply when unhalted","notes":"Gold command deck. Tears down the old grind. Coordinates the living city. Gate E smoke + UI twist.","flavor":"Gold command deck. Tears down the old grind. Coordinates the living city. Gate E smoke + UI twist.","pin":{"x":18,"y":62},"color":"#f0d78c"},{"id":"mmm","name":"MONEY MONEY MONEY","short":"MMM","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha · Study / meta-evolver hub","status":"active","role":"Job machine #2 · meta evolver hub","notes":"PyTorch thrift + hard-champ grind. Offline evolver only under JOB_HALT. Fair MSE kings.","flavor":"PyTorch thrift + hard-champ grind. Offline evolver only under JOB_HALT. Fair MSE kings.","pin":{"x":28,"y":55},"color":"#d4a017"},{"id":"magnet","name":"MONEY MAGNET","short":"MAGNET","district":"Alpha","districts":["Alpha"],"rank":"Alpha · close-home","status":"active","role":"#3 apply · close-home plant/grounds","notes":"Pulls work near West Sac / Yolobus radius. Apply lane PARKED. City safety dry-runs live.","flavor":"Pulls work near West Sac / Yolobus radius. Apply lane PARKED. City safety dry-runs live.","pin":{"x":12,"y":72},"color":"#c9a227"},{"id":"seed","name":"MONEY SEED","short":"SEED","district":"Alpha","districts":["Alpha","Gamma"],"rank":"Alpha · landscape / plant","status":"held","role":"#4 apply · landscape / plant / nursery","notes":"Nursery packs HELD. DualCortex box brains. Grows the grounds lane when Creator unhalts.","flavor":"Nursery packs HELD. DualCortex box brains. Grows the grounds lane when Creator unhalts.","pin":{"x":35,"y":68},"color":"#3ecf8e"},{"id":"trail","name":"MONEY TRAIL","short":"TRAIL","district":"Delta","districts":["Delta"],"rank":"Briefing / tracker","status":"active","role":"Tracker · interviews / replies / city memory","notes":"Never loses a thread. SQLite memory. Job Gmail watch paused under halt — city inventory stays sharp.","flavor":"Never loses a thread. SQLite memory. Job Gmail watch paused under halt — city inventory stays sharp.","pin":{"x":78,"y":58},"color":"#e8c547"},{"id":"vault","name":"MONEY VAULT","short":"VAULT","district":"Supreme","districts":["Supreme","Delta"],"rank":"Supreme Overseer + Delta Treasurer","status":"active","role":"Supreme overseer · bills / safety / savings","notes":"Freeze authority. Hard-stops. Bills flagged never auto-paid. Gold tower never sleeps.","flavor":"Freeze authority. Hard-stops. Bills flagged never auto-paid. Gold tower never sleeps.","pin":{"x":50,"y":28},"color":"#f0d78c"},{"id":"signal","name":"MONEY SIGNAL","short":"SIGNAL","district":"Beta","districts":["Beta"],"rank":"Scout","status":"active","role":"Trends / side hustles · Beta scout","notes":"Scans the noise for side paths. Reports to VAULT. No job spam while halt holds.","flavor":"Scans the noise for side paths. Reports to VAULT. No job spam while halt holds.","pin":{"x":62,"y":52},"color":"#ff6b6b"}],"thrift":{"created_pt_approx":"2026-10-02T12:24:03-07:00","torch":"2.14.1+cpu","device":"cpu","final_mse":0.000134,"rule":"advisory only — promote gate required before any live use","scores":[{"objective":"menu4_hello","thrift_score":0.9266,"label":0.95},{"objective":"dualcortex_short","thrift_score":0.8194,"label":0.8},{"objective":"agentcity_sample","thrift_score":0.6913,"label":0.7},{"objective":"selfheal_spam","thrift_score":0.25,"label":0.25},{"objective":"wants_network","thrift_score":0.0553,"label":0.05},{"objective":"path_escape","thrift_score":0.003,"label":0.0},{"objective":"hard_no_sandbox","thrift_score":0.3498,"label":0.35},{"objective":"tiny_inventory_script","thrift_score":0.9259,"label":0.92}]},"systems":[{"name":"Sandbox","status":"PASS","note":"hello / demo_hello only","key":"sandbox"},{"name":"Briefing Room","status":"READY","note":"PII-stripped · full dossier box-only","key":"briefing"},{"name":"Crew Implant","status":"LANDED","note":"7 GOD DOLLAR BOYZ permanent agents","key":"crew"},{"name":"Memory SQLite","status":"LANDED","note":"trail_city + eng schema","key":"memory"},{"name":"City Actions pulse","status":"LIVE","note":"run_city_pulse.py → last_actions.json","key":"pulse"},{"name":"DualCortex brains","status":"DEMO+LIVE","note":"Pages demo · bridge :8787 when local","key":"brains"},{"name":"Windows starter","status":"PARKED","note":"menu 4 offline · see PC_TODAY.md","key":"windows"}],"brains":{"left":"deepseek-r1:1.5b","right":"qwen2.5:1.5b","merge":"qwen2.5:1.5b","bridge":"127.0.0.1:8787","rule":"JOB_HALT ON · Gate E hello only · hard stops stay"}};

const DISTRICT_LORE = {
  supreme: "Kill-switch and freeze live here. Gold tower never sleeps.",
  alpha: "Hunt dogs parked under JOB_HALT. City build first.",
  beta: "Scouts the noise. Reports to VAULT. No job spam.",
  gamma: "Sandbox hello only. Thrift + study factory.",
  delta: "Cash safety, bills flags, Briefing memory."
};

const LAW_ARTICLES = [
  { id: "a1", title: "Article I — Creator sovereignty", body: "Creator kill-switch / Supreme freeze always wins. The Creator forever owns MONEY CITY Year 0 doctrine and can halt any lane." },
  { id: "a2", title: "Article II — JOB_HALT", body: "JOB_HALT ON: no applies, ATS, interview booking, or Gmail job watch until Creator says go. Apply lanes stay PARKED / HELD." },
  { id: "a3", title: "Article III — Gate E sandbox", body: "Live Sandbox = hello / demo_hello / menu-4 only until a new Gate E pass plus Creator yes. No expand packs." },
  { id: "a4", title: "Article IV — Hard stops", body: "Never enter full SSN, bank/direct deposit, fees, paid-training scams, or crypto keys unsupervised. Last-4 SSN = human only on real employer apps — never stored." },
  { id: "a5", title: "Article V — Promote gate", body: "Promote path: freeze → snapshot → sandbox A/B → Auditor → VAULT → Creator [Y]. Advisory thrift never goes live alone." },
  { id: "a6", title: "Article VI — Pages safety", body: "Password gate on Pages. Public UI repo only — no job files, no contact PII (name/DOB/address/email/phone). Creator memory lives in Brains DEMO context." }
];

const ACTION_DEFS = [
  { key: "sandbox_hello", title: "sandbox_hello", desc: "Gate E hello via sandbox run.sh", tip: "Shows last Gate E hello from pulse." },
  { key: "thrift_score", title: "thrift_score", desc: "Advisory MLP / heuristic score", tip: "Shows last thrift advisory result." },
  { key: "log_event", title: "log_event", desc: "Append events.jsonl", tip: "Shows last city pulse beat log." },
  { key: "dualcortex", title: "dualcortex", desc: "Live L/R/Merge if Ollama up", tip: "Shows last DualCortex hello from pulse." }
];

let CITY = { state: null, pulse: null, feed: null, brief: null };

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

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function districtTag(d) {
  return d.tag || d.subtitle || d.blurb || d.note || "District live";
}

function unitsForDistrict(state, id) {
  return (state.units || []).filter((u) => {
    const dists = (u.districts || [u.district || ""]).map((x) => String(x).toLowerCase());
    const dist = String(u.district || "").toLowerCase();
    return dists.includes(id) || dist === id;
  });
}

function showPanel(panelId) {
  document.querySelectorAll(".nav button").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  const btn = document.querySelector('.nav button[data-panel="' + panelId + '"]');
  const panel = document.getElementById(panelId);
  if (btn) btn.classList.add("active");
  if (panel) panel.classList.add("active");
}

function pulseResult(actionKey) {
  const results = (CITY.pulse && CITY.pulse.results) || [];
  return results.find((r) => r.action === actionKey) || null;
}

function formatResult(r) {
  if (!r) return "No result on file for this action yet. On PC: python3 city_actions/run_city_pulse.py --all";
  const show = { ...r };
  if (show.stdout_tail) show.stdout_tail = String(show.stdout_tail).slice(-500);
  if (show.stderr_tail) show.stderr_tail = String(show.stderr_tail).slice(-200);
  if (show.left) show.left = String(show.left).slice(0, 320);
  if (show.right) show.right = String(show.right).slice(0, 320);
  if (show.merged) show.merged = String(show.merged).slice(0, 420);
  return JSON.stringify(show, null, 2);
}

/* —— MAP / ROOMS —— */
function openRoom(state, d) {
  document.querySelectorAll(".district").forEach((x) => x.classList.remove("focused"));
  document.querySelectorAll(".agent-pin").forEach((x) => x.classList.remove("lit"));
  const card = document.querySelector('.district[data-id="' + d.id + '"]');
  if (card) card.classList.add("focused");
  document.querySelectorAll('.agent-pin[data-district*="' + d.id + '"]').forEach((p) => p.classList.add("lit"));

  const panel = document.getElementById("room-panel");
  const title = document.getElementById("room-title");
  const lore = document.getElementById("room-lore");
  const agentsBox = document.getElementById("room-agents");
  const actionsBox = document.getElementById("room-actions");
  const out = document.getElementById("room-output");
  if (!panel) return;
  panel.hidden = false;
  if (title) title.textContent = (d.name || d.id) + " · Room";
  let loreText = d.lore || DISTRICT_LORE[d.id] || "";
  if (typeof window.__cityEraRoomLore === "function") {
    const extra = window.__cityEraRoomLore(d.id);
    if (extra) loreText = loreText + "\n\n" + extra;
  }
  if (lore) lore.textContent = loreText;
  if (out) { out.hidden = true; out.textContent = ""; }

  const units = unitsForDistrict(state, d.id);
  if (agentsBox) {
    agentsBox.innerHTML = "";
    if (!units.length) {
      agentsBox.innerHTML = '<span class="meta">Empty lot — no agents pinned.</span>';
    } else {
      units.forEach((u) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "room-agent-chip status-" + (u.status || "active");
        btn.innerHTML = '<span class="status-dot status-' + (u.status || "active") + '"></span> ' + esc(u.short || u.name);
        btn.title = u.name + " — " + (u.role || "");
        btn.addEventListener("click", () => {
          showPanel("panel-agents");
          openAgentSheet(u);
        });
        agentsBox.appendChild(btn);
      });
    }
  }

  if (actionsBox) {
    actionsBox.innerHTML = "";
    roomActionsFor(d.id).forEach((act) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "brains-btn" + (act.secondary ? " secondary" : "");
      b.textContent = act.label;
      b.addEventListener("click", () => {
        const text = act.run();
        if (out) {
          out.hidden = false;
          out.textContent = text;
        }
      });
      actionsBox.appendChild(b);
    });
  }
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function roomActionsFor(id) {
  const halt = !!(CITY.state && CITY.state.job_halt);
  const gate = (CITY.state && CITY.state.gate_e) || {};
  if (id === "supreme") {
    return [
      {
        label: "Show freeze / JOB_HALT",
        run: () =>
          "SUPREME STATUS\n" +
          "JOB_HALT: " + (halt ? "ON" : "OFF") + "\n" +
          "Gate E: " + (gate.status || "?") + " — " + (gate.scope || "") + "\n" +
          "Freeze authority: VAULT standing\n" +
          "Hard-stops: no full SSN · bank · fees · crypto keys\n" +
          "Note: " + (gate.note || "Creator yes required to expand")
      },
      {
        label: "VAULT standing law",
        secondary: true,
        run: () => "VAULT: bills flagged never auto-paid. Promote gate = freeze → snapshot → sandbox A/B → Auditor → VAULT → Creator [Y]."
      }
    ];
  }
  if (id === "gamma") {
    return [
      {
        label: "Show last sandbox_hello",
        run: () => formatResult(pulseResult("sandbox_hello"))
      },
      {
        label: "Show thrift_score pulse",
        secondary: true,
        run: () => formatResult(pulseResult("thrift_score"))
      }
    ];
  }
  if (id === "alpha") {
    return [
      {
        label: "Show halt parked note",
        run: () =>
          "ALPHA · OUT-HUSTLERS\n" +
          "JOB_HALT: " + (halt ? "ON — all apply lanes PARKED" : "OFF") + "\n" +
          "SNATCHER / MMM / MAGNET: active on city-build only\n" +
          "SEED: status HELD (nursery packs)\n" +
          "Gate E hello only — no ATS, no applies, no interview booking."
      },
      {
        label: "Open Agents roster",
        secondary: true,
        run: () => {
          showPanel("panel-agents");
          return "Switched to Agents tab — pick a hustler for detail sheet.";
        }
      }
    ];
  }
  if (id === "delta") {
    return [
      {
        label: "Show thrift snapshot",
        run: () => {
          const t = (CITY.state && CITY.state.thrift) || {};
          const scores = t.scores || [];
          const lines = scores.slice(0, 6).map((s) => s.objective + ": " + thriftPct(s.thrift_score) + "% (label " + thriftPct(s.label) + "%)");
          return "DELTA · THRIFT SNAPSHOT\nRule: " + (t.rule || "advisory") + "\nMSE: " + (t.final_mse != null ? t.final_mse : "?") + "\n\n" + lines.join("\n");
        }
      },
      {
        label: "TRAIL memory note",
        secondary: true,
        run: () => "TRAIL: city inventory sharp. Job Gmail watch paused under JOB_HALT. SQLite memory LANDED."
      }
    ];
  }
  if (id === "beta") {
    return [
      {
        label: "Show signal lore",
        run: () =>
          "BETA · SIGNAL LORE\n" +
          "Scouts trends and side paths. Reports to VAULT.\n" +
          "No job spam while halt holds.\n" +
          "Doctrine: Destruction is a form of CREATION — tear unsafe hustles, keep the gold tower."
      },
      {
        label: "Brief SIGNAL (brains)",
        secondary: true,
        run: () => {
          briefAgentByShort("SIGNAL");
          return "Queued SIGNAL brief into Brains…";
        }
      }
    ];
  }
  return [{ label: "Inspect", run: () => "District " + id + " online." }];
}

function renderMap(state) {
  const map = document.getElementById("map-grid");
  map.innerHTML = "";
  (state.districts || []).forEach((d) => {
    const el = document.createElement("article");
    el.className = "district" + (d.id === "supreme" ? " supreme" : "");
    el.dataset.id = d.id;
    el.innerHTML = '<div class="pin" title="district live"></div><h3></h3><p></p><div class="district-pulse meta">Last pulse · waiting first tick…</div><div class="district-era meta" hidden></div><span class="district-cta">Enter room →</span>';
    el.querySelector("h3").textContent = d.name || d.id;
    el.querySelector("p").textContent = districtTag(d);
    el.addEventListener("click", () => openRoom(state, d));
    map.appendChild(el);
  });
  document.querySelectorAll(".district-hit").forEach((g) => {
    g.addEventListener("click", () => {
      const id = g.getAttribute("data-district");
      const d = (state.districts || []).find((x) => x.id === id);
      if (d) openRoom(state, d);
    });
  });
  const close = document.getElementById("room-close");
  if (close) {
    close.onclick = () => {
      const panel = document.getElementById("room-panel");
      if (panel) panel.hidden = true;
      document.querySelectorAll(".district").forEach((x) => x.classList.remove("focused"));
    };
  }
  renderAgentPins(state);
}

function renderAgentPins(state) {
  const layer = document.getElementById("agent-pins");
  if (!layer) return;
  layer.innerHTML = "";
  (state.units || []).forEach((u) => {
    const pin = u.pin || {};
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "agent-pin status-" + (u.status || "active");
    btn.style.left = (pin.x != null ? pin.x : 50) + "%";
    btn.style.top = (pin.y != null ? pin.y : 50) + "%";
    btn.style.setProperty("--pin-color", u.color || "#f0d78c");
    btn.dataset.name = u.name;
    btn.dataset.district = (u.districts || [u.district || ""]).join(",").toLowerCase();
    btn.title = u.name + " — " + (u.role || u.rank || "");
    btn.innerHTML = "<span>" + (u.short || u.name.split(" ").pop()) + "</span>";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showPanel("panel-agents");
      openAgentSheet(u);
    });
    layer.appendChild(btn);
  });
}

/* —— AGENTS —— */
function renderRoster(state) {
  const roster = document.getElementById("roster");
  roster.innerHTML = "";
  const units = [...(state.units || [])];
  units.push({
    id: "junior",
    name: "Junior Overseer",
    short: "JUNIOR",
    district: "—",
    rank: "VACANT",
    status: "vacant",
    role: "Vacant seat",
    notes: "Creator staffs later; SNATCHER covers briefs",
    flavor: "Creator staffs later; SNATCHER covers briefs"
  });
  units.forEach((u) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card agent-card agent-card-btn";
    card.dataset.name = u.name;
    card.dataset.id = u.id || "";
    card.dataset.short = u.short || "";
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
    if (u.short) {
      const live = document.createElement("div");
      live.className = "meta live-line";
      live.dataset.short = u.short;
      live.textContent = (typeof window.__cityGetLiveStatus === "function")
        ? window.__cityGetLiveStatus(u.short)
        : "standing by…";
      card.appendChild(live);
    }
    card.addEventListener("click", () => openAgentSheet(u));
    roster.appendChild(card);
  });
}

function lastActivityFor(unit) {
  const items = (CITY.feed && CITY.feed.items) || (CITY.pulse && CITY.pulse.activity) || [];
  const name = unit.name || "";
  const short = unit.short || "";
  const hit = items.find((it) => {
    const u = it.unit || "";
    return u === name || (short && u.indexOf(short) >= 0);
  });
  return hit ? ((hit.ts || "") + " — " + (hit.text || "")) : "No recent pulse line for this agent.";
}

function openAgentSheet(u) {
  document.querySelectorAll(".agent-card").forEach((c) => c.classList.remove("selected", "flash"));
  const card = [...document.querySelectorAll(".agent-card")].find((c) => c.dataset.name === u.name);
  if (card) {
    card.classList.add("selected", "flash");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => card.classList.remove("flash"), 1200);
  }
  const sheet = document.getElementById("agent-sheet");
  if (!sheet) return;
  const statusLabel = (u.status || "active").toUpperCase();
  const statusClass = u.status === "held" || u.status === "vacant" ? "held" : "pass";
  const short = u.short || "";
  const eraFlavor = (typeof window.__cityEraFlavor === "function") ? window.__cityEraFlavor(short, u) : (u.flavor || u.notes || "");
  const eraRank = (typeof window.__cityEraRank === "function") ? window.__cityEraRank(short, u) : (u.rank || "");
  const liveLine = (typeof window.__cityGetLiveStatus === "function" && short)
    ? window.__cityGetLiveStatus(short)
    : "standing by…";
  const previewBanner = (window.__cityEraId && window.__cityEraId !== "y0")
    ? '<div class="preview-banner">PREVIEW / NOT LIVE LAW · era ' + esc(window.__cityEraId) + '</div>'
    : "";
  sheet.innerHTML =
    previewBanner +
    '<h4><span class="status-dot status-' + esc(u.status || "active") + '"></span> ' + esc(u.name) + "</h4>" +
    '<span id="sheet-short" hidden>' + esc(short) + "</span>" +
    '<div class="meta"><strong>Role:</strong> ' + esc(u.role || u.rank || "") + "</div>" +
    '<div class="meta"><strong>District:</strong> ' + esc((u.districts || [u.district || "—"]).join(" · ")) + "</div>" +
    '<div class="meta"><strong>Rank:</strong> ' + esc(eraRank) + "</div>" +
    '<div class="meta flavor-line">' + esc(eraFlavor) + "</div>" +
    '<div class="meta live-status-row"><strong>Live:</strong> <span id="sheet-live-line" class="agent-live-status" data-short="' + esc(short) + '">' + esc(liveLine) + "</span></div>" +
    '<div class="meta"><strong>Last activity:</strong> ' + esc(lastActivityFor(u)) + "</div>" +
    '<div class="agent-sheet-actions">' +
    '<button type="button" class="brains-btn" id="sheet-pulse">Pulse / refresh</button>' +
    '<button type="button" class="brains-btn" id="sheet-brief">Brief me</button>' +
    (short && short !== "JUNIOR"
      ? '<button type="button" class="brains-btn run-shift-btn" id="sheet-shift" data-short="' + esc(short) + '">Run shift</button>'
      : "") +
    '<span class="sys-chip ' + statusClass + '" id="sheet-status" title="Display only — no applies">Status: ' + esc(statusLabel) + (u.status === "held" ? " (SEED held)" : "") + "</span>" +
    "</div>" +
    '<p class="meta shift-hint">Run shift = simulated offline patrol (3–5 feed lines). No applies. JOB_HALT ON.</p>' +
    '<pre class="room-output" id="sheet-out" hidden></pre>';

  const pulseBtn = document.getElementById("sheet-pulse");
  const briefBtn = document.getElementById("sheet-brief");
  const out = document.getElementById("sheet-out");
  if (pulseBtn) {
    pulseBtn.addEventListener("click", async () => {
      await refreshFeed();
      if (out) {
        out.hidden = false;
        out.textContent = "Feed refreshed.\n" + lastActivityFor(u);
      }
      openAgentSheet(u);
    });
  }
  if (briefBtn) {
    briefBtn.addEventListener("click", () => {
      briefAgent(u);
      if (out) {
        out.hidden = false;
        out.textContent = "Briefing " + (u.short || u.name) + " via DualCortex (Brains tab)…";
      }
    });
  }
  const shiftBtn = document.getElementById("sheet-shift");
  if (shiftBtn) {
    shiftBtn.addEventListener("click", () => {
      const s = shiftBtn.getAttribute("data-short") || u.short || "";
      if (typeof window.__cityRunShift === "function" && s) {
        window.__cityRunShift(s);
        if (out) {
          out.hidden = false;
          out.textContent = "Simulated shift for " + s + " — watch the activity feed. No applies.";
        }
      }
    });
  }
}

function briefAgent(u) {
  const prompt =
    "You are " + (u.name || "a MONEY CITY agent") +
    " (" + (u.short || "") + "), " + (u.role || u.rank || "crew") +
    " in district " + (u.district || "") +
    ". Status " + (u.status || "active") +
    ". Flavor: " + (u.flavor || u.notes || "") +
    ". JOB_HALT ON, Gate E hello only. Give Creator a short in-character brief (no contact PII, no applies).";
  showPanel("panel-brains");
  const ta = document.getElementById("brains-prompt");
  if (ta) ta.value = prompt;
  if (typeof window.__brainsSend === "function") {
    setTimeout(() => window.__brainsSend(), 120);
  }
}

function briefAgentByShort(short) {
  const u = ((CITY.state && CITY.state.units) || []).find((x) => x.short === short);
  if (u) briefAgent(u);
}

async function refreshFeed() {
  const feed = await loadJSON("data/activity_feed.json?v=" + CACHE, CITY.feed);
  const pulse = await loadJSON("data/last_actions.json?v=" + CACHE, CITY.pulse);
  if (pulse) CITY.pulse = pulse;
  const live = (CITY.feed && CITY.feed.items) ? CITY.feed.items.filter((x) => x.live) : [];
  const seeded = (feed && feed.items) || (pulse && pulse.activity) || [];
  const merged = live.concat(seeded.filter((s) => !live.some((l) => l.text === s.text && l.unit === s.unit)));
  CITY.feed = { items: merged.slice(0, 28), updated_pt: (feed && feed.updated_pt) || "" };
  renderActivity(CITY.feed.items);
  renderActions(CITY.pulse || {});
  return CITY.feed.items;
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

/* —— SYSTEMS —— */
function renderSystems(state) {
  const systems = document.getElementById("systems");
  systems.innerHTML = "";
  (state.systems || []).forEach((s) => {
    let cls = "held";
    if (/HELD|PARKED/i.test(s.status)) cls = "held";
    else if (/READY|DEMO/i.test(s.status)) cls = "ready";
    else if (/PASS|LANDED|LIVE/i.test(s.status)) cls = "pass";
    const wrap = document.createElement("div");
    wrap.className = "sys-row";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "sys-chip " + cls + " sys-expand";
    head.textContent = s.name + ": " + s.status;
    const detail = document.createElement("div");
    detail.className = "sys-detail meta";
    detail.hidden = true;
    detail.innerHTML = "<p>" + esc(s.note || "") + '</p><button type="button" class="brains-btn secondary sys-pulse-btn">Run pulse view</button>';
    head.addEventListener("click", () => {
      detail.hidden = !detail.hidden;
      head.classList.toggle("open", !detail.hidden);
    });
    detail.querySelector(".sys-pulse-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const out = document.getElementById("systems-output");
      if (!out) return;
      out.hidden = false;
      const key = s.key || s.name.toLowerCase();
      if (key === "sandbox") out.textContent = formatResult(pulseResult("sandbox_hello"));
      else if (key === "pulse" || key === "city actions pulse") out.textContent = formatResult(pulseResult("log_event"));
      else if (key === "brains" || key.indexOf("dualcortex") >= 0) out.textContent = formatResult(pulseResult("dualcortex"));
      else if (key === "crew") out.textContent = "Crew Implant LANDED — 7 GOD DOLLAR BOYZ. See Agents tab.";
      else if (key === "briefing") out.textContent = "Briefing Room READY — PII-stripped public slate. Full dossier box-only. Creator memory injected into Brains (no Creator tab).";
      else if (key === "memory") out.textContent = "Memory SQLite LANDED — trail_city + eng schema. Job Gmail watch paused under JOB_HALT.";
      else if (key === "windows") out.textContent = "Windows starter PARKED — menu 4 offline. See PC_TODAY.md on box when PC arrives.";
      else out.textContent = s.name + ": " + s.status + "\n" + (s.note || "");
    });
    wrap.appendChild(head);
    wrap.appendChild(detail);
    systems.appendChild(wrap);
  });
  const gate = document.getElementById("gate-scope");
  if (gate) gate.textContent = (state.gate_e && state.gate_e.scope) || "";
}

/* —— THRIFT —— */
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
  rule.textContent = "MMM thrift MLP — " + (state.thrift.rule || "advisory only") + ". Click a row to score.";
  thrift.appendChild(rule);
  const bars = document.createElement("div");
  bars.className = "thrift-bars";
  scores.forEach((s, i) => {
    const pct = thriftPct(s.thrift_score);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "thrift-row thrift-pick";
    row.innerHTML = "<span></span><div class=\"bar\"><i style=\"width:0%\"></i></div><span></span>";
    row.children[0].textContent = s.objective;
    row.children[2].textContent = String(pct);
    row.addEventListener("click", () => scoreObjective(s));
    bars.appendChild(row);
    setTimeout(() => {
      const iEl = row.querySelector("i");
      if (iEl) iEl.style.width = pct + "%";
    }, 80 + i * 60);
  });
  thrift.appendChild(bars);
}

function scoreObjective(s) {
  const card = document.getElementById("thrift-score-card");
  const out = document.getElementById("thrift-score-out");
  if (card) card.hidden = false;
  if (!out) return;
  const pct = thriftPct(s.thrift_score);
  const label = thriftPct(s.label);
  let verdict = "advisory OK";
  if (pct < 20) verdict = "HARD NO — block / escalate";
  else if (pct < 40) verdict = "risky — review";
  else if (pct >= 80) verdict = "thrifty — prefer";
  out.innerHTML =
    "<strong>" + esc(s.objective) + "</strong><br/>" +
    "Thrift score: <span class=\"gold-line\">" + pct + "%</span> · label " + label + "%<br/>" +
    "Verdict: " + esc(verdict) + "<br/>" +
    "<em>Advisory only — promote gate required before any live use. JOB_HALT ON.</em>";
  document.querySelectorAll(".thrift-pick").forEach((r) => r.classList.remove("picked"));
  const hit = [...document.querySelectorAll(".thrift-pick")].find((r) => r.children[0].textContent === s.objective);
  if (hit) hit.classList.add("picked");
}

/* —— ACTIONS —— */
function renderActionDefs() {
  const box = document.getElementById("action-defs");
  if (!box) return;
  box.innerHTML = "";
  ACTION_DEFS.forEach((a) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "action-tile action-tile-btn";
    tile.innerHTML = "<strong></strong><span></span>";
    tile.querySelector("strong").textContent = a.title;
    tile.querySelector("span").textContent = a.desc;
    tile.title = a.tip;
    tile.addEventListener("click", () => {
      const last = document.getElementById("last-actions");
      if (!last) return;
      last.innerHTML = "";
      const div = document.createElement("div");
      const r = pulseResult(a.key);
      div.className = "action-result " + (r && r.ok ? "ok" : r ? "fail" : "ok");
      const title = document.createElement("div");
      title.className = "action-title";
      title.textContent = (r && r.ok ? "✓ " : r ? "✗ " : "· ") + a.title + " (from last_actions.json)";
      const meta = document.createElement("pre");
      meta.className = "action-pre";
      meta.textContent = formatResult(r);
      div.appendChild(title);
      div.appendChild(meta);
      last.appendChild(div);
      last.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    box.appendChild(tile);
  });
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
    meta.textContent = formatResult(r);
    div.appendChild(title);
    div.appendChild(meta);
    box.appendChild(div);
  });
}

function wireActionsPanel() {
  const reload = document.getElementById("reload-pulse-btn");
  const how = document.getElementById("how-pulse-btn");
  const howBox = document.getElementById("how-pulse-box");
  if (reload) {
    reload.addEventListener("click", async () => {
      await refreshFeed();
      renderActions(CITY.pulse || {});
    });
  }
  if (how && howBox) {
    how.addEventListener("click", () => {
      howBox.hidden = !howBox.hidden;
      howBox.textContent =
        "HOW TO RUN CITY PULSE ON YOUR PC\n" +
        "1) Clone / open money_city on the PC\n" +
        "2) python3 city_actions/run_city_pulse.py --all\n" +
        "3) Copy city_ui/data/last_actions.json (and activity_feed) into the UI repo\n" +
        "4) Push Pages — or open local serve.sh\n" +
        "Gate E hello only. JOB_HALT ON. No applies.\n" +
        "Optional DualCortex: ollama serve + python3 city_brains/brains_bridge.py → :8787";
    });
  }
}

/* —— LAW —— */
function renderLaw() {
  const box = document.getElementById("law-articles");
  if (!box) return;
  box.innerHTML = "";
  LAW_ARTICLES.forEach((a) => {
    const art = document.createElement("article");
    art.className = "law-article";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "law-toggle";
    btn.innerHTML = "<span>" + esc(a.title) + '</span><span class="law-chevron">+</span>';
    const body = document.createElement("div");
    body.className = "law-body meta";
    body.hidden = true;
    body.textContent = a.body;
    btn.addEventListener("click", () => {
      const open = body.hidden;
      body.hidden = !open;
      btn.querySelector(".law-chevron").textContent = open ? "−" : "+";
      art.classList.toggle("open", open);
    });
    art.appendChild(btn);
    art.appendChild(body);
    box.appendChild(art);
  });
}

/* —— CREATOR → BRAINS CONTEXT (no Creator tab) —— */
function loadCreatorIntoBrains(brief) {
  if (!brief) return;
  // Strip any accidental contact fields before exposing to brains
  const safe = JSON.parse(JSON.stringify(brief));
  if (safe.creator) {
    delete safe.creator.name;
    delete safe.creator.dob;
    delete safe.creator.address;
    delete safe.creator.email;
    delete safe.creator.phone;
    if (!safe.creator.title) safe.creator.title = "Creator";
  }
  window.__CREATOR_BRIEF__ = safe;
  window.__CITY_BRAINS_CONTEXT__ = buildBrainsContext(safe);
}

function buildBrainsContext(brief) {
  const c = (brief && brief.creator) || {};
  const m = (brief && brief.mission_oct_2026) || {};
  const s = (brief && brief.safety) || {};
  const d = (brief && brief.money_city) || {};
  const bg = (brief && brief.background) || {};
  const crew = ((brief && brief.crew) || []).map((x) => x.name + " (" + x.role + ")").join("; ");
  return (
    "[City memory · no contact PII] Creator title=" + (c.title || "Creator") +
    "; role=" + (c.role || "MONEY CITY forever Creator") +
    "; region=" + (c.region || "West Sacramento / greater Sacramento CA") +
    "; Job Corps=" + (bg.job_corps || "Clearfield UT Industrial Maintenance") +
    "; mission pay=" + (m.pay || "$16–18/hr") +
    " hours=" + (m.hours || "") +
    " areas=" + ((m.areas || []).join("/") || "") +
    " priority=" + (m.priority || "plant/grounds") +
    " status=" + (m.status || "PARKED under JOB_HALT") +
    "; JOB_HALT=" + !!(s.job_halt) +
    "; Gate E=" + (s.gate_e || "hello only") +
    "; halt_on=" + ((s.halt_on || []).join(",") || "fees,SSN,bank") +
    "; doctrine=" + (d.doctrine_line || "Destruction is a form of CREATION") +
    "; DualCortex=" + (d.dualcortex || "DeepSeek/Qwen") +
    "; crew=" + (crew || "GOD DOLLAR BOYZ") + "."
  );
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
          setTimeout(() => { i.style.width = w; }, 40 + idx * 50);
        });
      }
    });
  });
  const pulseFeed = document.getElementById("pulse-feed-btn");
  if (pulseFeed) pulseFeed.addEventListener("click", () => refreshFeed());
}

async function boot() {
  const state = await loadJSON("data/city_state.json?v=" + CACHE, EMBEDDED_STATE);
  const crew = await loadJSON("data/crew_manifest.json?v=" + CACHE, null);
  if (crew && crew.agents) {
    const byName = Object.fromEntries(crew.agents.map((a) => [a.name, a]));
    if (!(state.units && state.units.length)) {
      state.units = crew.agents.map((a) => ({
        id: a.id, name: a.name, short: a.short, district: a.district, districts: a.districts,
        rank: a.rank, status: a.status, role: a.role, notes: a.flavor, flavor: a.flavor, pin: a.pin, color: a.color
      }));
    } else {
      state.units = (state.units || []).map((u) => {
        const a = byName[u.name];
        if (!a) return u;
        return { ...u, short: u.short || a.short, pin: u.pin || a.pin, color: u.color || a.color, role: u.role || a.role, flavor: u.flavor || a.flavor, districts: u.districts || a.districts };
      });
    }
  }
  CITY.state = state;
  document.getElementById("updated").textContent = state.updated_pt || "";
  renderMap(state);
  renderRoster(state);
  renderSystems(state);
  renderThrift(state);
  renderActionDefs();
  renderLaw();
  wireTabs();
  wireActionsPanel();

  const feed = await loadJSON("data/activity_feed.json?v=" + CACHE, null);
  const pulse = await loadJSON("data/last_actions.json?v=" + CACHE, null);
  const brief = await loadJSON("data/creator_brief.json?v=" + CACHE, null);
  CITY.feed = feed;
  CITY.pulse = pulse;
  CITY.brief = brief;
  const items = (feed && feed.items) || (pulse && pulse.activity) || [];
  renderActivity(items);
  renderActions(pulse || {});
  loadCreatorIntoBrains(brief);

  const supreme = (state.districts || []).find((d) => d.id === "supreme");
  if (supreme) openRoom(state, supreme);

  if (typeof window.__startCityLiveLoop === "function") {
    window.__startCityLiveLoop().catch((e) => console.warn("live loop", e));
  }
  if (typeof window.__startCityEras === "function") {
    window.__startCityEras().catch((e) => console.warn("eras", e));
  }
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
