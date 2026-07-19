const STORAGE_KEY = 'callout:settings';

export const DEFAULTS = Object.freeze({
  brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
  topic: 'callout/demo',
  username: '',
  password: '',
  flashDurationMs: 3000,
  loopEnabled: true,
  lastMode: 'sender',
});

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings = Vue.reactive(load());

export function saveSettings(partial) {
  Object.assign(settings, partial);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}
