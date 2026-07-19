const { ref, onMounted, onUnmounted } = Vue;
import { mqttClient } from '../mqtt-client.js';
import { sanitizeHtml } from '../sanitizer.js';
import { settings } from '../settings.js';
import { Paginator } from '../pagination.js';
import * as wakelock from '../wakelock.js';

const FLASH_STEP_MS = 250;
const IDLE_COLOR = '#0f172a';

export default {
  name: 'ReceiverView',
  setup() {
    const containerEl = ref(null);
    const innerEl = ref(null);
    const bgColor = ref(IDLE_COLOR);
    const waiting = ref(true);

    let paginator = null;
    let flashInterval = null;
    let flashTimeout = null;
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

    function handleMessage(payload) {
      if (!payload || payload.type !== 'broadcast') return;
      const myGen = ++generation;
      waiting.value = false;
      paginator.stop();

      const html = sanitizeHtml(payload.html || '');
      const color = /^#[0-9a-fA-F]{6}$/.test(payload.bgColor || '') ? payload.bgColor : IDLE_COLOR;

      runFlash(color, settings.flashDurationMs, () => {
        if (myGen !== generation) return;
        paginator.setHtml(html);
        paginator.start({ loop: settings.loopEnabled });
      });
    }

    onMounted(() => {
      paginator = new Paginator(containerEl.value, innerEl.value);
      mqttClient.addEventListener('message', (e) => handleMessage(e.detail));
      wakelock.acquire();
    });

    onUnmounted(() => {
      stopFlash();
      paginator?.destroy();
      wakelock.release();
    });

    return { containerEl, innerEl, bgColor, waiting };
  },
  template: /* html */ `
    <div
      class="fixed inset-0 flex items-center justify-center overflow-hidden transition-colors duration-150"
      :style="{ backgroundColor: bgColor }"
    >
      <p v-if="waiting" class="text-white/40 text-xl tracking-wide">Waiting for broadcast…</p>

      <div
        v-show="!waiting"
        ref="containerEl"
        class="receiver-window w-[96vw] overflow-hidden"
      >
        <div
          ref="innerEl"
          class="receiver-text text-white font-bold whitespace-normal"
        ></div>
      </div>
    </div>
  `,
};
