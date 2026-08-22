function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeObjective(objective, index) {
  if (!objective || typeof objective !== 'object') {
    throw new TypeError(`Objective at index ${index} must be an object`);
  }
  if (!objective.id || typeof objective.id !== 'string') {
    throw new TypeError(`Objective at index ${index} requires a string id`);
  }
  if (!objective.event || typeof objective.event !== 'string') {
    throw new TypeError(`Objective ${objective.id} requires an event name`);
  }

  return {
    id: objective.id,
    label: objective.label || objective.id,
    event: objective.event,
    target: Math.max(1, Number(objective.target) || 1),
    matcher: typeof objective.matcher === 'function' ? objective.matcher : null,
  };
}

export class ObjectiveTracker {
  constructor({ objectives = [], onChange = null, onComplete = null } = {}) {
    this.onChange = typeof onChange === 'function' ? onChange : null;
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;
    this.objectives = objectives.map(normalizeObjective);
    this.progress = new Map(this.objectives.map((objective) => [objective.id, 0]));
    this.completed = false;

    const ids = new Set();
    for (const objective of this.objectives) {
      if (ids.has(objective.id)) throw new Error(`Duplicate objective id: ${objective.id}`);
      ids.add(objective.id);
    }
  }

  record(eventName, payload = {}) {
    if (this.completed || typeof eventName !== 'string') return [];
    const changed = [];

    for (const objective of this.objectives) {
      if (objective.event !== eventName) continue;
      if (objective.matcher && !objective.matcher(payload)) continue;

      const current = this.progress.get(objective.id) ?? 0;
      if (current >= objective.target) continue;
      const next = Math.min(objective.target, current + 1);
      this.progress.set(objective.id, next);
      changed.push({ id: objective.id, progress: next, target: objective.target });
    }

    if (changed.length) {
      this.onChange?.({ event: eventName, changed, snapshot: this.snapshot() });
    }

    if (this.objectives.length > 0 && this.objectives.every((objective) => this.isObjectiveComplete(objective.id))) {
      this.completed = true;
      this.onComplete?.({ snapshot: this.snapshot() });
    }

    return changed;
  }

  isObjectiveComplete(id) {
    const objective = this.objectives.find((entry) => entry.id === id);
    if (!objective) return false;
    return (this.progress.get(id) ?? 0) >= objective.target;
  }

  getProgress(id) {
    const objective = this.objectives.find((entry) => entry.id === id);
    if (!objective) return null;
    const progress = this.progress.get(id) ?? 0;
    return {
      id,
      label: objective.label,
      progress,
      target: objective.target,
      complete: progress >= objective.target,
    };
  }

  snapshot() {
    return {
      completed: this.completed,
      objectives: this.objectives.map((objective) => this.getProgress(objective.id)),
    };
  }

  hydrate(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.objectives)) return false;
    for (const saved of snapshot.objectives) {
      const objective = this.objectives.find((entry) => entry.id === saved.id);
      if (!objective) continue;
      const progress = Math.max(0, Math.min(objective.target, Number(saved.progress) || 0));
      this.progress.set(objective.id, progress);
    }
    this.completed = this.objectives.length > 0 && this.objectives.every((objective) => this.isObjectiveComplete(objective.id));
    return true;
  }
}

export const FOUNDATION_OBJECTIVES = Object.freeze({
  'welcome-to-san-diego': [
    { id: 'move-player', label: 'Move through the neighborhood', event: 'player-moved', target: 1 },
    { id: 'use-camera', label: 'Rotate the camera', event: 'camera-rotated', target: 1 },
    { id: 'focus-interactable', label: 'Approach an interactable', event: 'interaction-focused', target: 1 },
  ],
  'make-an-introduction': [
    { id: 'greet-contact', label: 'Greet the local contact', event: 'npc-gesture', target: 1, matcher: (payload) => payload.gesture === 'wave' || payload.gesture === 'talk' },
  ],
  'first-delivery': [
    { id: 'pickup-package', label: 'Pick up the package', event: 'item-picked-up', target: 1 },
    { id: 'place-package', label: 'Place the package at the destination', event: 'item-placed', target: 1 },
  ],
  'open-for-business': [
    { id: 'open-door', label: 'Open the business entrance', event: 'door-opened', target: 1 },
    { id: 'enter-business', label: 'Enter the business', event: 'portal-entered', target: 1 },
  ],
});
