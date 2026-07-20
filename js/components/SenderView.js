const { ref, onMounted, computed } = Vue;
import { mqttClient } from '../mqtt-client.js';
import { sanitizeHtml, htmlToPlainText } from '../sanitizer.js';
import CountdownModal from './CountdownModal.js';

const MAX_CHARS = 512;

function pad(n) {
  return String(n).padStart(2, '0');
}

export default {
  name: 'SenderView',
  components: { CountdownModal },
  setup() {
    const editorEl = ref(null);
    const bgColor = ref('#1e293b');
    const fontColor = ref('#ffffff');
    const charCount = ref(0);
    const sentFlash = ref(false);
    const clearedFlash = ref(false);
    const payloadType = ref('normal');
    const countdownModalOpen = ref(false);
    const countdownDuration = ref(null); // { hours, minutes, seconds } | null
    let lastValidHtml = '';

    function updateCount() {
      charCount.value = htmlToPlainText(editorEl.value.innerHTML).length;
    }

    function snapshot() {
      lastValidHtml = editorEl.value.innerHTML;
    }

    function restoreSnapshot() {
      editorEl.value.innerHTML = lastValidHtml;
      updateCount();
    }

    onMounted(() => {
      snapshot();
      updateCount();

      editorEl.value.addEventListener('beforeinput', (e) => {
        const insertingText = ['insertText', 'insertFromPaste', 'insertCompositionText'].includes(e.inputType);
        if (!insertingText) return;
        const currentLen = htmlToPlainText(editorEl.value.innerHTML).length;
        const incoming = e.data ? e.data.length : 0;
        if (currentLen + incoming > MAX_CHARS) e.preventDefault();
      });

      editorEl.value.addEventListener('input', () => {
        const len = htmlToPlainText(editorEl.value.innerHTML).length;
        if (len > MAX_CHARS) {
          restoreSnapshot();
        } else {
          snapshot();
          updateCount();
        }
      });
    });

    function format(command) {
      editorEl.value.focus();
      document.execCommand(command, false, null);
      snapshot();
      updateCount();
    }

    function applyFontColor() {
      editorEl.value.focus();
      // Without styleWithCSS, foreColor produces legacy <font color="..."> tags,
      // which aren't in the sanitizer's allowlist and would get stripped on
      // broadcast. Scope styleWithCSS to just this command so bold/italic/
      // underline keep using their normal tag-based output.
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, fontColor.value);
      document.execCommand('styleWithCSS', false, false);
      snapshot();
      updateCount();
    }

    function clearEditor() {
      editorEl.value.innerHTML = '';
      snapshot();
      updateCount();
    }

    async function pasteMessage() {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        editorEl.value.focus();
        document.execCommand('insertText', false, text);
        snapshot();
        updateCount();
      } catch {
        // Clipboard API may be blocked; fall back to native paste via keyboard
      }
    }

    function broadcast() {
      const html = sanitizeHtml(editorEl.value.innerHTML);
      const text = htmlToPlainText(html);
      if (!text) return;
      mqttClient.publish({
        v: 1,
        type: 'broadcast',
        html,
        text,
        bgColor: bgColor.value,
        timestamp: Date.now(),
      });
      sentFlash.value = true;
      setTimeout(() => (sentFlash.value = false), 900);
    }

    function clearReceivers() {
      mqttClient.publish({ v: 1, type: 'clear', timestamp: Date.now() });
      clearedFlash.value = true;
      setTimeout(() => (clearedFlash.value = false), 900);
    }

    function onCountdownSend({ hours, minutes, seconds }) {
      countdownDuration.value = { hours, minutes, seconds };
      countdownModalOpen.value = false;
    }

    function broadcastCountdown() {
      if (!countdownDuration.value) return;
      const { hours, minutes, seconds } = countdownDuration.value;
      const tag = `[countdown:${pad(hours)}:${pad(minutes)}:${pad(seconds)}]`;
      mqttClient.publish({
        v: 1,
        type: 'broadcast',
        html: tag,
        text: tag,
        bgColor: bgColor.value,
        fontColor: fontColor.value,
        timestamp: Date.now(),
      });
      sentFlash.value = true;
      setTimeout(() => (sentFlash.value = false), 900);
    }

    const overLimit = computed(() => charCount.value > MAX_CHARS);
    const counterClass = computed(() => (overLimit.value ? 'text-red-400' : 'text-slate-400'));
    const countdownDurationText = computed(() => {
      if (!countdownDuration.value) return 'Not set';
      const { hours, minutes, seconds } = countdownDuration.value;
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    });

    return {
      editorEl,
      bgColor,
      fontColor,
      charCount,
      sentFlash,
      clearedFlash,
      payloadType,
      countdownModalOpen,
      countdownDurationText,
      format,
      applyFontColor,
      clearEditor,
      pasteMessage,
      broadcast,
      clearReceivers,
      onCountdownSend,
      broadcastCountdown,
      counterClass,
      MAX_CHARS,
    };
  },
  template: /* html */ `
    <div class="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div class="w-full max-w-xl space-y-4">
        <h1 class="text-2xl font-semibold tracking-tight">Callout — Sender</h1>

        <div class="flex items-center gap-3 rounded-lg bg-slate-900 p-2 ring-1 ring-white/10">
          <label class="flex items-center gap-2 text-sm">
            <span class="text-slate-400">Message type</span>
            <select
              v-model="payloadType"
              class="rounded-lg bg-slate-800 px-2 py-1.5 text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none"
            >
              <option value="normal">Normal message</option>
              <option value="countdown">Countdown timer</option>
            </select>
          </label>

          <div class="ml-auto flex items-center gap-2 text-sm">
            <span class="text-slate-400">Background</span>
            <input v-model="bgColor" type="color" class="h-8 w-10 cursor-pointer rounded bg-transparent" />
          </div>
        </div>

        <div v-if="payloadType === 'normal'" class="space-y-4">
          <div class="flex items-center gap-2 rounded-lg bg-slate-900 p-2 ring-1 ring-white/10">
            <button @click="format('bold')" class="h-9 w-9 rounded-md font-bold hover:bg-slate-800">B</button>
            <button @click="format('italic')" class="h-9 w-9 rounded-md italic hover:bg-slate-800">I</button>
            <button @click="format('underline')" class="h-9 w-9 rounded-md underline hover:bg-slate-800">U</button>

            <div class="w-px h-6 bg-white/10"></div>

            <button @click="format('justifyLeft')" class="h-9 w-9 rounded-md hover:bg-slate-800 flex items-center justify-center" aria-label="Align left">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M4 6h16M4 12h10M4 18h14" />
              </svg>
            </button>
            <button @click="format('justifyCenter')" class="h-9 w-9 rounded-md hover:bg-slate-800 flex items-center justify-center" aria-label="Align center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M4 6h16M7 12h10M5 18h14" />
              </svg>
            </button>
            <button @click="format('justifyRight')" class="h-9 w-9 rounded-md hover:bg-slate-800 flex items-center justify-center" aria-label="Align right">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M4 6h16M10 12h10M6 18h14" />
              </svg>
            </button>

            <div class="ml-auto flex items-center gap-2 text-sm">
              <span class="text-slate-400">Text</span>
              <input
                v-model="fontColor"
                @change="applyFontColor"
                type="color"
                class="h-8 w-10 cursor-pointer rounded bg-transparent"
              />
            </div>
          </div>

          <div
            ref="editorEl"
            contenteditable="true"
            class="min-h-[8rem] rounded-xl bg-slate-900 p-4 text-lg leading-relaxed ring-1 ring-white/10 focus:ring-indigo-400 outline-none"
            data-placeholder="Type your message…"
          ></div>

          <div class="flex items-center justify-between text-sm">
            <span :class="counterClass">{{ charCount }} / {{ MAX_CHARS }}</span>
            <div class="flex items-center gap-3">
              <button @click="pasteMessage" class="text-slate-400 hover:text-slate-200">Paste</button>
              <button @click="clearEditor" class="text-slate-400 hover:text-slate-200">Clear text</button>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="clearReceivers"
              class="rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              {{ clearedFlash ? 'Cleared ✓' : 'Clear Display' }}
            </button>
            <button
              @click="broadcast"
              class="flex-1 rounded-xl bg-indigo-500 py-3 text-base font-semibold text-white hover:bg-indigo-400 transition"
            >
              {{ sentFlash ? 'Sent ✓' : 'Broadcast' }}
            </button>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="rounded-xl bg-slate-900 p-6 ring-1 ring-white/10 text-center space-y-3">
            <p class="text-sm text-slate-400">Countdown duration</p>
            <p class="text-3xl font-bold tracking-wide">{{ countdownDurationText }}</p>
            <button
              @click="countdownModalOpen = true"
              class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >Set duration…</button>
          </div>

          <div class="flex items-center gap-2 rounded-lg bg-slate-900 p-2 ring-1 ring-white/10">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-slate-400">Text</span>
              <input v-model="fontColor" type="color" class="h-8 w-10 cursor-pointer rounded bg-transparent" />
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="clearReceivers"
              class="rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              {{ clearedFlash ? 'Cleared ✓' : 'Clear Display' }}
            </button>
            <button
              @click="broadcastCountdown"
              :disabled="!countdownDurationText || countdownDurationText === 'Not set'"
              class="flex-1 rounded-xl bg-indigo-500 py-3 text-base font-semibold text-white hover:bg-indigo-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {{ sentFlash ? 'Sent ✓' : 'Broadcast Countdown' }}
            </button>
          </div>
        </div>
      </div>

      <countdown-modal
        :open="countdownModalOpen"
        @send="onCountdownSend"
        @close="countdownModalOpen = false"
      />
    </div>
  `,
};
