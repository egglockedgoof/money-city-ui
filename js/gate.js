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
      <div class="gate-stage" aria-hidden="true">
        <div class="gate-bg gate-clouds"></div>
        <div class="gate-bg gate-sea"></div>
        <div class="gate-vignette"></div>
        <img class="gate-piece gate-skull" src="assets/gate/hooded_skull.jpg" alt="" />
        <img class="gate-piece gate-void" src="assets/gate/void_eyes.jpg" alt="" />
        <img class="gate-piece gate-lily" src="assets/gate/lily_crosshair.jpg" alt="" />
        <img class="gate-piece gate-claw" src="assets/gate/claw.jpg" alt="" />
        <div class="gate-grain"></div>
      </div>
      <div class="lock-card">
        <div class="lock-brand">MONEY CITY</div>
        <form id="city-lock-form" autocomplete="current-password">
          <input id="city-key" name="password" type="password" required autofocus placeholder="Password" aria-label="Password" />
          <button type="submit">Enter</button>
          <p id="city-lock-err" class="lock-err" hidden>Wrong key</p>
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
