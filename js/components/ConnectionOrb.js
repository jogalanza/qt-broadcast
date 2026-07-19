const { computed } = Vue;

const STATUS_COLOR = {
  connected: 'bg-emerald-400',
  connecting: 'bg-amber-400',
  disconnected: 'bg-slate-500',
  error: 'bg-red-500',
};

const ORB_GLOW = {
  connected: 'rgba(52, 211, 153, 0.85)',
  error: 'rgba(239, 68, 68, 0.85)',
};

export default {
  name: 'ConnectionOrb',
  props: {
    status: { type: String, required: true },
  },
  setup(props) {
    const colorClass = computed(() => STATUS_COLOR[props.status] || 'bg-slate-500');

    const orbStyle = computed(() => {
      const glow = ORB_GLOW[props.status];
      return glow ? { '--orb-glow': glow } : {};
    });

    const orbAnimClass = computed(() => {
      if (ORB_GLOW[props.status]) return 'status-orb-glow';
      if (props.status === 'connecting') return 'animate-pulse';
      return '';
    });

    return { colorClass, orbStyle, orbAnimClass };
  },
  template: /* html */ `
    <div
      class="fixed left-2 z-[60] flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur pointer-events-none"
      style="top: calc(env(safe-area-inset-top, 0px) + 0.5rem);"
      :title="'Connection: ' + status"
    >
      <span
        class="h-3 w-3 rounded-full ring-2 ring-slate-950"
        :class="[colorClass, orbAnimClass]"
        :style="orbStyle"
        :aria-label="'Connection: ' + status"
      ></span>
    </div>
  `,
};
