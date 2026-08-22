import test from 'node:test';
import assert from 'node:assert/strict';
import { createMissionSaveStore } from '../src/story/missionSaveStore.js';

function createStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test('mission save store persists and restores runtime snapshots', () => {
  const storage = createStorage();
  let hydrated = null;
  const runtime = {
    serialize: () => ({ version: 1, progression: { version: 1 }, objectives: {} }),
    hydrate: (snapshot) => { hydrated = snapshot; return true; },
  };
  const store = createMissionSaveStore({ missionRuntime: runtime, storage });

  assert.equal(store.save(), true);
  assert.equal(store.load(), true);
  assert.equal(hydrated.version, 1);
});

test('mission save store handles missing or corrupt saves safely', () => {
  const storage = createStorage();
  const runtime = { serialize: () => ({}), hydrate: () => true };
  const store = createMissionSaveStore({ missionRuntime: runtime, storage });

  assert.equal(store.load(), false);
  storage.setItem(store.key, '{broken-json');
  assert.equal(store.load(), false);
});

test('mission save store clears saved state', () => {
  const storage = createStorage();
  const runtime = { serialize: () => ({ version: 1 }), hydrate: () => true };
  const store = createMissionSaveStore({ missionRuntime: runtime, storage });

  store.save();
  assert.equal(store.clear(), true);
  assert.equal(store.load(), false);
});
