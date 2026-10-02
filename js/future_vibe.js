/* MONEY CITY — far-future gothic megacity UI vibe (PREVIEW fantasy).
   LAW stays Year 0 · JOB_HALT · Gate E hello only. No years claimed passed. */
(function () {
  const CACHE = "20261002alive";
  let PREVIEW = null;

  async function load() {
    try {
      const res = await fetch("data/future_preview.json?v=" + CACHE, { cache: "no-store" });
      if (res.ok) PREVIEW = await res.json();
    } catch (e) {
      console.warn("future_preview", e);
    }
    if (!PREVIEW) {
      PREVIEW = {
        law_banner: "LAW = Year 0 · JOB_HALT ON · Gate E hello only · PREVIEW / NOT LIVE LAW",
        disclaimer: "Visual PREVIEW only. Law stays Year 0.",
        agent_preview: {},
        district_preview: {},
        future_ticker: ["PREVIEW · gothic megacity dream · law Year 0"]
      };
    }
  }

  function applyBanner() {
    const el = document.getElementById("law-year-banner");
    if (el) el.textContent = PREVIEW.law_banner || "";
    const disc = document.getElementById("preview-disclaimer");
    if (disc) disc.textContent = PREVIEW.disclaimer || "";
    document.body.classList.add("vibe-future");
    const badge = document.getElementById("era-feel-badge");
    if (badge) badge.textContent = "UI: future PREVIEW";
  }

  function densifySkyline() {
    const svg = document.querySelector(".skyline-wrap svg");
    if (!svg || svg.dataset.densified === "1") return;
    svg.dataset.densified = "1";
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");
    g.setAttribute("class", "future-fill");
    g.setAttribute("opacity", "0.85");
    // Extra towers between existing ones — denser megacity
    const towers = [
      [55, 140, 22, 100], [78, 125, 18, 115], [185, 100, 20, 140],
      [280, 85, 28, 155], [355, 60, 24, 180], [530, 95, 30, 145],
      [690, 70, 26, 170], [760, 90, 20, 150], [900, 100, 32, 140],
      [130, 70, 16, 170], [610, 55, 22, 185], [440, 50, 18, 50]
    ];
    towers.forEach(([x, y, w, h], i) => {
      const r = document.createElementNS(ns, "rect");
      r.setAttribute("x", x);
      r.setAttribute("y", y);
      r.setAttribute("width", w);
      r.setAttribute("height", h);
      r.setAttribute("fill", i % 3 === 0 ? "#3a1014" : "#22080c");
      r.setAttribute("stroke", i % 2 ? "#d4a017" : "#8b151c");
      r.setAttribute("stroke-width", "0.8");
      r.setAttribute("opacity", "0.9");
      g.appendChild(r);
      // windows
      for (let wy = y + 12; wy < y + h - 20; wy += 16) {
        const win = document.createElementNS(ns, "rect");
        win.setAttribute("x", x + 4);
        win.setAttribute("y", wy);
        win.setAttribute("width", "4");
        win.setAttribute("height", "5");
        win.setAttribute("fill", "#f0d78c");
        win.setAttribute("opacity", String(0.35 + (i % 5) * 0.1));
        win.setAttribute("class", "window-blink");
        g.appendChild(win);
      }
    });
    // Flying light trails
    const trail = document.createElementNS(ns, "path");
    trail.setAttribute("d", "M40 50 Q240 30 480 55 T920 40");
    trail.setAttribute("fill", "none");
    trail.setAttribute("stroke", "#f0d78c");
    trail.setAttribute("stroke-width", "1.2");
    trail.setAttribute("opacity", "0.45");
    trail.setAttribute("class", "sky-trail");
    g.appendChild(trail);
    const bg = svg.querySelector("rect");
    if (bg && bg.nextSibling) svg.insertBefore(g, bg.nextSibling);
    else svg.appendChild(g);

    // Preview district cards (epsilon/zeta) if grid exists
    const map = document.getElementById("map-grid");
    const extras = PREVIEW.extra_skyline_districts || [];
    if (map && extras.length) {
      extras.forEach((d) => {
        if (map.querySelector('.district[data-id="' + d.id + '"]')) return;
        const el = document.createElement("article");
        el.className = "district district-preview";
        el.dataset.id = d.id;
        el.innerHTML =
          '<div class="pin"></div><h3></h3><p></p>' +
          '<div class="district-pulse meta">PREVIEW district · not Year 0 charter</div>' +
          '<div class="preview-tag">PREVIEW / NOT LIVE LAW</div>' +
          '<span class="district-cta">Peek room →</span>';
        el.querySelector("h3").textContent = d.name;
        el.querySelector("p").textContent = d.tag || "";
        el.addEventListener("click", () => {
          const panel = document.getElementById("room-panel");
          if (!panel) return;
          panel.hidden = false;
          document.getElementById("room-title").textContent = d.name + " · PREVIEW Room";
          document.getElementById("room-lore").textContent =
            (d.lore || "") + "\n\nLAW Year 0: this district is fantasy UI only — not chartered, not Gate E expand.";
          document.getElementById("room-agents").innerHTML =
            '<span class="meta">No Year 0 agents chartered here.</span>';
          const actions = document.getElementById("room-actions");
          actions.innerHTML = "";
          const b = document.createElement("button");
          b.type = "button";
          b.className = "brains-btn secondary";
          b.textContent = "Acknowledge PREVIEW";
          b.addEventListener("click", () => {
            const out = document.getElementById("room-output");
            out.hidden = false;
            out.textContent = "PREVIEW / NOT LIVE LAW\nJOB_HALT ON · Gate E hello only\nNo years claimed passed.";
          });
          actions.appendChild(b);
          panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        map.appendChild(el);
      });
    }
  }

  function stampDistrictPreview() {
    const dp = PREVIEW.district_preview || {};
    Object.keys(dp).forEach((id) => {
      const card = document.querySelector('.district[data-id="' + id + '"]');
      if (!card) return;
      let era = card.querySelector(".district-era");
      if (!era) {
        era = document.createElement("div");
        era.className = "district-era meta";
        card.appendChild(era);
      }
      era.hidden = false;
      era.textContent = dp[id];
      if (!card.querySelector(".preview-tag")) {
        const tag = document.createElement("div");
        tag.className = "preview-tag";
        tag.textContent = "PREVIEW flavor";
        card.appendChild(tag);
      }
    });
  }

  window.__cityEraId = "y0-law-future-ui";
  window.__cityEraFlavor = function (short, u) {
    const ap = (PREVIEW && PREVIEW.agent_preview) || {};
    if (ap[short] && ap[short].flavor) return ap[short].flavor;
    return (u && (u.flavor || u.notes)) || "";
  };
  window.__cityEraRank = function (short, u) {
    const ap = (PREVIEW && PREVIEW.agent_preview) || {};
    if (ap[short] && ap[short].title) return ap[short].title;
    return (u && u.rank) || "";
  };
  window.__cityEraRoomLore = function (id) {
    const dp = (PREVIEW && PREVIEW.district_preview) || {};
    const line = dp[id];
    if (!line) return "LAW Year 0 stands. UI may show PREVIEW build-out only.";
    return line + "\n(PREVIEW / NOT LIVE LAW — Gate E still hello only)";
  };

  function injectFutureTicker() {
    const lines = (PREVIEW && PREVIEW.future_ticker) || [];
    if (!lines.length) return;
    // Expose to live_loop if present
    window.__cityFutureTickerLines = lines;
    const ticker = document.getElementById("ticker-inner");
    if (ticker && (!ticker.textContent || ticker.textContent.indexOf("Loading") >= 0)) {
      const doubled = lines.join("   ···   ");
      ticker.textContent = doubled + "   ···   " + doubled + "   ···   ";
    }
  }

  function upgradeAgentCards() {
    const ap = (PREVIEW && PREVIEW.agent_preview) || {};
    document.querySelectorAll(".agent-card").forEach((card) => {
      const short = card.dataset.short || "";
      if (!ap[short]) return;
      let prev = card.querySelector(".preview-rank");
      if (!prev) {
        prev = document.createElement("div");
        prev.className = "meta preview-rank";
        card.appendChild(prev);
      }
      prev.textContent = ap[short].title;
    });
  }

  async function start() {
    await load();
    applyBanner();
    densifySkyline();
    stampDistrictPreview();
    injectFutureTicker();
    upgradeAgentCards();
    // Re-apply after roster/map settle
    setTimeout(() => {
      densifySkyline();
      stampDistrictPreview();
      upgradeAgentCards();
    }, 400);
  }

  // Prefer future vibe start; eras alias for city.js boot hook
  window.__startCityEras = start;
  window.__startCityFutureVibe = start;
})();
