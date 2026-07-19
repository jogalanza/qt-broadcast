# Callout

Broadcast short messages over MQTT to any number of screens. Installable PWA, no build step — Vue 3 and Tailwind CSS are loaded as vendored no-bundler browser builds.

- **Sender** — write a rich-text message (bold/italic/underline, up to 512 characters) and pick a background color, then broadcast it to an MQTT topic.
- **Receiver** — optimized for landscape, fills the whole screen. On a new message: flashes red/white for a configurable duration to grab attention, settles into the message's background color, then displays the text two lines at a time (looping, or long unbroken tokens marquee-scroll). Keeps the screen awake, and re-acquires the wake lock whenever the app is restored from being minimized.

Both modes share a broker URL / topic (MQTT over WebSockets — browsers can't speak raw MQTT/TCP) configured from the settings menu (top-right hamburger icon), persisted in `localStorage`.

## Running locally

No build step, but service worker registration and ES modules require an HTTP origin (`file://` won't work):

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Testing broadcast end-to-end

1. Open the app in two tabs/devices.
2. In Settings, point both at the same broker + topic. Public test brokers over WSS work fine for trying it out, e.g. `wss://broker.hivemq.com:8884/mqtt` or `wss://test.mosquitto.org:8081/mqtt` — pick a topic that's unlikely to collide with other users of the broker.
3. Set one to Sender, the other to Receiver, and hit Broadcast.

## Deploying

Pushes to `main` deploy automatically via `.github/workflows/deploy.yml` (GitHub Actions → GitHub Pages, no build step, the whole repo is uploaded as the Pages artifact). One-time manual setup: in the repo's Settings → Pages, set **Source** to **GitHub Actions**.

## Vendored libraries

`vendor/` contains browser-ready builds downloaded from npm (no CDN dependency at runtime, so the installed PWA works offline): `mqtt.min.js` (MQTT.js), `vue.global.prod.js` (Vue 3), `tailwindcss-browser.global.js` (`@tailwindcss/browser`, Tailwind's no-build in-browser JIT compiler), and `NoSleep.min.js` (wake lock + iOS fallback helper).

## Security note

Broker credentials, if you set them, are stored in plain `localStorage` — there's no backend to do better. For public test brokers, leave them blank.
