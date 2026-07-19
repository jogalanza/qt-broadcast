// Module-level singleton (same pattern as settings.js/mqtt-client.js) so the
// countdown's value keeps ticking across ReceiverView unmounting/remounting
// when the user toggles Sender/Receiver mode. A component-local ref/interval
// would be destroyed on unmount; setInterval is a runtime timer, not a
// Vue-scoped resource, so a module-level one survives regardless of which
// mode is currently mounted.

export const countdownState = Vue.reactive({
  active: false,
  text: '',
  bgColor: null,
});

let interval = null;
let endAt = 0;

function pad(n) {
  return String(n).padStart(2, '0');
}

function format(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function stopCountdown() {
  if (interval) clearInterval(interval);
  interval = null;
  countdownState.active = false;
}

// Wall-clock-based (endAt, not a decrementing counter) so it's immune to
// setInterval throttling while the tab/app is backgrounded — the next tick
// after resuming just recomputes the correct remaining time instead of
// drifting or freezing.
export function startCountdown(totalSeconds, color, onExpire) {
  stopCountdown();
  endAt = Date.now() + totalSeconds * 1000;
  countdownState.active = true;
  countdownState.bgColor = color;

  const tick = () => {
    const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    countdownState.text = format(remaining);
    if (remaining <= 0) {
      clearInterval(interval);
      interval = null;
      onExpire?.();
    }
  };

  tick();
  interval = setInterval(tick, 1000);
}
