import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameplayEventBridge } from '../src/story/gameplayEventBridge.js';

class FakeTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(listener);
  }
  removeEventListener(name, listener) {
    this.listeners.get(name)?.delete(listener);
  }
  dispatch(name, detail = {}) {
    for (const listener of this.listeners.get(name) || []) listener({ detail });
  }
}

test('bridge converts gameplay events into mission runtime records', () => {
  const calls = [];
  const target = new FakeTarget();
  const bridge = createGameplayEventBridge({
    target,
    missionRuntime: { record: (eventName, payload) => calls.push({ eventName, payload }) },
  });

  assert.equal(bridge.connect(), true);
  target.dispatch('sumgreatness:item-picked-up', { itemId: 'package-1' });

  assert.deepEqual(calls, [
    { eventName: 'item-picked-up', payload: { itemId: 'package-1' } },
  ]);
  assert.equal(bridge.disconnect(), true);
});

test('bridge supports disabling without removing listeners', () => {
  const calls = [];
  const target = new FakeTarget();
  const bridge = createGameplayEventBridge({
    target,
    missionRuntime: { record: (eventName, payload) => calls.push({ eventName, payload }) },
  });

  bridge.connect();
  bridge.setEnabled(false);
  target.dispatch('sumgreatness:door-opened', { doorId: 'shop-front' });
  assert.equal(calls.length, 0);

  bridge.setEnabled(true);
  target.dispatch('sumgreatness:door-opened', { doorId: 'shop-front' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].eventName, 'door-opened');
});

test('bridge connect and disconnect are idempotent', () => {
  const target = new FakeTarget();
  const bridge = createGameplayEventBridge({
    target,
    missionRuntime: { record: () => [] },
  });

  assert.equal(bridge.connect(), true);
  assert.equal(bridge.connect(), false);
  assert.equal(bridge.disconnect(), true);
  assert.equal(bridge.disconnect(), false);
});

test('bridge can record directly when no DOM event is available', () => {
  const calls = [];
  const bridge = createGameplayEventBridge({
    target: null,
    missionRuntime: { record: (eventName, payload) => {
      calls.push({ eventName, payload });
      return ['changed'];
    } },
  });

  assert.equal(bridge.connect(), false);
  assert.deepEqual(bridge.record('npc-gesture', { gesture: 'wave' }), ['changed']);
  assert.deepEqual(calls[0], { eventName: 'npc-gesture', payload: { gesture: 'wave' } });
});
