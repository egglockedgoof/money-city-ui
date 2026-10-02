/* MONEY CITY — living tick (no Ollama). Year 0 DEMO life on Pages. */
(function () {
  const CACHE = "20261002gate";
  const SHORT_TO_UNIT = {
    SNATCHER: "MONEY SNATCHER 3000",
    MMM: "MONEY MONEY MONEY",
    MAGNET: "MONEY MAGNET",
    SEED: "MONEY SEED",
    TRAIL: "MONEY TRAIL",
    VAULT: "MONEY VAULT",
    SIGNAL: "MONEY SIGNAL",
    CITY: "CITY"
  };

  const FALLBACK = {
    tick_ms: 6500,
    dispatch_every_ticks: 4,
    max_feed: 28,
    statuses: {
      SNATCHER: ["coordinating Year-0 deck"],
      MMM: ["meta-evolver offline"],
      MAGNET: ["close-home PARKED"],
      SEED: ["nursery HELD"],
      TRAIL: ["inventory sharp"],
      VAULT: ["JOB_HALT standing"],
      SIGNAL: ["Beta scout online"]
    },
    beats: [
      { unit: "SNATCHER", short: "SNATCHER", district: "alpha", kind: "status", text: "Year 0 living tick ON" },
      { unit: "VAULT", short: "VAULT", district: "supreme", kind: "halt", text: "JOB_HALT ON · Gate E hello only" },
      { unit: "MMM", short: "MMM", district: "gamma", kind: "thrift", text: "Thrift advisory warm" },
      { unit: "SIGNAL", short: "SIGNAL", district: "beta", kind: "lore", text: "Beta scout pings the skyline" }
    ],
    shift_lines: {}
  };

  let LOOP = FALLBACK;
  let beatIdx = 0;
  let tickCount = 0;
  let feedItems = [];
  let statusIdx = {};
  let districtPulse = {};
  let agentLiveStatus = {};
  let timer = null;
  let shifting = null;

  function nowStamp() {
    try {
      return new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }) + " PT";
    } catch (e) {
      return new Date().toLocaleTimeString() + " PT";
    }
  }

  function unitName(short) {
    return SHORT_TO_UNIT[short] || short;
  }

  function pushFeed(item) {
    const row = {
      ts: item.ts || nowStamp(),
      unit: item.unit || unitName(item.short) || "CITY",
      short: item.short || "",
      text: item.text || "",
      kind: item.kind || "status",
      district: item.district || "",
      live: true
    };
    feedItems.unshift(row);
    const max = LOOP.max_feed || 28;
    if (feedItems.length > max) feedItems = feedItems.slice(0, max);
    if (window.CITY) {
      if (!CITY.feed) CITY.feed = { items: [] };
      CITY.feed.items = feedItems.slice();
      CITY.feed.updated_pt = nowStamp();
    }
    renderLiveFeed();
    updateTicker();
    if (row.short) setAgentStatus(row.short, row.text);
    if (row.district) stampDistrict(row.district, row.short);
  }

  function renderLiveFeed() {
    const list = document.getElementById("activity-list");
    if (!list) return;
    list.innerHTML = "";
    feedItems.forEach((it, i) => {
      const li = document.createElement("li");
      li.className = "feed-item kind-" + (it.kind || "status") + (i === 0 ? " feed-new" : "");
      const strong = document.createElement("strong");
      strong.textContent = it.short || it.unit || "UNIT";
      const span = document.createElement("span");
      span.textContent = it.text || "";
      const time = document.createElement("em");
      time.className = "feed-ts";
      time.textContent = it.ts || "";
      li.appendChild(strong);
      li.appendChild(document.createTextNode(" "));
      li.appendChild(span);
      li.appendChild(time);
      list.appendChild(li);
    });
  }

  function updateTicker() {
    const ticker = document.getElementById("ticker-inner");
    if (!ticker) return;
    const rows = feedItems.length
      ? feedItems
      : [{ short: "CITY", text: "Living tick warming up…" }];
    const live = rows
      .slice(0, 8)
      .map((r) => (r.short || r.unit || "") + ": " + (r.text || ""));
    const fut = (window.__cityFutureTickerLines || []).slice(0, 6);
    const line = live.concat(fut).join("   ···   ");
    ticker.textContent = line + "   ···   " + line + "   ···   ";
    const label = document.querySelector(".ticker-label");
    if (label) {
      label.classList.add("ticker-hot");
      setTimeout(() => label.classList.remove("ticker-hot"), 600);
    }
  }

  function setAgentStatus(short, text) {
    agentLiveStatus[short] = { text: text, ts: nowStamp() };
    document.querySelectorAll('.agent-live-status[data-short="' + short + '"]').forEach((el) => {
      el.textContent = text;
      el.classList.add("status-flash");
      setTimeout(() => el.classList.remove("status-flash"), 700);
    });
    document.querySelectorAll('.agent-card[data-short="' + short + '"] .live-line').forEach((el) => {
      el.textContent = text;
      el.classList.add("status-flash");
      setTimeout(() => el.classList.remove("status-flash"), 700);
    });
    const sheetStatus = document.getElementById("sheet-live-line");
    const sheetShort = document.getElementById("sheet-short");
    if (sheetStatus && sheetShort && sheetShort.textContent === short) {
      sheetStatus.textContent = text;
      sheetStatus.classList.add("status-flash");
      setTimeout(() => sheetStatus.classList.remove("status-flash"), 700);
    }
  }

  function rotateStatuses() {
    const statuses = LOOP.statuses || {};
    Object.keys(statuses).forEach((short) => {
      const arr = statuses[short] || [];
      if (!arr.length) return;
      const i = statusIdx[short] || 0;
      const line = arr[i % arr.length];
      statusIdx[short] = i + 1;
      setAgentStatus(short, line);
    });
  }

  function stampDistrict(id, short) {
    const key = String(id || "").toLowerCase();
    if (!key) return;
    districtPulse[key] = { ts: nowStamp(), by: short || "" };
    const el = document.querySelector('.district[data-id="' + key + '"] .district-pulse');
    if (el) {
      el.textContent = "Last pulse · " + districtPulse[key].ts + (short ? " · " + short : "");
      el.classList.add("pulse-hot");
      setTimeout(() => el.classList.remove("pulse-hot"), 900);
    }
    const card = document.querySelector('.district[data-id="' + key + '"]');
    if (card) {
      card.classList.add("district-pulse-glow");
      setTimeout(() => card.classList.remove("district-pulse-glow"), 900);
    }
  }

  function dispatchAnimation(district, short) {
    const wrap = document.querySelector(".skyline-wrap");
    if (!wrap) return;
    const pins = [...document.querySelectorAll(".agent-pin")];
    let pin = null;
    if (short) {
      pin = pins.find((p) => (p.title || "").toUpperCase().indexOf(short) >= 0)
        || pins.find((p) => (p.textContent || "").toUpperCase().indexOf(short) >= 0);
    }
    if (!pin && district) {
      pin = pins.find((p) => (p.dataset.district || "").indexOf(String(district).toLowerCase()) >= 0);
    }
    if (!pin && pins.length) pin = pins[tickCount % pins.length];
    if (pin) {
      pin.classList.add("dispatching", "lit");
      setTimeout(() => pin.classList.remove("dispatching"), 1400);
      setTimeout(() => pin.classList.remove("lit"), 1800);
    }
    const bolt = document.createElement("div");
    bolt.className = "dispatch-bolt";
    bolt.textContent = "⚡ " + (short || "CITY");
    if (pin) {
      bolt.style.left = pin.style.left;
      bolt.style.top = pin.style.top;
    } else {
      bolt.style.left = "50%";
      bolt.style.top = "30%";
    }
    wrap.appendChild(bolt);
    setTimeout(() => bolt.remove(), 1600);
    if (district) stampDistrict(district, short);
  }

  function nextBeat() {
    const beats = LOOP.beats || [];
    if (!beats.length) return;
    const beat = beats[beatIdx % beats.length];
    beatIdx += 1;
    tickCount += 1;
    const short = beat.short || beat.unit || "CITY";
    pushFeed({
      short: short,
      unit: unitName(short),
      text: beat.text,
      kind: beat.kind || "status",
      district: beat.district || ""
    });
    if (beat.kind === "dispatch" || (tickCount % (LOOP.dispatch_every_ticks || 4) === 0)) {
      dispatchAnimation(beat.district, short);
    }
    if (tickCount % 5 === 0) rotateStatuses();
  }

  function runShift(short) {
    if (shifting) return;
    const lines = (LOOP.shift_lines && LOOP.shift_lines[short]) || [
      "Shift start — simulated offline",
      "JOB_HALT ON · Gate E hello only",
      "No applies · city watch only",
      "Shift end — standing by"
    ];
    shifting = short;
    const btn = document.querySelector('.run-shift-btn[data-short="' + short + '"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Shifting…";
    }
    let i = 0;
    const step = () => {
      if (i >= lines.length) {
        shifting = null;
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Run shift";
        }
        dispatchAnimation(null, short);
        return;
      }
      pushFeed({
        short: short,
        unit: unitName(short),
        text: lines[i],
        kind: "shift",
        district: ""
      });
      setAgentStatus(short, lines[i]);
      if (i === 0 || i === lines.length - 1) dispatchAnimation(null, short);
      i += 1;
      setTimeout(step, 700);
    };
    step();
  }

  function enhanceRosterCards() {
    document.querySelectorAll(".agent-card").forEach((card) => {
      const name = card.dataset.name || "";
      let short = card.dataset.short || "";
      if (!short) {
        const hit = Object.keys(SHORT_TO_UNIT).find((k) => SHORT_TO_UNIT[k] === name);
        short = hit || "";
        if (short) card.dataset.short = short;
      }
      if (!short || short === "JUNIOR") return;
      if (card.querySelector(".live-line")) return;
      const live = document.createElement("div");
      live.className = "meta live-line";
      live.dataset.short = short;
      live.textContent = (agentLiveStatus[short] && agentLiveStatus[short].text) || "standing by…";
      card.appendChild(live);
    });
  }

  function enhanceDistrictCards() {
    document.querySelectorAll(".district").forEach((d) => {
      if (d.querySelector(".district-pulse")) return;
      const pulse = document.createElement("div");
      pulse.className = "district-pulse meta";
      const id = d.dataset.id || "";
      pulse.textContent = districtPulse[id]
        ? "Last pulse · " + districtPulse[id].ts
        : "Last pulse · waiting first tick…";
      d.appendChild(pulse);
    });
  }

  function wireShiftButton() {
    // Hook into openAgentSheet via patching after city loads
    window.__cityRunShift = runShift;
    window.__cityGetLiveStatus = function (short) {
      return (agentLiveStatus[short] && agentLiveStatus[short].text) || "standing by…";
    };
  }

  async function loadLoop() {
    try {
      const res = await fetch("data/live_loop.json?v=" + CACHE, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        LOOP = Object.assign({}, FALLBACK, data);
        if (!LOOP.beats || !LOOP.beats.length) LOOP.beats = FALLBACK.beats;
      }
    } catch (e) {
      console.warn("live_loop load fail", e);
    }
  }

  async function start() {
    await loadLoop();
    // Seed from existing feed if present
    const existing = (window.CITY && CITY.feed && CITY.feed.items) || [];
    if (existing.length) {
      feedItems = existing.map((it) => ({
        ts: it.ts || nowStamp(),
        unit: it.unit || "CITY",
        short: Object.keys(SHORT_TO_UNIT).find((k) => SHORT_TO_UNIT[k] === it.unit) || (it.unit || "").split(" ").pop() || "CITY",
        text: it.text || "",
        kind: "seed",
        live: false
      }));
    }
    enhanceRosterCards();
    enhanceDistrictCards();
    wireShiftButton();
    rotateStatuses();
    pushFeed({
      short: "CITY",
      unit: "CITY",
      text: "Living tick armed · Year 0 DEMO life (no Ollama needed)",
      kind: "lore",
      district: "supreme"
    });
    updateTicker();
    if (timer) clearInterval(timer);
    timer = setInterval(nextBeat, LOOP.tick_ms || 3500);
    // First beat soon so he SEES something
    setTimeout(nextBeat, 900);
    setTimeout(nextBeat, 2000);
    const badge = document.getElementById("live-tick-badge");
    if (badge) badge.textContent = "Living tick ON";
  }

  window.__startCityLiveLoop = start;
  window.__cityRunShift = runShift;
})();
