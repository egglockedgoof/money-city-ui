/* MONEY CITY Brains — LIVE via :8787 DualCortex; DEMO JSON on Pages when offline */
(function () {
  const BRIDGE = "http://127.0.0.1:8787";
  const DEMO_URL = "data/brains_demo.json";

  const DEFAULT_PROMPTS = [
    "Who is the Creator of MONEY CITY?",
    "Name every GOD DOLLAR BOYZ agent and their district.",
    "What are the hard-stops and JOB_HALT?",
    "Summarize Keysean's Oct 2026 job goal (halted).",
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
    const b = window.__CREATOR_BRIEF__;
    if (!b) return prompt;
    const c = b.creator || {};
    const snippet =
      "[City dossier] Creator=" + (c.name || "Keysean") +
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
      const res = await fetch(DEMO_URL + "?v=20261002crew", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (_) {
      return {
        left: "DEMO Left — Ollama offline. Creator = Keysean. JOB_HALT ON.",
        right: "DEMO Right — gothic-gold. Run city_brains/brains_bridge.py locally.",
        merged: "Ollama offline — run city_brains.\n\n1) ollama serve\n2) python3 brains_bridge.py\n3) Refresh + Send\n\nPages is display-only; bridge stays 127.0.0.1. Creator Briefing panel still knows Keysean.",
        models: { left: "deepseek-r1:1.5b", right: "qwen2.5:1.5b", merge: "qwen2.5:1.5b" },
      };
    }
  }

  function demoAnswer(prompt) {
    const p = (prompt || "").toLowerCase();
    const b = window.__CREATOR_BRIEF__;
    if (/creator|keysean|who is/.test(p) && b) {
      const c = b.creator || {};
      return {
        left: "Creator identity locked: " + (c.name || "Keysean Caris") + ", age " + (c.age || 18) + ", West Sac. Sovereignty = Article I.",
        right: "Gothic-gold salute. The city remembers your address, Job Corps Clearfield lane, and Oct mission — parked under halt.",
        merged: (c.name || "Keysean") + " is Creator forever. See Creator / Briefing panel for the sanitized slate. Full private dossier stays offline Pages.",
      };
    }
    if (/crew|boyz|agent|district/.test(p) && b) {
      const names = (b.crew || []).map((x) => x.name + " (" + x.role + ")").join("; ");
      return {
        left: "Roster: " + names,
        right: "Seven permanent implants + vacant Junior Overseer. Map pins glow gold/blood.",
        merged: "GOD DOLLAR BOYZ implanted: " + names,
      };
    }
    if (/halt|hard-stop|safety|ssn|fee/.test(p)) {
      return {
        left: "JOB_HALT ON. Gate E hello only. Hard-stops: no full SSN, bank, fees, crypto. Last-4 = human only.",
        right: "Freeze stands. Destruction of unsafe hustles is creation of a safe city.",
        merged: "Halt holds. Money City build only until Creator says go.",
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
      setErr("Bridge unreachable — DEMO with Creator dossier. " + e);
      await showOfflineDemo(prompt);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Send DualCortex"; }
    }
  }

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
    // wait a tick so city.js can load creator brief
    setTimeout(() => {
      wireQuickPrompts();
      refreshStatus();
    }, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
