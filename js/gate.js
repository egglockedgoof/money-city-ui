(function () {
  const KEY = "money_city_unlocked_v1";
  const cfg = window.MONEY_CITY_GATE || {};

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function showApp() {
    const lock = document.getElementById("city-lock");
    const app = document.getElementById("app");
    if (lock) lock.remove();
    if (app) app.hidden = false;
    document.body.classList.remove("locked");
  }

  function buildLock() {
    document.body.classList.add("locked");
    const app = document.getElementById("app");
    if (app) app.hidden = true;

    const wrap = document.createElement("div");
    wrap.id = "city-lock";
    wrap.innerHTML = `
      <div class="lock-card">
        <div class="lock-brand">MONEY CITY</div>
        <p class="lock-sub">Password required · Creator gothic gate</p>
        <form id="city-lock-form" autocomplete="current-password">
          <label for="city-key">City key</label>
          <input id="city-key" name="password" type="password" required autofocus placeholder="••••••••" />
          <button type="submit">Enter the city</button>
          <p id="city-lock-err" class="lock-err" hidden>Wrong key. Try again.</p>
          <p class="lock-hint">${cfg.hint || ""}</p>
        </form>
      </div>`;
    document.body.prepend(wrap);

    document.getElementById("city-lock-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("city-key");
      const err = document.getElementById("city-lock-err");
      const got = await sha256Hex(input.value);
      if (got === cfg.hash) {
        sessionStorage.setItem(KEY, "1");
        showApp();
      } else {
        err.hidden = false;
        input.value = "";
        input.focus();
      }
    });
  }

  if (sessionStorage.getItem(KEY) === "1") {
    showApp();
  } else {
    buildLock();
  }
})();
