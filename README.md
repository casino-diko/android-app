# Diko phone app

The Android and iOS app for the Diko casino, built with Capacitor 8. The app
is a full-screen shell around the player site: it opens the site's phone
pages, so sign-in, the lobby, the live video, bets and balances are the
same as in a phone browser. Everything goes through the player site (the
`web` service) and the socket-server, which share the casino's database and
game servers.

```
phone app ──> player site (:3000) ──> MongoDB  <── game-server
          └─> socket-server (live rounds)       <── Redis
          └─> video (HLS)
```

- App ID `com.casinodiko.app`, name **Diko**, Android 7 (API 24) and up.
- The app adds `DikoApp/1.0` to the browser's user agent; the games use it
  to skip the "play in full screen?" prompt.
- The app runs in landscape only (either way round): the tables are
  landscape, and the lobby fits it.
- When the site can't be reached, the app shows `www/offline.html` with a
  *Try again* button.

## What you need

| | |
|---|---|
| Node | 22 |
| Android | JDK 21, Android SDK (command-line tools are enough: `platform-tools`, `platforms;android-36`, `build-tools;35.0.0`) |
| iOS | a Mac with Xcode 16+ and CocoaPods |

Point Gradle at the SDK once, either way:

```sh
export ANDROID_HOME=$HOME/Android/Sdk                         # in ~/.bashrc
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties   # or this
```

## The site address

The app loads the address in `DIKO_SITE_URL` (default
`http://localhost:3000`). It's written into the app when you sync or build,
so set it on every build:

```sh
DIKO_SITE_URL=https://play.example.com npm run android:apk
```

`localhost` on a phone is the phone itself. To test on a real phone on the
same Wi-Fi as the PC, use the PC's LAN address (`hostname -I`), for example
`192.168.1.20`, in **three** places, because the phone loads each of them
directly:

1. the app: `DIKO_SITE_URL=http://192.168.1.20:3000`
2. `tablegames/.env`: `PUBLIC_SOCKET_URL=http://192.168.1.20:8000`
3. `tablegames/.env`: `HLS_URL_TEMPLATE=http://192.168.1.20:8080/hls/{app}-{table}.m3u8`

Then `docker compose up -d` in `tablegames` to apply the `.env`. Plain
`http://` addresses are allowed only for this kind of testing; a release
build should use an `https://` site.

## Build

```sh
npm install
npm run icons          # icons and splash screens from the brand (needs the site running)
npm run android:apk    # android/app/build/outputs/apk/debug/app-debug.apk
```

`npm run icons` downloads the brand icon the admin's Branding page sets
from `DIKO_SITE_URL` and draws every Android and iOS launcher icon and
splash screen from it. Run it again whenever the brand icon changes.

Install the APK on a phone with a USB cable (developer options → USB
debugging on):

```sh
~/Android/Sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

or copy the file to the phone and open it (allow installing from that app).

### Release (Play Store)

A store build has to be signed with your own upload key. Keep the key and
its passwords out of this repo:

```sh
keytool -genkey -v -keystore ~/diko-upload.jks -alias diko -keyalg RSA -keysize 2048 -validity 10000
cd android && ./gradlew bundleRelease   # after adding a signingConfig for the key
```

### iOS

On a Mac:

```sh
npm install
DIKO_SITE_URL=https://play.example.com npx cap sync ios
npm run ios:open        # opens Xcode: pick your team, then Product → Archive
```

## Files

| | |
|---|---|
| `capacitor.config.ts` | app ID, name, site address, splash and status bar |
| `www/` | the offline page (and a placeholder `index.html` Capacitor requires) |
| `scripts/brand-icons.mjs` | draws the icons and splash screens |
| `android/`, `ios/` | the native projects (Capacitor generates them; changes there are kept) |
