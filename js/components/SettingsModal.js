const { reactive, watch } = Vue;
import { settings, saveSettings, DEFAULTS } from '../settings.js';

export default {
  name: 'SettingsModal',
  props: {
    open: { type: Boolean, required: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const form = reactive({ ...settings });

    watch(
      () => props.open,
      (isOpen) => {
        if (isOpen) Object.assign(form, settings);
      }
    );

    function save() {
      saveSettings({ ...form, flashDurationMs: Number(form.flashDurationMs) || DEFAULTS.flashDurationMs });
      emit('close');
    }

    function resetDefaults() {
      Object.assign(form, DEFAULTS);
    }

    return { form, save, resetDefaults };
  },
  template: /* html */ `
    <div v-if="open" role="dialog" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/60" @click="$emit('close')"></div>

      <div class="absolute inset-y-0 right-0 w-full max-w-sm rounded-l-2xl bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/10 p-5 space-y-4 overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Settings</h2>
          <button @click="$emit('close')" class="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-3">
          <label class="block text-sm">
            <span class="text-slate-400">Broker WebSocket URL</span>
            <input v-model="form.brokerUrl" type="text" placeholder="wss://broker.example.com:8884/mqtt"
              class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
          </label>

          <label class="block text-sm">
            <span class="text-slate-400">Topic</span>
            <input v-model="form.topic" type="text" placeholder="callout/demo"
              class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
          </label>

          <div class="grid grid-cols-2 gap-3">
            <label class="block text-sm">
              <span class="text-slate-400">Username (optional)</span>
              <input v-model="form.username" type="text" autocomplete="off"
                class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
            </label>
            <label class="block text-sm">
              <span class="text-slate-400">Password (optional)</span>
              <input v-model="form.password" type="password" autocomplete="off"
                class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
            </label>
          </div>

          <label class="block text-sm">
            <span class="text-slate-400">Flash duration (ms)</span>
            <input v-model.number="form.flashDurationMs" type="number" min="0" step="250"
              class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
          </label>

          <label class="block text-sm">
            <span class="text-slate-400">Scroll speed ({{ form.scrollSpeed }}&times;)</span>
            <input v-model.number="form.scrollSpeed" type="range" min="0.5" max="3" step="0.25"
              class="mt-1 w-full accent-indigo-500" />
          </label>

          <label class="flex items-center gap-2 text-sm text-slate-300">
            <input v-model="form.loopEnabled" type="checkbox" class="h-4 w-4 rounded accent-indigo-500" />
            Loop message display
          </label>
        </div>

        <div class="flex justify-between pt-2">
          <button @click="resetDefaults" class="text-sm text-slate-400 hover:text-slate-200">Reset defaults</button>
          <div class="space-x-2">
            <button @click="$emit('close')" class="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancel</button>
            <button @click="save" class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
