const { ref, computed, onMounted, onUnmounted } = Vue;
import { installState, promptInstall, reopen } from '../install-prompt.js';

const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MAX_TIME_MS = 700;

export default {
  name: 'AppMenu',
  props: {
    mode: { type: String, required: true },
    status: { type: String, required: true },
  },
  emits: ['set-mode', 'open-settings', 'open-help'],
  setup(props, { emit }) {
    const open = ref(false);

    const statusColor = {
      connected: 'bg-emerald-400',
      connecting: 'bg-amber-400',
      disconnected: 'bg-slate-500',
      error: 'bg-red-500',
    };

    const orbGlow = {
      connected: 'rgba(52, 211, 153, 0.85)',
      error: 'rgba(239, 68, 68, 0.85)',
    };

    const orbStyle = computed(() => {
      const glow = orbGlow[props.status];
      return glow ? { '--orb-glow': glow } : {};
    });

    const orbAnimClass = computed(() => {
      if (orbGlow[props.status]) return 'status-orb-glow';
      if (props.status === 'connecting') return 'animate-pulse';
      return '';
    });

    const canShowInstall = computed(() => !installState.installed);

    function choose(mode) {
      emit('set-mode', mode);
      open.value = false;
    }

    function openSettings() {
      emit('open-settings');
      open.value = false;
    }

    function openHelp() {
      emit('open-help');
      open.value = false;
    }

    async function install() {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') reopen();
      open.value = false;
    }

    let touchStartY = null;
    let touchStartTime = 0;

    function onTouchStart(e) {
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }

    function onTouchEnd(e) {
      if (touchStartY === null) return;
      const startY = touchStartY;
      const elapsed = Date.now() - touchStartTime;
      touchStartY = null;

      if (open.value) return;
      const target = e.target;
      if (target?.closest?.('[contenteditable], input, textarea, select, [role="dialog"]')) return;

      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) return;
      const deltaY = startY - touch.clientY;
      if (deltaY > SWIPE_MIN_DISTANCE && elapsed < SWIPE_MAX_TIME_MS) {
        open.value = true;
      }
    }

    onMounted(() => {
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
    });

    onUnmounted(() => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    });

    return { open, statusColor, orbStyle, orbAnimClass, canShowInstall, choose, openSettings, openHelp, install };
  },
  template: /* html */ `
    <div class="absolute right-2 z-50" style="top: calc(env(safe-area-inset-top, 0px) + 3.25rem);">
      <button
        @click="open = !open"
        class="relative flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/50 transition"
        aria-label="Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span
          class="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-950"
          :class="[statusColor[status] || 'bg-slate-500', orbAnimClass]"
          :style="orbStyle"
          :aria-label="'Connection: ' + status"
        ></span>
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

        <button
          @click="openHelp"
          class="w-full rounded-lg bg-slate-800 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
        >Help</button>

        <button
          v-if="canShowInstall"
          @click="install"
          class="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          Install app
        </button>
      </div>
    </div>
  `,
};
