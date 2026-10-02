/* MONEY CITY — quiet future accent. LAW stays Year 0. No PREVIEW spam. */
(function () {
  const CACHE = "20261002lean";
  let PREVIEW = null;

  async function load() {
    try {
      const res = await fetch("data/future_preview.json?v=" + CACHE, { cache: "no-store" });
      if (res.ok) PREVIEW = await res.json();
    } catch (e) {
      console.warn("future_preview", e);
    }
    if (!PREVIEW) PREVIEW = { agent_preview: {}, district_preview: {}, future_ticker: [] };
  }

  window.__cityEraId = "y0";
  window.__cityEraFlavor = function (short, u) {
    const ap = (PREVIEW && PREVIEW.agent_preview) || {};
    if (ap[short] && ap[short].flavor) return ap[short].flavor;
    return (u && (u.flavor || u.notes)) || "";
  };
  window.__cityEraRank = function (short, u) {
    return (u && u.rank) || "";
  };
  window.__cityEraRoomLore = function () {
    return "";
  };

  async function start() {
    await load();
    document.body.classList.add("vibe-future");
    // Soft future ticker lines only — live_loop merges them quietly
    const lines = (PREVIEW && PREVIEW.future_ticker) || [];
    window.__cityFutureTickerLines = Array.isArray(lines) ? lines.slice(0, 3) : [];
  }

  window.__startCityEras = start;
  window.__startCityFutureVibe = start;
})();
