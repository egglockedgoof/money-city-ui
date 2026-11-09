# PhantomWay for Android

A thin native shell around the Face (the PhantomWay web app). No Play Store, no cost.

- Loads the heart from, in order: `http://127.0.0.1:3000/` (the bridge runs on this phone in Termux),
  `http://100.77.206.103:3000/` (Tailscale), `https://phantomway-door.tail0a8095.ts.net/`.
- Cleartext HTTP is allowed ONLY for those two heart addresses (`res/xml/network_security_config.xml`).
- Dark splash with the door, black status/nav bars, back = go back / minimize, no pull-to-refresh,
  keyboard resize, file/picture upload, mic/camera/location prompts for the Face's senses,
  and `window.PhantomNative.notify()` for message notifications while the app is in the background.

## Build

```
export JAVA_HOME=/home/box/android/jdk ANDROID_HOME=/home/box/android/sdk
/home/box/android/gradle-8.7/bin/gradle -p android assembleRelease
```

Release signing reads `keystore.properties` (storeFile, storePassword, keyAlias, keyPassword) from
`/home/box/shared/marrowz/phantomway_android/` or `-PphantomKeystoreProps=...`. It is never committed.
Keep the same key for every update, or Android will refuse to install over the old app.
