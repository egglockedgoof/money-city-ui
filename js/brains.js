/* MONEY CITY Brains tab — talks to localhost bridge :8787 (Ollama DualCortex).
   Pages host has no bridge; UI falls back to offline DEMO message. */
(function () {
  const BRIDGE = "http://127.0.0.1:8787";
  const DEMO_OFFLINE =
    "Ollama offline — run city_brains.\n\n" +
    "On the box:\n" +
    "  1) ollama serve\n" +
    "  2) cd city_brains && python3 brains_bridge.py\n" +
    "  3) Refresh status, then Send.\n\n" +
    "GitHub Pages is display-only; the bridge stays local (127.0.0.1).";

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

  async function refreshStatus() {
    setErr("");
    try {
      const res = await fetch(BRIDGE + "/status", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setChip("chip-bridge", "Bridge: LIVE :" + (data.bind || "8787").split(":").pop(), "pass");
      const o = data.ollama || {};
      if (o.ok) {
        setChip("chip-ollama", "Ollama: UP (" + (o.models || []).length + " models)", "pass");
      } else {
        setChip("chip-ollama", "Ollama: DOWN", "held");
      }
      const m = data.models || {};
      setChip("chip-left", "Left: " + (m.left || "?"), o.ok ? "ready" : "held");
      setChip("chip-right", "Right: " + (m.right || "?"), o.ok ? "ready" : "held");
      setChip("chip-merge", "Merge: " + (m.merge || "?"), o.ok ? "ready" : "held");
      return data;
    } catch (e) {
      setChip("chip-bridge", "Bridge: OFFLINE", "held");
      setChip("chip-ollama", "Ollama: unknown", "held");
      setChip("chip-left", "Left: deepseek-r1:1.5b", "held");
      setChip("chip-right", "Right: qwen2.5:1.5b", "held");
      setChip("chip-merge", "Merge: qwen2.5:1.5b", "held");
      setPre("brains-merged", DEMO_OFFLINE);
      return null;
    }
  }

  async function sendPrompt() {
    setErr("");
    const ta = document.getElementById("brains-prompt");
    const prompt = (ta && ta.value.trim()) || "Say a short gothic-gold hello to MONEY CITY Year 0.";
    const btn = document.getElementById("brains-send");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Thinking…";
    }
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
        if (data.status === "ollama_offline") setPre("brains-merged", DEMO_OFFLINE);
      }
      await refreshStatus();
    } catch (e) {
      setErr("Bridge unreachable — " + e);
      setPre("brains-left", "—");
      setPre("brains-right", "—");
      setPre("brains-merged", DEMO_OFFLINE);
      await refreshStatus();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send DualCortex";
      }
    }
  }

  function wire() {
    const send = document.getElementById("brains-send");
    const refresh = document.getElementById("brains-refresh");
    if (send) send.addEventListener("click", sendPrompt);
    if (refresh) refresh.addEventListener("click", refreshStatus);
    // Refresh when Brains tab opens
    document.querySelectorAll(".nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.panel === "panel-brains") refreshStatus();
      });
    });
    refreshStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
