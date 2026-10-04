/* MONEY CITY station bus */
(function () {
  const KEY = "money_city_inbox_v1";
  const core = window.MONEY_CORE || { ROOMS: [], acceptJob: () => ({ ok: false, errors: ["core missing"] }) };
  function load() {
    try { const raw = localStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; }
    catch (e) { return []; }
  }
  function save(items) { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 80))); }
  function paint(items) {
    const list = document.getElementById("station-feed");
    const counts = document.getElementById("station-counts");
    if (!list) return;
    const rows = items || load();
    list.replaceChildren();
    rows.slice(0, 24).forEach((job) => {
      const li = document.createElement("li");
      li.className = "station-job";
      const strong = document.createElement("strong");
      strong.textContent = job.agent + " · " + job.room;
      const span = document.createElement("span");
      span.textContent = job.kind + (job.needs_human ? " · human" : "") + " — " + (job.text || "");
      li.appendChild(strong);
      li.appendChild(document.createTextNode(" "));
      li.appendChild(span);
      list.appendChild(li);
    });
    if (counts) {
      const by = {};
      rows.forEach((j) => { by[j.room] = (by[j.room] || 0) + 1; });
      counts.textContent = (core.ROOMS || []).map((r) => r.id + " " + (by[r.id] || 0)).join("  ·  ");
    }
  }
  function post(job) {
    const verdict = core.acceptJob(job);
    if (!verdict.ok) return verdict;
    const row = verdict.job;
    row.ts = row.ts || new Date().toISOString();
    const items = [row].concat(load()).slice(0, 80);
    save(items);
    paint(items);
    document.dispatchEvent(new CustomEvent("money-city:job", { detail: row }));
    return { ok: true, job: row };
  }
  function wire() {
    const rooms = document.getElementById("station-rooms");
    if (rooms && !rooms.childElementCount) {
      (core.ROOMS || []).forEach((r) => {
        const card = document.createElement("article");
        card.className = "card station-room";
        const h = document.createElement("h3");
        h.textContent = r.name;
        const p = document.createElement("p");
        p.className = "meta";
        p.textContent = r.job;
        card.appendChild(h);
        card.appendChild(p);
        rooms.appendChild(card);
      });
    }
    const form = document.getElementById("station-drop");
    if (form && !form.dataset.wired) {
      form.dataset.wired = "1";
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const err = document.getElementById("station-err");
        let job;
        try { job = JSON.parse(form.elements.job.value); }
        catch (parseErr) { if (err) err.textContent = "Invalid JSON"; return; }
        const result = post(job);
        if (err) err.textContent = result.ok ? "Accepted " + result.job.id : result.errors.join("; ");
      });
    }
    paint(load());
  }
  window.MONEY_CITY_BUS = { post, load, paint };
  window.__startCityStation = wire;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
