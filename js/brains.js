/* MONEY CITY Brains — LIVE via :8787 DualCortex; DEMO JSON on Pages when offline */
(function () {
  const BRIDGE = "http://127.0.0.1:8787";
  const DEMO_URL = "data/brains_demo.json";
  const CACHE = "20261002gate";

  const DEFAULT_PROMPTS = [
    "Who is the Creator of MONEY CITY?",
    "Name every GOD DOLLAR BOYZ agent and their district.",
    "What are the hard-stops and JOB_HALT?",
    "Summarize the Creator Oct 2026 job goal (halted).",
    "What is DualCortex and how do brains go LIVE?",
  ];

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
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }
  function setMode(live) {
    const badge = document.getElementById("brains-mode-badge");
    const chip = document.getElementById("chip-mode");
    if (badge) badge.textContent = live ? "Brains: LIVE" : "Brains: DEMO";
    if (chip) {
      chip.textContent = live ? "Mode: LIVE" : "Mode: DEMO";
      chip.className = "sys-chip " + (live ? "pass" : "held");
    }
  }

  function dossierContext(prompt) {
    const ctx = window.__CITY_BRAINS_CONTEXT__;
    if (ctx) return ctx + " User: " + prompt;
    const b = window.__CREATOR_BRIEF__;
    if (!b) return prompt;
    const c = b.creator || {};
    const snippet =
      "[City dossier · no contact PII] Creator=" + (c.title || "Creator") +
      "; region=" + (c.region || "West Sacramento / greater Sacramento CA") +
      "; halt=" + !!(b.safety && b.safety.job_halt) +
      "; crew=" + ((b.crew || []).map((x) => x.name).join(", ") || "GOD DOLLAR BOYZ") +
      ". ";
    return snippet + prompt;
  }

  function wireQuickPrompts() {
    const box = document.getElementById("quick-prompts");
    if (!box) return;
    const fromBrief = (window.__CREATOR_BRIEF__ && window.__CREATOR_BRIEF__.brains_prompts) || [];
    const prompts = fromBrief.length ? fromBrief : DEFAULT_PROMPTS;
    box.innerHTML = "";
    prompts.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-btn";
      btn.textContent = p.length > 42 ? p.slice(0, 40) + "…" : p;
      btn.title = p;
      btn.addEventListener("click", () => {
        const ta = document.getElementById("brains-prompt");
        if (ta) ta.value = p;
        sendPrompt();
      });
      box.appendChild(btn);
    });
  }

  async function loadDemo() {
    try {
      const res = await fetch(DEMO_URL + "?v=" + CACHE, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (_) {
      return {
        left: "DEMO Left — Ollama offline. Creator forever. JOB_HALT ON. Region West Sac / greater Sac.",
        right: "DEMO Right — Run city_brains/brains_bridge.py locally for LIVE DualCortex.",
        merged: "Ollama offline — DEMO mode.\n\n1) ollama serve\n2) python3 brains_bridge.py\n3) Refresh + Send\n\nCreator memory lives in Brains (no Creator tab). JOB_HALT ON · Gate E hello only.",
        models: { left: "deepseek-r1:1.5b", right: "qwen2.5:1.5b", merge: "qwen2.5:1.5b" },
      };
    }
  }

  function demoAnswer(prompt) {
    const p = (prompt || "").toLowerCase();
    const b = window.__CREATOR_BRIEF__;
    const c = (b && b.creator) || {};
    const m = (b && b.mission_oct_2026) || {};
    const s = (b && b.safety) || {};
    const d = (b && b.money_city) || {};
    const bg = (b && b.background) || {};

    if (/you are money |brief|in-character|status held|status active/.test(p)) {
      return {
        left: "Agent brief acknowledged. JOB_HALT ON. Gate E hello only. No applies. Standing watch on assigned district.",
        right: "Gothic-gold salute, Creator. Your agent stands ready — city-build only until you unhalt.",
        merged: "Brief received. Lane stays offline-safe. Destruction of unsafe hustles is creation of a safer city.",
      };
    }
    if (/creator|who is|who owns/.test(p)) {
      return {
        left:
          "Creator = forever owner of MONEY CITY. Title locked as Creator. Region: " +
          (c.region || "West Sacramento / greater Sacramento CA") +
          ". Background: " + (bg.job_corps || "Job Corps Clearfield Industrial Maintenance") +
          ". Contact PII is private (box dossier only).",
        right: "Gothic-gold salute. The city remembers the mission, the halt, and the crew — never public phone/email/address.",
        merged:
          (c.title || "Creator") + " is Creator forever. Mission parked under JOB_HALT. Doctrine: “" +
          (d.doctrine_line || "Destruction is a form of CREATION") +
          "”. Ask the brains — no separate Creator tab.",
      };
    }
    if (/crew|boyz|agent|district/.test(p)) {
      const names = (b && b.crew || []).map((x) => x.name + " (" + x.role + ")").join("; ");
      return {
        left: "Roster: " + (names || "SNATCHER, MMM, MAGNET, SEED, TRAIL, VAULT, SIGNAL"),
        right: "Seven permanent implants + vacant Junior Overseer. Map pins glow gold/blood. Agents tab has detail sheets.",
        merged: "GOD DOLLAR BOYZ implanted: " + (names || "full crew on Agents tab"),
      };
    }
    if (/halt|hard-stop|safety|ssn|fee|bank/.test(p)) {
      return {
        left: "JOB_HALT " + (s.job_halt !== false ? "ON" : "OFF") + ". Gate E: " + (s.gate_e || "hello only") + ". Hard-stops: no full SSN, bank, fees, crypto. Last-4 = human only.",
        right: "Freeze stands. Destruction of unsafe hustles is creation of a safe city.",
        merged: "Halt holds. Money City build only until Creator says go.",
      };
    }
    if (/mission|job goal|oct 2026|\$16|plant|grounds/.test(p)) {
      return {
        left:
          "Oct mission (halted): " + (m.pay || "$16–18/hr") + ", " + (m.hours || "25–40 hrs") +
          ", areas " + ((m.areas || []).join(", ") || "West Sac / Sac region") +
          ", priority " + (m.priority || "plant/grounds") +
          ", avoid " + ((m.avoid || []).join(", ") || "sales/front desk/restaurant") + ".",
        right: "Apply lanes PARKED. When Creator unhalts, plant/grounds first. SEED nursery packs stay HELD until go.",
        merged: "Mission status: " + (m.status || "PARKED under JOB_HALT") + ". City build first.",
      };
    }
    if (/dualcortex|brains|ollama|live|bridge/.test(p)) {
      return {
        left: "DualCortex = Left DeepSeek + Right Qwen + Merge. Pages = DEMO. LIVE needs bridge 127.0.0.1:8787 + Ollama.",
        right: "PC path: ollama serve → brains_bridge.py → refresh Brains tab. Creator memory already injected here.",
        merged: "DEMO works offline. LIVE when your PC hosts the bridge. See PC_TODAY.md.",
      };
    }
    return null;
  }

  async function showOfflineDemo(prompt) {
    const demo = await loadDemo();
    setMode(false);
    setChip("chip-bridge", "Bridge: OFFLINE (DEMO)", "held");
    setChip("chip-ollama", "Ollama: local-only", "held");
    const m = demo.models || {};
    setChip("chip-left", "Left: " + (m.left || "deepseek-r1:1.5b"), "held");
    setChip("chip-right", "Right: " + (m.right || "qwen2.5:1.5b"), "held");
    setChip("chip-merge", "Merge: " + (m.merge || "qwen2.5:1.5b"), "held");
    const smart = prompt ? demoAnswer(prompt) : null;
    setPre("brains-left", (smart && smart.left) || demo.left);
    setPre("brains-right", (smart && smart.right) || demo.right);
    setPre("brains-merged", (smart && smart.merged) || demo.merged);
  }

  async function refreshStatus() {
    setErr("");
    try {
      const res = await fetch(BRIDGE + "/status", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setMode(true);
      setChip("chip-bridge", "Bridge: LIVE :" + String(data.bind || "8787").split(":").pop(), "pass");
      const o = data.ollama || {};
      setChip("chip-ollama", o.ok ? ("Ollama: UP (" + (o.models || []).length + " models)") : "Ollama: DOWN", o.ok ? "pass" : "held");
      const m = data.models || {};
      setChip("chip-left", "Left: " + (m.left || "?"), o.ok ? "ready" : "held");
      setChip("chip-right", "Right: " + (m.right || "?"), o.ok ? "ready" : "held");
      setChip("chip-merge", "Merge: " + (m.merge || "?"), o.ok ? "ready" : "held");
      return data;
    } catch (e) {
      await showOfflineDemo();
      return null;
    }
  }

  async function sendPrompt() {
    setErr("");
    const ta = document.getElementById("brains-prompt");
    const prompt = (ta && ta.value.trim()) || "Who is the Creator of MONEY CITY?";
    const btn = document.getElementById("brains-send");
    if (btn) { btn.disabled = true; btn.textContent = "Thinking…"; }
    setPre("brains-left", "…");
    setPre("brains-right", "…");
    setPre("brains-merged", "DualCortex running (Left → Right → Merge)…");
    try {
      const res = await fetch(BRIDGE + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: dossierContext(prompt) }),
      });
      const data = await res.json();
      setPre("brains-left", data.left || "—");
      setPre("brains-right", data.right || "—");
      setPre("brains-merged", data.merged || "—");
      if (!data.ok) {
        setErr(data.error || data.status || "DualCortex not ok");
        if (data.status === "ollama_offline") await showOfflineDemo(prompt);
      } else {
        setMode(true);
      }
      await refreshStatus();
    } catch (e) {
      setErr("Bridge unreachable — DEMO with Creator city memory. " + e);
      await showOfflineDemo(prompt);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Send DualCortex"; }
    }
  }

  window.__brainsSend = sendPrompt;

  function wire() {
    const send = document.getElementById("brains-send");
    const refresh = document.getElementById("brains-refresh");
    if (send) send.addEventListener("click", sendPrompt);
    if (refresh) refresh.addEventListener("click", refreshStatus);
    document.querySelectorAll(".nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.panel === "panel-brains") {
          wireQuickPrompts();
          refreshStatus();
        }
      });
    });
    setTimeout(() => {
      wireQuickPrompts();
      refreshStatus();
    }, 450);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
