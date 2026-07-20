// Wraps the browser install flow (beforeinstallprompt on Chromium/Android,
// manual "Add to Home Screen" instructions on iOS Safari where no such
// event exists) behind a small reactive singleton so any component can
// read/trigger it.

const DISMISS_KEY = 'callout:installPromptDismissed';

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

export const installState = Vue.reactive({
  deferredEvent: null,
  installed: isStandalone(),
  dismissed: localStorage.getItem(DISMISS_KEY) === '1',
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installState.deferredEvent = e;
});

window.addEventListener('appinstalled', () => {
  installState.installed = true;
  installState.deferredEvent = null;
});

export function dismiss() {
  installState.dismissed = true;
  localStorage.setItem(DISMISS_KEY, '1');
}

export function reopen() {
  installState.dismissed = false;
}

export async function promptInstall() {
  if (!installState.deferredEvent) return 'unavailable';
  installState.deferredEvent.prompt();
  const choice = await installState.deferredEvent.userChoice;
  installState.deferredEvent = null;
  return choice.outcome; // 'accepted' | 'dismissed'
}
