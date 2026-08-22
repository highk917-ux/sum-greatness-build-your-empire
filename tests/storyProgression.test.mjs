import test from 'node:test';
import assert from 'node:assert/strict';
import { FOUNDATION_MISSIONS, StoryProgressionSystem } from '../src/story/progressionSystem.js';

test('first mission becomes available and locked missions stay locked', () => {
  const story = new StoryProgressionSystem({ missions: FOUNDATION_MISSIONS });
  assert.equal(story.getMission('welcome-to-san-diego').status, 'available');
  assert.equal(story.getMission('make-an-introduction').status, 'locked');
});

test('completing a mission unlocks its dependent mission', () => {
  const events = [];
  const story = new StoryProgressionSystem({
    missions: FOUNDATION_MISSIONS,
    onChange: (event) => events.push(event),
  });

  assert.equal(story.startMission('welcome-to-san-diego', 100), true);
  assert.equal(story.completeMission('welcome-to-san-diego', 200), true);

  const first = story.getMission('welcome-to-san-diego');
  const second = story.getMission('make-an-introduction');
  assert.equal(first.status, 'completed');
  assert.equal(first.startedAt, 100);
  assert.equal(first.completedAt, 200);
  assert.equal(second.status, 'available');
  assert.deepEqual(events.at(-1).unlocked, ['make-an-introduction']);
});

test('locked missions cannot start before prerequisites', () => {
  const story = new StoryProgressionSystem({ missions: FOUNDATION_MISSIONS });
  assert.equal(story.startMission('first-delivery'), false);
  assert.equal(story.getMission('first-delivery').status, 'locked');
});

test('mission progress serializes and hydrates safely', () => {
  const firstSession = new StoryProgressionSystem({ missions: FOUNDATION_MISSIONS });
  firstSession.startMission('welcome-to-san-diego', 100);
  firstSession.completeMission('welcome-to-san-diego', 200);
  firstSession.startMission('make-an-introduction', 300);

  const snapshot = firstSession.serialize();
  const secondSession = new StoryProgressionSystem({ missions: FOUNDATION_MISSIONS });
  assert.equal(secondSession.hydrate(snapshot), true);

  assert.equal(secondSession.getMission('welcome-to-san-diego').status, 'completed');
  assert.equal(secondSession.getMission('make-an-introduction').status, 'active');
  assert.equal(secondSession.getMission('make-an-introduction').startedAt, 300);
});

test('duplicate mission ids are rejected', () => {
  assert.throws(
    () => new StoryProgressionSystem({ missions: [{ id: 'same' }, { id: 'same' }] }),
    /Duplicate mission id/,
  );
});

test('unknown mission ids fail loudly for developer errors', () => {
  const story = new StoryProgressionSystem({ missions: FOUNDATION_MISSIONS });
  assert.throws(() => story.startMission('not-a-real-mission'), /Unknown mission id/);
});
