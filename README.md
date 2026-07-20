# Callout

Broadcast short messages over MQTT to any number of screens. An installable PWA with no build step — Vue 3, Tailwind CSS, and MQTT.js are all loaded as vendored, no-bundler browser builds, so the app also works offline once installed.

Think of it as a lightweight, self-hosted digital signage / alert system: one device composes a message, and every other device subscribed to the same MQTT topic flashes and displays it.

## Use cases

- **Kitchen/pickup call system** for a small restaurant or coffee shop — call out an order number from a phone, display it on a mounted tablet.
- **"Now boarding" / queue-calling display** for a clinic, workshop, or classroom.
- **Silent alert / status board** — flash a message to a shared screen without a sound system.
- **Livestream or event signage** — broadcast a quick announcement to screens around a venue.
- **Family/household intercom** — a "dinner's ready" or "come downstairs" broadcast to a screen in another room.

## Features

**Sender mode**
- Rich-text editor: bold, italic, underline, and left/center/right alignment.
- Up to 512 characters per message, with a live counter.
- Per-message background color picker.
- One-tap Broadcast, published over MQTT (QoS 0, not retained — only the live message matters).

**Receiver mode**
- Fills the whole screen, optimized for landscape but adapts responsively to portrait (text scales to use the available space in either orientation).
- On a new message: flashes red/white for a configurable duration to grab attention, then settles into the message's background color.
- Displays the message two lines at a time, continuously scrolling (teleprompter-style); a single word/token too wide for the line marquee-scrolls horizontally instead of breaking. Looping is configurable — leave it on to repeat, or turn it off to stop on the last line.
- Keeps the screen awake automatically, and re-acquires the wake lock whenever the app is restored from being minimized or the tab regains visibility.

**Shared**
- Both modes share one MQTT broker URL + topic (MQTT over WebSockets — browsers can't speak raw MQTT/TCP), plus flash duration and loop settings, all configured from Settings and persisted in `localStorage`.
- A floating menu (top-right, tap or swipe up anywhere to open) switches modes, shows connection status, and links to Settings, Help, and Install.
- Installable as a PWA with an install banner/prompt (or manual "Add to Home Screen" instructions on iOS Safari) and a home-screen icon.
- In-app Help screen walking through setup and usage.
- HTML input is sanitized on both the sending and receiving end (an allowlist of safe tags/styles only), so a shared or public broker topic can't be used to inject scripts into another device's Receiver.

## How to use it

1. **Open the app on two or more devices** (or two browser tabs to try it out on one machine) — open the menu → **Settings**.
2. **Point every device at the same broker and topic.** Any MQTT broker with a WebSocket listener works. For a quick test, a public broker like `wss://broker.hivemq.com:8884/mqtt` or `wss://test.mosquitto.org:8081/mqtt` works with no setup — just pick a topic name unlikely to collide with other public users (e.g. include a random suffix). For real use, run your own broker (Mosquitto, EMQX, HiveMQ, etc.) with WSS enabled.
3. **Set one device to Sender**, write a message, format and color it, and hit **Broadcast**.
4. **Set the other device(s) to Receiver** — ideally full-screen/installed and left running. They'll flash and display the message automatically when it arrives.
5. **Install it** (menu → Install app, or the install banner) so Receiver devices can be left plugged in and awake as dedicated displays.

## Roadmap

Ideas for future iterations — none of this is built yet:

- Message history / re-send a previous broadcast without retyping it.
- QR-code broker/topic sharing so a Receiver can be paired without typing settings by hand.
- Retained "last message" replay option for a Receiver that (re)connects mid-session.
- Scheduled / recurring broadcasts.
- Multiple simultaneous topics per Receiver, with a filter or channel picker.
- Sound/vibration alert options alongside the flash.
- Optional authentication/allowlist for who can publish to a topic (currently relies entirely on broker-level access control).

## Running locally

No build step, but service worker registration and ES modules require an HTTP origin (`file://` won't work):

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Testing broadcast end-to-end

1. Open the app in two tabs/devices.
2. In Settings, point both at the same broker + topic (see "How to use it" above for public test brokers).
3. Set one to Sender, the other to Receiver, and hit Broadcast.

## Deploying

Pushes to `main` deploy automatically via `.github/workflows/deploy.yml` (GitHub Actions → GitHub Pages, no build step, the whole repo is uploaded as the Pages artifact). One-time manual setup: in the repo's Settings → Pages, set **Source** to **GitHub Actions**.

## Vendored libraries

`vendor/` contains browser-ready builds downloaded from npm (no CDN dependency at runtime, so the installed PWA works offline): `mqtt.min.js` (MQTT.js), `vue.global.prod.js` (Vue 3), `tailwindcss-browser.global.js` (`@tailwindcss/browser`, Tailwind's no-build in-browser JIT compiler), and `NoSleep.min.js` (wake lock + iOS fallback helper).

## Security note

Broker credentials, if you set them, are stored in plain `localStorage` — there's no backend to do better. For public test brokers, leave them blank. Anyone who can publish to your chosen topic can trigger your Receivers, so use a private broker or an unguessable topic name for anything beyond casual testing.
