const { computed } = Vue;
import { installState, isIos, promptInstall, dismiss } from '../install-prompt.js';

export default {
  name: 'InstallBanner',
  setup() {
    const canPrompt = computed(() => !!installState.deferredEvent);
    const showIosHint = computed(() => isIos() && !installState.installed && !canPrompt.value);
    const visible = computed(
      () => !installState.installed && !installState.dismissed && (canPrompt.value || showIosHint.value)
    );

    async function install() {
      const outcome = await promptInstall();
      if (outcome !== 'unavailable') dismiss();
    }

    return { visible, canPrompt, showIosHint, install, dismiss };
  },
  template: /* html */ `
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-40 flex justify-center p-3"
    >
      <div class="flex w-full max-w-md items-center gap-3 rounded-xl bg-slate-900/95 text-slate-100 shadow-2xl ring-1 ring-white/10 backdrop-blur p-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
        </div>

        <div class="flex-1 text-sm leading-snug">
          <p class="font-medium">Install Callout</p>
          <p v-if="canPrompt" class="text-slate-400">Add it to your home screen for fullscreen, always-on display.</p>
          <p v-else class="text-slate-400">Tap <span class="font-medium text-slate-300">Share</span> then <span class="font-medium text-slate-300">Add to Home Screen</span>.</p>
        </div>

        <button
          v-if="canPrompt"
          @click="install"
          class="shrink-0 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition"
        >Install</button>

        <button @click="dismiss" class="shrink-0 h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Dismiss">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `,
};
