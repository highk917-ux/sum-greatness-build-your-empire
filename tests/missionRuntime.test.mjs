import test from 'node:test';
import assert from 'node:assert/strict';
import { MissionRuntime } from '../src/story/missionRuntime.js';

test('mission runtime completes active missions from gameplay events and unlocks the next mission', () => {
  const runtime = new MissionRuntime();

  assert.equal(runtime.getMission('welcome-to-san-diego').status, 'available');
  assert.equal(runtime.startMission('welcome-to-san-diego', 100), true);

  runtime.record('player-moved');
  runtime.record('camera-rotated');
  runtime.record('interaction-focused');

  assert.equal(runtime.getMission('welcome-to-san-diego').status, 'completed');
  assert.equal(runtime.getMission('make-an-introduction').status, 'available');
});

test('mission runtime routes events only to active mission trackers', () => {
  const runtime = new MissionRuntime();
  runtime.startMission('welcome-to-san-diego');

  runtime.record('npc-gesture', { gesture: 'wave' });
  const intro = runtime.getMissionSnapshot('make-an-introduction');

  assert.equal(intro.status, 'locked');
  assert.equal(intro.objectives, null);
});

test('mission runtime preserves objective progress across save and restore', () => {
  const first = new MissionRuntime();
  first.startMission('welcome-to-san-diego', 100);
  first.record('player-moved');
  first.record('camera-rotated');

  const saved = first.serialize();
  const second = new MissionRuntime();

  assert.equal(second.hydrate(saved), true);
  assert.equal(second.getMission('welcome-to-san-diego').status, 'active');
  assert.equal(second.getMissionSnapshot('welcome-to-san-diego').objectives.completed, false);

  second.record('interaction-focused');
  assert.equal(second.getMission('welcome-to-san-diego').status, 'completed');
});

test('mission runtime emits objective and mission completion updates', () => {
  const events = [];
  const runtime = new MissionRuntime({ onChange: (event) => events.push(event.type) });

  runtime.startMission('welcome-to-san-diego');
  runtime.record('player-moved');
  runtime.record('camera-rotated');
  runtime.record('interaction-focused');

  assert.equal(events.includes('mission-objective-progress'), true);
  assert.equal(events.includes('mission-completed'), true);
  assert.equal(events.includes('missions-available'), false);
});
