// Thin wrapper around the vendored NoSleep.js (global `NoSleep`), which
// itself uses the native Screen Wake Lock API when available (including
// reacquiring it on visibilitychange) and falls back to a silent looping
// video for browsers (notably older iOS Safari) without the API.

let instance = null;
let active = false;

function getInstance() {
  if (!instance) instance = new NoSleep();
  return instance;
}

export async function acquire() {
  active = true;
  try {
    await getInstance().enable();
  } catch {
    // Some browsers reject without a user gesture; the caller also retries
    // this from click handlers, so a failed silent attempt is non-fatal.
  }
}

export function release() {
  active = false;
  if (instance) instance.disable();
}

export function isActive() {
  return active;
}
