export default {
  name: 'HelpModal',
  props: {
    open: { type: Boolean, required: true },
  },
  emits: ['close'],
  template: /* html */ `
    <div v-if="open" role="dialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/10 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <h2 class="text-lg font-semibold">How Callout works</h2>

        <div class="space-y-4 text-sm text-slate-300">
          <div>
            <p class="font-medium text-slate-100">1. Set a shared broker &amp; topic</p>
            <p class="mt-1 text-slate-400">Open Settings and enter the same MQTT broker URL and topic on every device that should be part of the same broadcast — one Sender, one or more Receivers.</p>
          </div>

          <div>
            <p class="font-medium text-slate-100">2. Sender</p>
            <p class="mt-1 text-slate-400">Write a message (up to 512 characters), format it with bold/italic/underline and alignment, pick a background color, then tap Broadcast.</p>
          </div>

          <div>
            <p class="font-medium text-slate-100">3. Receiver</p>
            <p class="mt-1 text-slate-400">Best viewed in landscape, fullscreen. When a message arrives, the screen flashes red/white to grab attention, then shows the message scrolling two lines at a time. The screen stays awake automatically. Flash duration and looping can be changed in Settings.</p>
          </div>

          <div>
            <p class="font-medium text-slate-100">Keeping the Receiver screen on</p>
            <p class="mt-1 text-slate-400">Callout does its best to keep the screen awake automatically, but iOS can still override this (Low Power Mode, installed-app quirks, etc.). For a dedicated Receiver device, the fully reliable fix is turning off the device's own screen timeout: iOS Settings &rarr; Display &amp; Brightness &rarr; Auto-Lock &rarr; Never.</p>
          </div>

          <div>
            <p class="font-medium text-slate-100">Menu access</p>
            <p class="mt-1 text-slate-400">Tap the menu button (top-right), or swipe up anywhere on the screen, to switch modes, check connection status, open Settings, or install the app.</p>
          </div>

          <div>
            <p class="font-medium text-slate-100">Install</p>
            <p class="mt-1 text-slate-400">Installing adds Callout to your home screen for a fullscreen, always-on display — use the install banner or the "Install app" menu item.</p>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button @click="$emit('close')" class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400">Got it</button>
        </div>
      </div>
    </div>
  `,
};
