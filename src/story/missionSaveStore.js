const DEFAULT_KEY = 'sum-greatness:mission-runtime:v1';

export function createMissionSaveStore({
  missionRuntime,
  storage = globalThis?.localStorage ?? null,
  key = DEFAULT_KEY,
} = {}) {
  if (!missionRuntime?.serialize || !missionRuntime?.hydrate) {
    throw new Error('Mission save store requires a MissionRuntime-like object');
  }

  function save() {
    if (!storage?.setItem) return false;
    try {
      storage.setItem(key, JSON.stringify(missionRuntime.serialize()));
      return true;
    } catch {
      return false;
    }
  }

  function load() {
    if (!storage?.getItem) return false;
    try {
      const raw = storage.getItem(key);
      if (!raw) return false;
      return missionRuntime.hydrate(JSON.parse(raw));
    } catch {
      return false;
    }
  }

  function clear() {
    if (!storage?.removeItem) return false;
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  return { key, save, load, clear };
}

export { DEFAULT_KEY as DEFAULT_MISSION_SAVE_KEY };
