const { ref, computed, onMounted, onUnmounted } = Vue;
import { mqttClient } from '../mqtt-client.js';
import { sanitizeHtml } from '../sanitizer.js';
import { settings } from '../settings.js';
import { Paginator } from '../pagination.js';
import * as wakelock from '../wakelock.js';
import { countdownState, startCountdown, stopCountdown } from '../countdown.js';

const FLASH_STEP_MS = 250;
const IDLE_COLOR = '#0f172a';
const BASE_SCROLL_SPEED = 60;
const BASE_MARQUEE_SPEED = 110;
const CLOCK_TICK_MS = 15000;
const COUNTDOWN_RE = /^\[countdown:(\d{1,2}):(\d{1,2}):(\d{1,2})\]$/;
const FONT_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function formatTimeAgo(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : hours + ' hours ago';
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : days + ' days ago';
}

export default {
  name: 'ReceiverView',
  setup() {
    const containerEl = ref(null);
    const innerEl = ref(null);
    const bgColor = ref(IDLE_COLOR);
    const waiting = ref(true);
    const receivedAt = ref(null);
    const now = ref(Date.now());

    const timeAgoText = computed(() => (receivedAt.value ? formatTimeAgo(now.value - receivedAt.value) : ''));

    let paginator = null;
    let flashInterval = null;
    let flashTimeout = null;
    let clockInterval = null;
    let generation = 0;

    function stopFlash() {
      if (flashInterval) clearInterval(flashInterval);
      if (flashTimeout) clearTimeout(flashTimeout);
      flashInterval = null;
      flashTimeout = null;
    }

    function runFlash(finalColor, durationMs, onDone) {
      stopFlash();
      let toggle = false;
      flashInterval = setInterval(() => {
        toggle = !toggle;
        bgColor.value = toggle ? '#ff0000' : '#ffffff';
      }, FLASH_STEP_MS);
      flashTimeout = setTimeout(() => {
        stopFlash();
        bgColor.value = finalColor;
        onDone();
      }, Math.max(0, durationMs));
    }

    function handleClear() {
      ++generation; // invalidate any in-flight flash/pagination continuation
      stopFlash();
      stopCountdown();
      paginator.stop();
      bgColor.value = IDLE_COLOR;
      waiting.value = true;
      receivedAt.value = null;
    }

    function handleMessage(payload) {
      if (!payload) return;
      if (payload.type === 'clear') {
        handleClear();
        return;
      }
      if (payload.type !== 'broadcast') return;

      const myGen = ++generation;
      waiting.value = false;
      receivedAt.value = Date.now();
      now.value = receivedAt.value;
      stopCountdown(); // a new message always interrupts any in-progress countdown
      paginator.setHtml(''); // clear the previous message before flashing

      const html = sanitizeHtml(payload.html || '');
      const color = /^#[0-9a-fA-F]{6}$/.test(payload.bgColor || '') ? payload.bgColor : IDLE_COLOR;

      const countdownMatch = (payload.text || '').trim().match(COUNTDOWN_RE);
      const fontColor = FONT_COLOR_RE.test(payload.fontColor || '') ? payload.fontColor : '#ffffff';

      runFlash(color, settings.flashDurationMs, () => {
        if (myGen !== generation) return;
        if (countdownMatch) {
          const totalSeconds =
            Number(countdownMatch[1]) * 3600 + Number(countdownMatch[2]) * 60 + Number(countdownMatch[3]);
          startCountdown(totalSeconds, color, fontColor, () => {
            if (myGen !== generation) return;
            runFlash(color, settings.flashDurationMs, () => {});
          });
          return;
        }
        paginator.setHtml(html);
        paginator.scrollSpeedPxPerSec = BASE_SCROLL_SPEED * settings.scrollSpeed;
        paginator.marqueeSpeedPxPerSec = BASE_MARQUEE_SPEED * settings.scrollSpeed;
        paginator.start({ loop: settings.loopEnabled });
      });
    }

    onMounted(() => {
      paginator = new Paginator(containerEl.value, innerEl.value);
      mqttClient.addEventListener('message', (e) => handleMessage(e.detail));
      wakelock.acquire();
      clockInterval = setInterval(() => (now.value = Date.now()), CLOCK_TICK_MS);

      // Restore visual state for a countdown that kept running (module-level
      // singleton) while this component was unmounted, e.g. the user was in
      // Sender mode. The countdown text itself never stopped updating; this
      // just re-syncs the background color the countdown settled to.
      if (countdownState.active) {
        waiting.value = false;
        bgColor.value = countdownState.bgColor;
      }
    });

    onUnmounted(() => {
      stopFlash();
      paginator?.destroy();
      wakelock.release();
      if (clockInterval) clearInterval(clockInterval);
    });

    return { containerEl, innerEl, bgColor, waiting, timeAgoText, countdownState };
  },
  template: /* html */ `
    <div
      class="fixed inset-0 flex items-center justify-center overflow-hidden transition-colors duration-150"
      :style="{ backgroundColor: bgColor }"
    >
      <p v-if="waiting" class="text-white/40 text-xl tracking-wide">Waiting for broadcast…</p>

      <div
        v-show="!waiting && countdownState.active"
        class="receiver-window w-[96vw] flex items-center justify-center"
      >
        <span
          class="receiver-text font-bold"
          :style="{ color: countdownState.fontColor || '#ffffff' }"
        >{{ countdownState.text }}</span>
      </div>

      <div
        v-show="!waiting && !countdownState.active"
        ref="containerEl"
        class="receiver-window w-[96vw] overflow-hidden"
      >
        <div
          ref="innerEl"
          class="receiver-text text-white font-bold whitespace-normal"
        ></div>
      </div>

      <p
        v-if="timeAgoText"
        class="fixed right-3 text-sm text-white/50 bg-black/30 backdrop-blur rounded-full px-3 py-1"
        style="bottom: calc(env(safe-area-inset-bottom, 0px) + 0.75rem);"
      >{{ timeAgoText }}</p>
    </div>
  `,
};
