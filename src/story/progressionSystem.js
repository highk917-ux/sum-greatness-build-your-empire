const VALID_STATUSES = new Set(['locked', 'available', 'active', 'completed']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeMission(mission, index) {
  if (!mission || typeof mission !== 'object') {
    throw new TypeError(`Mission at index ${index} must be an object`);
  }
  if (!mission.id || typeof mission.id !== 'string') {
    throw new TypeError(`Mission at index ${index} requires a string id`);
  }

  const prerequisites = Array.isArray(mission.prerequisites)
    ? [...new Set(mission.prerequisites.filter(Boolean))]
    : [];

  return {
    id: mission.id,
    title: mission.title || mission.id,
    description: mission.description || '',
    prerequisites,
    rewards: mission.rewards ? clone(mission.rewards) : {},
    metadata: mission.metadata ? clone(mission.metadata) : {},
  };
}

export class StoryProgressionSystem {
  constructor({ missions = [], onChange = null } = {}) {
    this.onChange = typeof onChange === 'function' ? onChange : null;
    this.missions = new Map();
    this.order = [];
    this.state = new Map();

    missions.forEach((rawMission, index) => {
      const mission = normalizeMission(rawMission, index);
      if (this.missions.has(mission.id)) {
        throw new Error(`Duplicate mission id: ${mission.id}`);
      }
      this.missions.set(mission.id, mission);
      this.order.push(mission.id);
      this.state.set(mission.id, {
        status: 'locked',
        startedAt: null,
        completedAt: null,
      });
    });

    this.refreshAvailability({ silent: true });
  }

  hasMission(id) {
    return this.missions.has(id);
  }

  getMission(id) {
    const mission = this.missions.get(id);
    if (!mission) return null;
    return { ...clone(mission), ...clone(this.state.get(id)) };
  }

  getAllMissions() {
    return this.order.map((id) => this.getMission(id));
  }

  getAvailableMissions() {
    return this.getAllMissions().filter((mission) => mission.status === 'available');
  }

  getActiveMissions() {
    return this.getAllMissions().filter((mission) => mission.status === 'active');
  }

  arePrerequisitesComplete(id) {
    const mission = this.missions.get(id);
    if (!mission) return false;
    return mission.prerequisites.every(
      (prerequisiteId) => this.state.get(prerequisiteId)?.status === 'completed',
    );
  }

  refreshAvailability({ silent = false } = {}) {
    const newlyAvailable = [];

    for (const id of this.order) {
      const missionState = this.state.get(id);
      if (missionState.status !== 'locked') continue;
      if (this.arePrerequisitesComplete(id)) {
        missionState.status = 'available';
        newlyAvailable.push(id);
      }
    }

    if (!silent && newlyAvailable.length) {
      this.emitChange('missions-available', { missionIds: newlyAvailable });
    }
    return newlyAvailable;
  }

  startMission(id, now = Date.now()) {
    const missionState = this.requireState(id);
    if (missionState.status === 'completed') return false;
    if (missionState.status === 'locked') {
      this.refreshAvailability({ silent: true });
    }
    if (missionState.status !== 'available') return false;

    missionState.status = 'active';
    missionState.startedAt = missionState.startedAt ?? now;
    this.emitChange('mission-started', { missionId: id });
    return true;
  }

  completeMission(id, now = Date.now()) {
    const missionState = this.requireState(id);
    if (missionState.status === 'completed') return false;
    if (missionState.status !== 'active') return false;

    missionState.status = 'completed';
    missionState.completedAt = now;
    const unlocked = this.refreshAvailability({ silent: true });
    this.emitChange('mission-completed', {
      missionId: id,
      rewards: clone(this.missions.get(id).rewards),
      unlocked,
    });
    return true;
  }

  setStatus(id, status, { startedAt = null, completedAt = null, silent = false } = {}) {
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`Invalid mission status: ${status}`);
    }
    const missionState = this.requireState(id);
    missionState.status = status;
    missionState.startedAt = startedAt;
    missionState.completedAt = completedAt;
    this.refreshAvailability({ silent: true });
    if (!silent) this.emitChange('mission-status-changed', { missionId: id, status });
  }

  serialize() {
    const missionState = {};
    for (const id of this.order) {
      missionState[id] = clone(this.state.get(id));
    }
    return {
      version: 1,
      missions: missionState,
    };
  }

  hydrate(snapshot) {
    if (!snapshot || snapshot.version !== 1 || !snapshot.missions) return false;

    for (const id of this.order) {
      const saved = snapshot.missions[id];
      if (!saved || !VALID_STATUSES.has(saved.status)) continue;
      this.state.set(id, {
        status: saved.status,
        startedAt: saved.startedAt ?? null,
        completedAt: saved.completedAt ?? null,
      });
    }

    this.refreshAvailability({ silent: true });
    this.emitChange('progress-hydrated', {});
    return true;
  }

  requireState(id) {
    const missionState = this.state.get(id);
    if (!missionState) throw new Error(`Unknown mission id: ${id}`);
    return missionState;
  }

  emitChange(type, detail) {
    if (!this.onChange) return;
    this.onChange({ type, ...detail, snapshot: this.serialize() });
  }
}

export const FOUNDATION_MISSIONS = Object.freeze([
  {
    id: 'welcome-to-san-diego',
    title: 'Welcome to San Diego',
    description: 'Learn movement, camera control, and how to approach an interactable.',
    rewards: { cash: 250 },
    metadata: { category: 'tutorial', interaction: 'movement' },
  },
  {
    id: 'make-an-introduction',
    title: 'Make an Introduction',
    description: 'Meet a local contact and use the NPC interaction system.',
    prerequisites: ['welcome-to-san-diego'],
    rewards: { cash: 150, reputation: 1 },
    metadata: { category: 'tutorial', interaction: 'npc' },
  },
  {
    id: 'first-delivery',
    title: 'First Delivery',
    description: 'Pick up, carry, and place a package at the marked destination.',
    prerequisites: ['make-an-introduction'],
    rewards: { cash: 500, reputation: 1 },
    metadata: { category: 'business', interaction: 'pickup-carry-place' },
  },
  {
    id: 'open-for-business',
    title: 'Open for Business',
    description: 'Enter your first business location and complete the opening objective.',
    prerequisites: ['first-delivery'],
    rewards: { cash: 750, reputation: 2 },
    metadata: { category: 'business', interaction: 'door-portal' },
  },
]);
