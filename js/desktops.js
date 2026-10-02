/* MONEY CITY Desktops — watchable worker frames + VM status
   DualCortex = speech. Desks/VMs = WORK. Grok-class = cloud runtime / heavy VMs on Creator PC. */
(function () {
  const CACHE = "20261002desks";
  const DISTRICT_PINS = {
    alpha: { x: 18, y: 62 },
    beta: { x: 62, y: 52 },
    gamma: { x: 38, y: 70 },
    delta: { x: 78, y: 58 },
    supreme: { x: 50, y: 28 }
  };

  async function loadJSON(url, fb) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      return await r.json();
    } catch (e) {
      return fb;
    }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function renderDesks() {
    const grid = document.getElementById("desks-grid");
    const upd = document.getElementById("desks-updated");
    if (!grid) return;
    const idx = await loadJSON("data/desktops/index.json?v=" + CACHE, null);
    const evolve = await loadJSON("data/evolve_log.json?v=" + CACHE, null);
    if (upd) {
      upd.textContent = (idx && idx.updated_pt) ? "· " + idx.updated_pt : "· run agent_desktop/runner.py --boot";
    }
    const agents = (idx && idx.agents) || [];
    grid.innerHTML = "";
    if (!agents.length) {
      grid.innerHTML = '<p class="meta">No desktop frames yet. On PC: <code>python city_runtime/agent_desktop/runner.py --boot</code> then <code>--agent ALL --job hello</code></p>';
    }
    for (const a of agents) {
      const id = a.agent || a.short || "?";
      const vm = await loadJSON("data/desktops/" + id + "/vm_status.json?v=" + CACHE, null);
      const card = document.createElement("div");
      card.className = "desk-card card";
      const img = "data/desktops/" + id + "/latest.png?v=" + CACHE + "&t=" + encodeURIComponent(a.updated_pt || "");
      const vmLine = vm
        ? ("VM: " + (vm.vm || "?") + " · docker: " + (vm.docker || vm.docker_ps || "?"))
        : "VM: not provisioned — gen_agent_vm.py / spawn_agent";
      card.innerHTML =
        '<div class="desk-head"><strong>' + esc(id) + '</strong> <span class="meta">' + esc(a.status || "") + '</span></div>' +
        '<div class="desk-frame"><img src="' + esc(img) + '" alt="' + esc(id) + ' desk" loading="lazy" onerror="this.style.display=\'none\'"/></div>' +
        '<div class="meta">' + esc(vmLine) + '</div>' +
        '<div class="meta">' + esc((a.note || a.job || "").toString().slice(0, 120)) + '</div>' +
        '<pre class="desk-log meta">' + esc(((a.log_tail || []).join("\n") || "—").slice(0, 500)) + '</pre>' +
        '<div class="row-actions">' +
        '<button type="button" class="btn sm desk-work" data-agent="' + esc(id) + '">Work hello</button>' +
        '<button type="button" class="btn ghost sm desk-open" data-agent="' + esc(id) + '">Sheet</button>' +
        '</div>';
      grid.appendChild(card);
    }
    if (evolve && evolve.latest) {
      const ev = document.createElement("div");
      ev.className = "card";
      ev.style.marginTop = "0.85rem";
      ev.innerHTML = "<h4>Self-evolve</h4><pre class=\"out\">" + esc(JSON.stringify({
        updated_pt: evolve.latest.updated_pt,
        top: (evolve.latest.scored || []).slice(0, 3),
        actions: (evolve.latest.actions || []).slice(0, 4),
        champ: evolve.latest.mmm_champ_advisory
      }, null, 2).slice(0, 1200)) + "</pre>";
      grid.appendChild(ev);
    }
    grid.querySelectorAll(".desk-work").forEach((btn) => {
      btn.addEventListener("click", () => {
        const agent = btn.getAttribute("data-agent");
        window.__cityWorkAgent && window.__cityWorkAgent(agent, "hello");
      });
    });
    grid.querySelectorAll(".desk-open").forEach((btn) => {
      btn.addEventListener("click", () => {
        const agent = btn.getAttribute("data-agent");
        const u = ((window.CITY && CITY.state && CITY.state.units) || []).find((x) => x.short === agent);
        if (u && typeof openAgentSheet === "function") {
          document.querySelectorAll(".nav button").forEach((b) => b.classList.remove("active"));
          document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
          const nav = document.querySelector('.nav button[data-panel="panel-agents"]');
          const panel = document.getElementById("panel-agents");
          if (nav) nav.classList.add("active");
          if (panel) panel.classList.add("active");
          openAgentSheet(u);
        }
      });
    });
  }

  function wireDesks() {
    const reload = document.getElementById("desks-reload");
    const how = document.getElementById("desks-how");
    const box = document.getElementById("desks-how-box");
    if (reload) reload.addEventListener("click", () => renderDesks());
    if (how && box) {
      how.addEventListener("click", () => {
        box.hidden = !box.hidden;
        box.textContent =
          "WORKERS vs BRAINS\n" +
          "• DualCortex (Brains) = speech / lore\n" +
          "• Desks + VMs = WORK (Gate E hello / inventory)\n" +
          "• Grok-class Cursor desktops = cloud agent runtime OR heavy VMs on your PC\n\n" +
          "PC commands:\n" +
          "python city_runtime/agent_desktop/runner.py --agent ALL --job hello\n" +
          "python city_runtime/agent_vm/scripts/gen_agent_vm.py --all-core\n" +
          "python city_runtime/agent_vm/scripts/vmctl.py hello --agent SNATCHER\n" +
          "python city_runtime/spawn_agent.py --name \"MONEY FORGE\" --district gamma\n" +
          "python city_runtime/self_evolve.py --once\n" +
          "See city_runtime/agent_vm/START_VMS.md (Docker Desktop / WSL2)\n" +
          "JOB_HALT ON · Gate E hello only · no market execute";
      });
    }
    // refresh when Desks tab opened
    document.querySelectorAll(".nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.panel === "panel-desktops") renderDesks();
      });
    });
  }

  /* —— Spawn (Pages local + intent for PC) —— */
  function wireSpawn() {
    const form = document.getElementById("spawn-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = (document.getElementById("spawn-name") || {}).value || "";
      const district = (document.getElementById("spawn-district") || {}).value || "alpha";
      const role = (document.getElementById("spawn-role") || {}).value || "City worker · Gate E hello / inventory";
      const out = document.getElementById("spawn-out");
      const short = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) || "AGENT";
      const pin = Object.assign({}, DISTRICT_PINS[district] || DISTRICT_PINS.alpha);
      pin.x = Math.min(92, pin.x + Math.floor(Math.random() * 8) - 2);
      pin.y = Math.min(85, pin.y + Math.floor(Math.random() * 6));
      const unit = {
        id: short.toLowerCase().replace(/_/g, "-"),
        name: name.trim() || ("MONEY " + short),
        short: short,
        district: district.charAt(0).toUpperCase() + district.slice(1),
        districts: [district.charAt(0).toUpperCase() + district.slice(1)],
        rank: (district.toUpperCase()) + " · spawned worker",
        status: "active",
        role: role,
        flavor: "Spawned worker · DualCortex=speech · desktop+VM=WORK · JOB_HALT ON",
        notes: "Spawned on Pages — run spawn_agent.py on PC to persist VM/credits",
        pin: pin,
        color: "#9b6bff",
        spawned: true,
        worker: true
      };
      if (!window.CITY) window.CITY = {};
      if (!CITY.state) CITY.state = { units: [] };
      CITY.state.units = (CITY.state.units || []).concat([unit]);
      // localStorage persistence for Pages session
      try {
        const key = "money_city_spawned_v1";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(unit);
        localStorage.setItem(key, JSON.stringify(prev.slice(-40)));
      } catch (err) {}
      if (typeof renderRoster === "function") renderRoster(CITY.state);
      if (typeof renderAgentPins === "function") renderAgentPins(CITY.state);
      if (typeof openAgentSheet === "function") openAgentSheet(unit);
      if (out) {
        out.hidden = false;
        out.textContent =
          "SPAWNED (UI) " + short + " @ " + district + "\n" +
          "Pin on map. Work button = desk job intent.\n" +
          "Persist on PC:\n" +
          "python city_runtime/spawn_agent.py --name \"" + unit.name + "\" --district " + district + " --role \"" + role + "\" --short " + short + "\n" +
          "python city_runtime/agent_vm/scripts/vmctl.py hello --agent " + short + "\n" +
          "DualCortex talks. This worker WORKS.";
      }
      // animate pin toward district
      window.__cityMoveAgent && window.__cityMoveAgent(short, district);
    });
  }

  function mergeSpawnedFromStorage(state) {
    try {
      const prev = JSON.parse(localStorage.getItem("money_city_spawned_v1") || "[]");
      if (!prev.length) return state;
      const shorts = new Set((state.units || []).map((u) => u.short));
      prev.forEach((u) => {
        if (u && u.short && !shorts.has(u.short)) {
          state.units = (state.units || []).concat([u]);
          shorts.add(u.short);
        }
      });
    } catch (e) {}
    return state;
  }

  /* —— Pin movement when working —— */
  function moveAgentPin(short, district) {
    const target = DISTRICT_PINS[(district || "gamma").toLowerCase()] || DISTRICT_PINS.gamma;
    const pins = document.querySelectorAll(".agent-pin");
    pins.forEach((p) => {
      const label = (p.querySelector("span") || {}).textContent || "";
      if (label === short || (p.dataset.name || "").indexOf(short) >= 0) {
        p.classList.add("moving", "lit");
        p.style.transition = "left 0.9s ease, top 0.9s ease, transform 0.3s";
        p.style.left = target.x + "%";
        p.style.top = target.y + "%";
        setTimeout(() => p.classList.remove("moving"), 1000);
      }
    });
    // update unit pin in state
    if (window.CITY && CITY.state && CITY.state.units) {
      CITY.state.units.forEach((u) => {
        if (u.short === short) {
          u.pin = { x: target.x, y: target.y };
          u._taskDistrict = district;
        }
      });
    }
  }

  function workAgent(short, job) {
    job = job || "hello";
    const outHint =
      "WORK INTENT · " + short + " · " + job + "\n" +
      "On PC/box:\n" +
      "python city_runtime/agent_desktop/runner.py --agent " + short + " --job " + job + "\n" +
      "python city_runtime/agent_vm/scripts/vmctl.py hello --agent " + short + "\n" +
      "python city_runtime/dispatch_agent.py --agent " + short + " --job desktop_hello\n" +
      "Then reload Desks tab.\nJOB_HALT ON · Gate E hello only.";
    moveAgentPin(short, "gamma");
    if (window.CITY && CITY.feed) {
      const items = CITY.feed.items || [];
      items.unshift({
        ts: new Date().toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles" }) + " PT",
        unit: short,
        short: short,
        text: "Moving to Gamma · WORK " + job + " (desk/VM)",
        kind: "work",
        live: true
      });
      CITY.feed.items = items.slice(0, 28);
      if (typeof renderActivity === "function") renderActivity(CITY.feed.items);
    }
    const sheetOut = document.getElementById("sheet-out");
    if (sheetOut) {
      sheetOut.hidden = false;
      sheetOut.textContent = outHint;
    }
    // try reload desks data in background
    renderDesks();
    return outHint;
  }

  window.__cityWorkAgent = workAgent;
  window.__cityMoveAgent = moveAgentPin;
  window.__cityRenderDesks = renderDesks;
  window.__cityMergeSpawned = mergeSpawnedFromStorage;

  function bootDesks() {
    wireDesks();
    wireSpawn();
    renderDesks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(bootDesks, 200));
  } else {
    setTimeout(bootDesks, 200);
  }
})();
