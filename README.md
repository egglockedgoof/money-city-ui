# PhantomWay — Real-time team chat for sin's crew. Live at https://egglockedgoof.github.io/money-city-ui/

## Native iOS app (SideStore)

The web app in this repo is wrapped with Capacitor (WKWebView shell: no Safari UI, native keyboard resize, real haptics, home-screen icon).

1. GitHub -> **Actions** -> **iOS IPA (SideStore)** -> **Run workflow** (or push a tag like `app-v1`). Runs on a free macOS runner; no Mac needed.
2. Download the **PhantomWay-ipa** artifact and unzip it.
3. Install `PhantomWay.ipa` with SideStore (or iloader from a PC). Free Apple ID limits still apply: 7-day refresh, 3 apps.
4. The app reaches the backend over the Tailscale door, so Tailscale must be on. Off the tailnet, live features go offline and the app says so.

The web UI is bundled into the IPA. `ios/` is generated in CI and never committed. Locally: `npm ci && npm run build:www`.
