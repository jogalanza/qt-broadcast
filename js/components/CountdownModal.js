const { reactive } = Vue;

function clamp(n, min, max) {
  n = Math.round(Number(n));
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export default {
  name: 'CountdownModal',
  props: {
    open: { type: Boolean, required: true },
  },
  emits: ['send', 'close'],
  setup(props, { emit }) {
    const form = reactive({ hours: 0, minutes: 5, seconds: 0 });

    function normalize() {
      form.hours = clamp(form.hours, 0, 99);
      form.minutes = clamp(form.minutes, 0, 59);
      form.seconds = clamp(form.seconds, 0, 59);
    }

    function send() {
      normalize();
      emit('send', { hours: form.hours, minutes: form.minutes, seconds: form.seconds });
    }

    return { form, normalize, send };
  },
  template: /* html */ `
    <div v-if="open" role="dialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-sm rounded-2xl bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-white/10 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Set countdown duration</h2>

        <div class="grid grid-cols-3 gap-3">
          <label class="block text-sm">
            <span class="text-slate-400">Hours</span>
            <input v-model.number="form.hours" @blur="normalize" type="number" min="0" max="99"
              class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-center text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
          </label>
          <label class="block text-sm">
            <span class="text-slate-400">Minutes</span>
            <input v-model.number="form.minutes" @blur="normalize" type="number" min="0" max="59"
              class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-center text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
          </label>
          <label class="block text-sm">
            <span class="text-slate-400">Seconds</span>
            <input v-model.number="form.seconds" @blur="normalize" type="number" min="0" max="59"
              class="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-center text-sm ring-1 ring-white/10 focus:ring-indigo-400 outline-none" />
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button @click="$emit('close')" class="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancel</button>
          <button @click="send" class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400">Send Countdown</button>
        </div>
      </div>
    </div>
  `,
};
