import { FOUNDATION_OBJECTIVES, ObjectiveTracker } from './objectiveTracker.js';
import { FOUNDATION_MISSIONS, StoryProgressionSystem } from './progressionSystem.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class MissionRuntime {
  constructor({
    missions = FOUNDATION_MISSIONS,
    objectivesByMission = FOUNDATION_OBJECTIVES,
    onChange = null,
  } = {}) {
    this.objectivesByMission = objectivesByMission;
    this.onChange = typeof onChange === 'function' ? onChange : null;
    this.trackers = new Map();

    this.progression = new StoryProgressionSystem({
      missions,
      onChange: (event) => this.handleProgressionChange(event),
    });
  }

  getMission(id) {
    return this.progression.getMission(id);
  }

  getActiveMissions() {
    return this.progression.getActiveMissions();
  }

  startMission(id, now = Date.now()) {
    const started = this.progression.startMission(id, now);
    if (!started) return false;
    this.ensureTracker(id);
    return true;
  }

  record(eventName, payload = {}) {
    const changes = [];
    for (const mission of this.progression.getActiveMissions()) {
      const tracker = this.ensureTracker(mission.id);
      const changed = tracker.record(eventName, payload);
      if (changed.length) {
        changes.push({ missionId: mission.id, changed });
      }
    }
    return changes;
  }

  ensureTracker(missionId) {
    if (this.trackers.has(missionId)) return this.trackers.get(missionId);

    const objectives = this.objectivesByMission[missionId] || [];
    const tracker = new ObjectiveTracker({
      objectives,
      onChange: ({ event, changed, snapshot }) => {
        this.emitChange('mission-objective-progress', {
          missionId,
          event,
          changed,
          objectiveSnapshot: snapshot,
        });
      },
      onComplete: () => {
        this.progression.completeMission(missionId);
      },
    });

    this.trackers.set(missionId, tracker);

    if (objectives.length === 0) {
      this.progression.completeMission(missionId);
    }

    return tracker;
  }

  serialize() {
    const objectives = {};
    for (const [missionId, tracker] of this.trackers) {
      objectives[missionId] = tracker.snapshot();
    }
    return {
      version: 1,
      progression: this.progression.serialize(),
      objectives,
    };
  }

  hydrate(snapshot) {
    if (!snapshot || snapshot.version !== 1 || !snapshot.progression) return false;
    if (!this.progression.hydrate(snapshot.progression)) return false;

    for (const mission of this.progression.getActiveMissions()) {
      const tracker = this.ensureTracker(mission.id);
      const savedTracker = snapshot.objectives?.[mission.id];
      if (savedTracker) tracker.hydrate(savedTracker);
    }

    this.emitChange('mission-runtime-hydrated', { snapshot: this.serialize() });
    return true;
  }

  getMissionSnapshot(id) {
    const mission = this.progression.getMission(id);
    if (!mission) return null;
    const tracker = this.trackers.get(id);
    return {
      ...mission,
      objectives: tracker ? tracker.snapshot() : null,
    };
  }

  handleProgressionChange(event) {
    this.emitChange(event.type, event);
  }

  emitChange(type, detail = {}) {
    if (!this.onChange) return;
    const payload = clone({ type, ...detail });
    this.onChange(payload);
  }
}
