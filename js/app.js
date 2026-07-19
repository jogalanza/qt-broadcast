import { settings, saveSettings } from './settings.js';
import { mqttClient } from './mqtt-client.js';
import SenderView from './components/SenderView.js';
import ReceiverView from './components/ReceiverView.js';
import SettingsModal from './components/SettingsModal.js';
import HelpModal from './components/HelpModal.js';
import AppMenu from './components/AppMenu.js';
import InstallBanner from './components/InstallBanner.js';

const { ref, onMounted } = Vue;

const RootComponent = {
  name: 'App',
  components: { SenderView, ReceiverView, SettingsModal, HelpModal, AppMenu, InstallBanner },
  setup() {
    const mode = ref(settings.lastMode || 'sender');
    const status = ref(mqttClient.getStatus());
    const settingsOpen = ref(false);
    const helpOpen = ref(false);

    function setMode(next) {
      mode.value = next;
      saveSettings({ lastMode: next });
    }

    function connectFromSettings() {
      mqttClient.connect({
        brokerUrl: settings.brokerUrl,
        topic: settings.topic,
        username: settings.username,
        password: settings.password,
      });
    }

    function onSettingsClose() {
      settingsOpen.value = false;
      connectFromSettings();
    }

    onMounted(() => {
      mqttClient.addEventListener('status', (e) => (status.value = e.detail));
      connectFromSettings();

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js', { scope: './' });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    });

    return { mode, status, settingsOpen, helpOpen, setMode, onSettingsClose };
  },
  template: /* html */ `
    <div>
      <app-menu
        :mode="mode"
        :status="status"
        @set-mode="setMode"
        @open-settings="settingsOpen = true"
        @open-help="helpOpen = true"
      />
      <sender-view v-if="mode === 'sender'" />
      <receiver-view v-else />
      <settings-modal :open="settingsOpen" @close="onSettingsClose" />
      <help-modal :open="helpOpen" @close="helpOpen = false" />
      <install-banner />
    </div>
  `,
};

Vue.createApp(RootComponent).mount('#app');
