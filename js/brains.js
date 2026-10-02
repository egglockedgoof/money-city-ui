/* MONEY CITY Brains — LIVE via :8787 DualCortex; DEMO JSON on Pages when offline */
(function () {
  const BRIDGE = "http://127.0.0.1:8787";
  const DEMO_URL = "data/brains_demo.json";

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

  async function loadDemo() {
    try {
      const res = await fetch(DEMO_URL + "?v=1", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (_) {
      return {
        left: "DEMO Left — Ollama offline.",
        right: "DEMO Right — run city_brains/brains_bridge.py locally.",
        merged: "Ollama offline — run city_brains.\n\n1) ollama serve\n2) python3 brains_bridge.py\n3) Refresh + Send\n\nPages is display-only; bridge stays 127.0.0.1.",
        models: { left: "deepseek-r1:1.5b", right: "qwen2.5:1.5b", merge: "qwen2.5:1.5b" },
      };
    }
  }

  async function showOfflineDemo() {
    const demo = await loadDemo();
    setChip("chip-bridge", "Bridge: OFFLINE (DEMO)", "held");
    setChip("chip-ollama", "Ollama: local-only", "held");
    const m = demo.models || {};
    setChip("chip-left", "Left: " + (m.left || "deepseek-r1:1.5b"), "held");
    setChip("chip-right", "Right: " + (m.right || "qwen2.5:1.5b"), "held");
    setChip("chip-merge", "Merge: " + (m.merge || "qwen2.5:1.5b"), "held");
    setPre("brains-left", demo.left);
    setPre("brains-right", demo.right);
    setPre("brains-merged", demo.merged);
  }

  async function refreshStatus() {
    setErr("");
    try {
      const res = await fetch(BRIDGE + "/status", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
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
    const prompt = (ta && ta.value.trim()) || "Say a short gothic-gold hello to MONEY CITY Year 0.";
    const btn = document.getElementById("brains-send");
    if (btn) { btn.disabled = true; btn.textContent = "Thinking…"; }
    setPre("brains-left", "…");
    setPre("brains-right", "…");
    setPre("brains-merged", "DualCortex running (Left → Right → Merge)…");
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
        if (data.status === "ollama_offline") await showOfflineDemo();
      }
      await refreshStatus();
    } catch (e) {
      setErr("Bridge unreachable — showing DEMO. " + e);
      await showOfflineDemo();
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
        if (btn.dataset.panel === "panel-brains") refreshStatus();
      });
    });
    refreshStatus();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
