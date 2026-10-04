/* MONEY CITY station. Blood street, gold rooms, agents live here. */
(function () {
  const KEY = "money_city_inbox_v1";
  const core = window.MONEY_CORE || { ROOMS: [], acceptJob: function () { return { ok: false, errors: ["core missing"] }; } };
  let active = "street";
  const KINDS = { research: ["brief"], factory: ["draft"], comms: ["draft"], treasury: ["ledger"], publishing: ["schedule"], war: ["pivot"], archives: ["memory"], quarters: ["status"] };
  const SCENES = {
    street: { name: "Blood Street", line: "Wet brick. Gold in the windows. The city is already counting.", crew: "The whole crew walks this block." },
    research: { name: "The Loft", line: "Maps on the glass. SIGNAL is still up. Nothing here is copied.", crew: "SIGNAL keeps the night notes." },
    factory: { name: "The Floor", line: "Presses warm. Drafts on the racks. A person still ships.", crew: "SEED and MMM work the tables." },
    comms: { name: "The Booth", line: "Letters wait. Nobody sends until you say so.", crew: "TRAIL drafts. You approve." },
    treasury: { name: "The Vault", line: "Heavy door. Thin gold light. Every line needs a receipt.", crew: "VAULT does not spend alone." },
    publishing: { name: "The Penthouse", line: "City under the glass. Slots on the wall. Drop does not post.", crew: "MAGNET holds the calendar." },
    war: { name: "The War Room", line: "One table. Dead lanes crossed out. Next lane written in gold.", crew: "SNATCHER calls the cut." },
    archives: { name: "The Stacks", line: "Paper and tape. Nothing leaves. The city remembers.", crew: "MMM files the night." },
    quarters: { name: "The Quarters", line: "Coats on hooks. A glass half full. They live here.", crew: "West Sac crew, home between shifts." }
  };
  function load() { try { const parsed = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; } }
  function save(items) { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 80))); }
  function post(job) {
    const verdict = core.acceptJob(job);
    if (!verdict.ok) return verdict;
    const allowed = KINDS[verdict.job.room] || [];
    if (allowed.length && allowed.indexOf(verdict.job.kind) === -1) return { ok: false, errors: [verdict.job.kind + " does not belong in " + verdict.job.room] };
    const row = verdict.job;
    row.ts = row.ts || new Date().toISOString();
    row.status = row.needs_human ? "waiting on you" : "in the room";
    save([row].concat(load()).slice(0, 80));
    paint();
    document.dispatchEvent(new CustomEvent("money-city:job", { detail: row }));
    return { ok: true, job: row };
  }
  function approve(id) {
    save(load().map(function (job) { if (job.id !== id) return job; return Object.assign({}, job, { status: "approved, not sent", approved_ts: new Date().toISOString() }); }));
    paint();
    return { ok: true, id: id, sent: false };
  }
  function list(room) { const items = load(); return room ? items.filter(function (job) { return job.room === room; }) : items; }
  function sceneArt(id) {
    const files = {
      street: "https://tmpfiles.org/dl/wbAafUYfwH8F/street.jpg",
      research: "https://tmpfiles.org/dl/wtAzfgYLADZz/loft.jpg",
      factory: "https://tmpfiles.org/dl/wqARfwYOAwKe/factory.jpg",
      comms: "https://tmpfiles.org/dl/wBA3fSY6A9la/comms.jpg",
      treasury: "https://tmpfiles.org/dl/wcAvfMY7ANch/vault.jpg",
      publishing: "https://tmpfiles.org/dl/wVALfVY2Aj6j/penthouse.jpg",
      war: "https://tmpfiles.org/dl/weAIfzYCAien/war.jpg",
      archives: "https://tmpfiles.org/dl/wfAnfeYoA1f5/archives.jpg",
      quarters: "https://tmpfiles.org/dl/wFA0f5YKA7gv/quarters.jpg"
    };
    return '<img class="room-photo" alt="" src="' + (files[id] || files.street) + '">';
  }
  function paint() {
    const root = document.getElementById("panel-station");
    if (!root) return;
    if (!root.dataset.city) {
      root.dataset.city = "1";
      root.innerHTML = '<div class="city-live"><p class="city-kicker">Money City · after midnight</p><h2>The station is awake</h2><p class="meta" id="station-counts"></p><div id="station-street" class="station-street"></div><div id="station-stage" class="station-stage"></div><p id="station-err" class="meta"></p></div>';
    }
    const items = load();
    const counts = document.getElementById("station-counts");
    if (counts) counts.textContent = items.length ? items.length + " things moving on the block" : "The street is quiet. The rooms are ready.";
    const street = document.getElementById("station-street");
    street.replaceChildren();
    [{ id: "street", name: "Blood Street" }].concat(core.ROOMS || []).forEach(function (room) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "street-door" + (room.id === active ? " on" : "");
      btn.textContent = room.name;
      btn.addEventListener("click", function () { active = room.id; paint(); });
      street.appendChild(btn);
    });
    const stage = document.getElementById("station-stage");
    const scene = SCENES[active] || SCENES.street;
    stage.className = "station-stage open";
    stage.innerHTML = sceneArt(active);
    const copy = document.createElement("div");
    copy.className = "room-copy";
    const h = document.createElement("h3"); h.textContent = scene.name;
    const p = document.createElement("p"); p.textContent = scene.line;
    const who = document.createElement("p"); who.className = "meta"; who.textContent = scene.crew;
    copy.appendChild(h); copy.appendChild(p); copy.appendChild(who);
    if (active !== "street") {
      const form = document.createElement("form");
      form.className = "station-form";
      const agent = document.createElement("input");
      agent.value = "SIGNAL";
      const text = document.createElement("textarea");
      text.placeholder = "What are they doing in this room?";
      const go = document.createElement("button");
      go.type = "submit";
      go.textContent = "Leave it in the room";
      form.appendChild(agent); form.appendChild(text); form.appendChild(go);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const err = document.getElementById("station-err");
        const result = post({ id: active + "-" + Date.now(), room: active, agent: agent.value || "CITY", kind: (KINDS[active] || ["brief"])[0], text: text.value });
        if (err) err.textContent = result.ok ? "It landed in " + scene.name + "." : result.errors.join("; ");
      });
      copy.appendChild(form);
      const ul = document.createElement("ul");
      list(active).forEach(function (job) {
        const li = document.createElement("li");
        li.className = "station-job";
        li.textContent = job.agent + " · " + job.status + " — " + (job.text || "no note");
        if (job.needs_human && job.status === "waiting on you") {
          const ok = document.createElement("button");
          ok.type = "button";
          ok.textContent = "Approve. Do not send.";
          ok.addEventListener("click", function () { approve(job.id); });
          li.appendChild(ok);
        }
        ul.appendChild(li);
      });
      copy.appendChild(ul);
    }
    stage.appendChild(copy);
  }
  window.MONEY_CITY_BUS = { post: post, load: load, list: list, approve: approve, paint: paint, open: function (room) { active = room || "street"; paint(); } };
  window.__startCityStation = paint;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
