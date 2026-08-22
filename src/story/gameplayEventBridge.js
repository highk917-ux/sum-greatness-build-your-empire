const DEFAULT_EVENT_MAP = Object.freeze({
  'sumgreatness:player-moved': 'player-moved',
  'sumgreatness:camera-rotated': 'camera-rotated',
  'sumgreatness:interaction-focused': 'interaction-focused',
  'sumgreatness:npc-gesture': 'npc-gesture',
  'sumgreatness:item-picked-up': 'item-picked-up',
  'sumgreatness:item-placed': 'item-placed',
  'sumgreatness:door-opened': 'door-opened',
  'sumgreatness:portal-entered': 'portal-entered',
});

function normalizePayload(event) {
  if (!event || typeof event !== 'object') return {};
  const detail = event.detail;
  if (detail && typeof detail === 'object') return detail;
  return {};
}

export function createGameplayEventBridge({
  missionRuntime,
  target = globalThis?.window ?? globalThis,
  eventMap = DEFAULT_EVENT_MAP,
  enabled = true,
} = {}) {
  if (!missionRuntime?.record) {
    throw new Error('Gameplay event bridge requires a MissionRuntime-like object');
  }

  let active = Boolean(enabled);
  let connected = false;
  const listeners = new Map();

  function on(domEventName, missionEventName) {
    return (event) => {
      if (!active) return;
      missionRuntime.record(missionEventName, normalizePayload(event));
    };
  }

  function connect() {
    if (connected) return false;
    if (!target?.addEventListener || !target?.removeEventListener) return false;

    for (const [domEventName, missionEventName] of Object.entries(eventMap)) {
      if (!domEventName || !missionEventName) continue;
      const listener = on(domEventName, missionEventName);
      listeners.set(domEventName, listener);
      target.addEventListener(domEventName, listener);
    }

    connected = true;
    return true;
  }

  function disconnect() {
    if (!connected) return false;
    for (const [domEventName, listener] of listeners) {
      target.removeEventListener(domEventName, listener);
    }
    listeners.clear();
    connected = false;
    return true;
  }

  return {
    get connected() { return connected; },
    get enabled() { return active; },
    setEnabled(value) { active = Boolean(value); },
    connect,
    disconnect,
    record(eventName, payload = {}) {
      if (!active) return [];
      return missionRuntime.record(eventName, payload);
    },
  };
}

export { DEFAULT_EVENT_MAP };
