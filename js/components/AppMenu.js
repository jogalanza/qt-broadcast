const { ref } = Vue;

export default {
  name: 'AppMenu',
  props: {
    mode: { type: String, required: true },
    status: { type: String, required: true },
  },
  emits: ['set-mode', 'open-settings'],
  setup(props, { emit }) {
    const open = ref(false);

    const statusColor = {
      connected: 'bg-emerald-400',
      connecting: 'bg-amber-400',
      disconnected: 'bg-slate-500',
      error: 'bg-red-500',
    };

    function choose(mode) {
      emit('set-mode', mode);
      open.value = false;
    }

    function openSettings() {
      emit('open-settings');
      open.value = false;
    }

    return { open, statusColor, choose, openSettings };
  },
  template: /* html */ `
    <div class="absolute top-2 right-2 z-50">
      <button
        @click="open = !open"
        class="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/50 transition"
        aria-label="Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        v-if="open"
        class="mt-2 w-56 rounded-xl bg-slate-900/95 text-slate-100 shadow-xl ring-1 ring-white/10 backdrop-blur p-3 space-y-2"
      >
        <div class="flex items-center gap-2 px-1 text-xs uppercase tracking-wide text-slate-400">
          <span class="inline-block h-2 w-2 rounded-full" :class="statusColor[status] || 'bg-slate-500'"></span>
          {{ status }}
        </div>

        <div class="flex rounded-lg overflow-hidden ring-1 ring-white/10">
          <button
            @click="choose('sender')"
            class="flex-1 py-2 text-sm font-medium"
            :class="mode === 'sender' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'"
          >Sender</button>
          <button
            @click="choose('receiver')"
            class="flex-1 py-2 text-sm font-medium"
            :class="mode === 'receiver' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'"
          >Receiver</button>
        </div>

        <button
          @click="openSettings"
          class="w-full rounded-lg bg-slate-800 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
        >Settings</button>
      </div>
    </div>
  `,
};
