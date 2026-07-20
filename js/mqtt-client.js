// Thin wrapper around the vendored MQTT.js browser build (global `mqtt`).
// Dispatches normalized 'status' and 'message' CustomEvents so UI code
// doesn't need to know about MQTT.js internals.

class MqttClientWrapper extends EventTarget {
  #client = null;
  #topic = null;
  #status = 'disconnected';

  getStatus() {
    return this.#status;
  }

  #setStatus(status) {
    if (this.#status === status) return;
    this.#status = status;
    this.dispatchEvent(new CustomEvent('status', { detail: status }));
  }

  connect({ brokerUrl, topic, username, password }) {
    this.disconnect();
    this.#topic = topic;
    this.#setStatus('connecting');

    let client;
    try {
      client = mqtt.connect(brokerUrl, {
        username: username || undefined,
        password: password || undefined,
        reconnectPeriod: 3000,
        connectTimeout: 8000,
        clientId: 'callout-' + Math.random().toString(16).slice(2),
      });
    } catch {
      this.#setStatus('error');
      return;
    }
    this.#client = client;

    client.on('connect', () => {
      this.#setStatus('connected');
      if (this.#topic) client.subscribe(this.#topic);
    });
    client.on('reconnect', () => this.#setStatus('connecting'));
    client.on('close', () => this.#setStatus('disconnected'));
    client.on('offline', () => this.#setStatus('disconnected'));
    client.on('error', () => this.#setStatus('error'));

    client.on('message', (receivedTopic, payload) => {
      if (receivedTopic !== this.#topic) return;
      let parsed;
      try {
        parsed = JSON.parse(payload.toString());
      } catch {
        return; // ignore malformed payloads
      }
      this.dispatchEvent(new CustomEvent('message', { detail: parsed }));
    });
  }

  publish(payloadObj) {
    if (!this.#client || !this.#topic) return;
    this.#client.publish(this.#topic, JSON.stringify(payloadObj), { qos: 0, retain: false });
  }

  disconnect() {
    if (this.#client) {
      this.#client.end(true);
      this.#client = null;
    }
    this.#setStatus('disconnected');
  }
}

export const mqttClient = new MqttClientWrapper();
