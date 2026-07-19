const { ref, onMounted, computed } = Vue;
import { mqttClient } from '../mqtt-client.js';
import { sanitizeHtml, htmlToPlainText } from '../sanitizer.js';

const MAX_CHARS = 512;

export default {
  name: 'SenderView',
  setup() {
    const editorEl = ref(null);
    const bgColor = ref('#1e293b');
    const charCount = ref(0);
    const sentFlash = ref(false);
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

    function clearEditor() {
      editorEl.value.innerHTML = '';
      snapshot();
      updateCount();
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

    const overLimit = computed(() => charCount.value > MAX_CHARS);
    const counterClass = computed(() => (overLimit.value ? 'text-red-400' : 'text-slate-400'));

    return { editorEl, bgColor, charCount, sentFlash, format, clearEditor, broadcast, counterClass, MAX_CHARS };
  },
  template: /* html */ `
    <div class="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div class="w-full max-w-xl space-y-4">
        <h1 class="text-2xl font-semibold tracking-tight">Callout — Sender</h1>

        <div class="flex items-center gap-2 rounded-lg bg-slate-900 p-2 ring-1 ring-white/10">
          <button @click="format('bold')" class="h-9 w-9 rounded-md font-bold hover:bg-slate-800">B</button>
          <button @click="format('italic')" class="h-9 w-9 rounded-md italic hover:bg-slate-800">I</button>
          <button @click="format('underline')" class="h-9 w-9 rounded-md underline hover:bg-slate-800">U</button>
          <div class="ml-auto flex items-center gap-2 text-sm">
            <span class="text-slate-400">Background</span>
            <input v-model="bgColor" type="color" class="h-8 w-10 cursor-pointer rounded bg-transparent" />
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
          <button @click="clearEditor" class="text-slate-400 hover:text-slate-200">Clear</button>
        </div>

        <button
          @click="broadcast"
          class="w-full rounded-xl bg-indigo-500 py-3 text-base font-semibold text-white hover:bg-indigo-400 transition"
        >
          {{ sentFlash ? 'Sent ✓' : 'Broadcast' }}
        </button>
      </div>
    </div>
  `,
};
