import test from 'node:test';
import assert from 'node:assert/strict';
import { FOUNDATION_OBJECTIVES, ObjectiveTracker } from '../src/story/objectiveTracker.js';

test('objective tracker records matching gameplay events', () => {
  const tracker = new ObjectiveTracker({ objectives: FOUNDATION_OBJECTIVES['first-delivery'] });
  tracker.record('item-picked-up', { itemId: 'package-01' });

  assert.equal(tracker.getProgress('pickup-package').complete, true);
  assert.equal(tracker.getProgress('place-package').complete, false);
  assert.equal(tracker.completed, false);
});

test('objective tracker completes only after all objectives are satisfied', () => {
  let completed = 0;
  const tracker = new ObjectiveTracker({
    objectives: FOUNDATION_OBJECTIVES['open-for-business'],
    onComplete: () => { completed += 1; },
  });

  tracker.record('door-opened');
  assert.equal(tracker.completed, false);
  tracker.record('portal-entered');
  assert.equal(tracker.completed, true);
  assert.equal(completed, 1);
  tracker.record('portal-entered');
  assert.equal(completed, 1);
});

test('objective matchers ignore unrelated NPC gestures', () => {
  const tracker = new ObjectiveTracker({ objectives: FOUNDATION_OBJECTIVES['make-an-introduction'] });

  tracker.record('npc-gesture', { gesture: 'point' });
  assert.equal(tracker.completed, false);
  tracker.record('npc-gesture', { gesture: 'wave' });
  assert.equal(tracker.completed, true);
});

test('multi-count objectives clamp at their target', () => {
  const tracker = new ObjectiveTracker({
    objectives: [{ id: 'three-steps', event: 'step', target: 3 }],
  });

  tracker.record('step');
  tracker.record('step');
  tracker.record('step');
  tracker.record('step');
  assert.deepEqual(tracker.getProgress('three-steps'), {
    id: 'three-steps',
    label: 'three-steps',
    progress: 3,
    target: 3,
    complete: true,
  });
});

test('objective state can be hydrated for save-game restoration', () => {
  const first = new ObjectiveTracker({ objectives: FOUNDATION_OBJECTIVES['first-delivery'] });
  first.record('item-picked-up');

  const second = new ObjectiveTracker({ objectives: FOUNDATION_OBJECTIVES['first-delivery'] });
  assert.equal(second.hydrate(first.snapshot()), true);
  assert.equal(second.getProgress('pickup-package').complete, true);
  assert.equal(second.getProgress('place-package').complete, false);
});
