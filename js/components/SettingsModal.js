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
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/10 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Settings</h2>

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
