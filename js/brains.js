/* MONEY CITY Brains — DEMO on Pages (brains_demo.json) + LIVE when :8787 up */
(function () {
  const BRIDGE = "http://127.0.0.1:8787";
  let demoPack = null;
  let live = false;

  function setChip(id, text, cls) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = "sys-chip " + (cls || "held");
  }

  function setPre(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || "—";
  }

  function setErr(msg) {
    const el = document.getElementById("brains-err");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function setModeBadge(mode) {
    const b = document.getElementById("brains-mode-badge");
    if (!b) return;
    b.textContent = "Brains: " + mode;
    b.className = "badge " + (mode === "LIVE" ? "badge-gate" : "badge-creator");
  }

  function pickDemo(prompt) {
    const p = (prompt || "").toLowerCase();
    const pack = demoPack || {};
    const pools = [].concat(pack.greetings || [], pack.topics || []);
    for (let i = 0; i < pools.length; i++) {
      const t = pools[i];
      const keys = t.match || [];
      if (keys.some((k) => p.includes(String(k).toLowerCase()))) return t;
    }
    return pack.fallback || {
      left: "LEFT · demo offline pack missing",
      right: "RIGHT · demo offline pack missing",
      merged: "MERGE · load data/brains_demo.json",
    };
  }

  function typeInto(id, text, step) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    let i = 0;
    const s = text || "";
    function tick() {
      i = Math.min(s.length, i + (step || 3));
      el.textContent = s.slice(0, i);
      if (i < s.length) requestAnimationFrame(tick);
    }
    tick();
  }

  async function loadDemo() {
    try {
      const res = await fetch("data/brains_demo.json?v=20261002adv", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      demoPack = await res.json();
    } catch (e) {
      demoPack = {
        fallback: {
          left: "LEFT · demo pack failed to load",
          right: "RIGHT · " + e,
          merged: "MERGE · still DEMO; fix brains_demo.json",
        },
      };
    }
  }

  function renderQuick() {
    const box = document.getElementById("quick-prompts");
    if (!box) return;
    const prompts = [
      ["Hello city", "hello money city"],
      ["Districts", "tell me about the districts"],
      ["Agents", "who's on the agent roster"],
      ["Thrift", "how does thrift scoring work"],
      ["Halt", "is job halt still on"],
      ["Actions", "what can the city do"],
      ["Lore", "destruction is a form of creation"],
    ];
    box.innerHTML = "";
    prompts.forEach(([label, text]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "quick-btn";
      b.textContent = label;
      b.addEventListener("click", () => {
        const ta = document.getElementById("brains-prompt");
        if (ta) ta.value = text;
        sendPrompt();
      });
      box.appendChild(b);
    });
  }

  async function refreshStatus() {
    setErr("");
    try {
      const res = await fetch(BRIDGE + "/status", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      live = true;
      setChip("chip-mode", "Mode: LIVE", "pass");
      setModeBadge("LIVE");
      setChip("chip-bridge", "Bridge: LIVE :" + (data.bind || "8787").split(":").pop(), "pass");
      const o = data.ollama || {};
      if (o.ok) setChip("chip-ollama", "Ollama: UP (" + (o.models || []).length + " models)", "pass");
      else setChip("chip-ollama", "Ollama: DOWN", "held");
      const m = data.models || {};
      setChip("chip-left", "Left: " + (m.left || "?"), o.ok ? "ready" : "held");
      setChip("chip-right", "Right: " + (m.right || "?"), o.ok ? "ready" : "held");
      setChip("chip-merge", "Merge: " + (m.merge || "?"), o.ok ? "ready" : "held");
      return data;
    } catch (e) {
      live = false;
      setChip("chip-mode", "Mode: DEMO (Pages)", "ready");
      setModeBadge("DEMO");
      setChip("chip-bridge", "Bridge: OFFLINE", "held");
      setChip("chip-ollama", "Ollama: local only", "held");
      setChip("chip-left", "Left: DeepSeek (scripted)", "ready");
      setChip("chip-right", "Right: Qwen (scripted)", "ready");
      setChip("chip-merge", "Merge: city voice", "ready");
      return null;
    }
  }

  async function sendPrompt() {
    setErr("");
    const ta = document.getElementById("brains-prompt");
    const prompt = (ta && ta.value.trim()) || "hello money city";
    const btn = document.getElementById("brains-send");
    if (btn) {
      btn.disabled = true;
      btn.textContent = live ? "Thinking…" : "Demo…";
    }
    setPre("brains-left", "…");
    setPre("brains-right", "…");
    setPre("brains-merged", live ? "DualCortex live…" : "DualCortex DEMO…");

    if (!live) {
      await loadDemo();
      const hit = pickDemo(prompt);
      setTimeout(() => typeInto("brains-left", hit.left, 4), 50);
      setTimeout(() => typeInto("brains-right", hit.right, 4), 200);
      setTimeout(() => typeInto("brains-merged", hit.merged, 3), 350);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send DualCortex";
      }
      return;
    }

    try {
      const res = await fetch(BRIDGE + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setPre("brains-left", data.left || "—");
      setPre("brains-right", data.right || "—");
      setPre("brains-merged", data.merged || "—");
      if (!data.ok) {
        setErr(data.error || data.status || "DualCortex not ok");
        if (data.status === "ollama_offline") {
          live = false;
          await sendPrompt(); // fall back to demo once
          return;
        }
      }
      await refreshStatus();
    } catch (e) {
      setErr("Bridge unreachable — switching to DEMO. " + e);
      live = false;
      await refreshStatus();
      const hit = pickDemo(prompt);
      typeInto("brains-left", hit.left, 4);
      typeInto("brains-right", hit.right, 4);
      typeInto("brains-merged", hit.merged, 3);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send DualCortex";
      }
    }
  }

  async function wire() {
    await loadDemo();
    renderQuick();
    const send = document.getElementById("brains-send");
    const refresh = document.getElementById("brains-refresh");
    if (send) send.addEventListener("click", sendPrompt);
    if (refresh) refresh.addEventListener("click", refreshStatus);
    document.querySelectorAll(".nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.panel === "panel-brains") refreshStatus();
      });
    });
    await refreshStatus();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
