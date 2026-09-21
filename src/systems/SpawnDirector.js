import Phaser from 'phaser';
import { getSceneViewport } from './DisplayResolutionSystem.js';

const DEFAULT_CURVE = [
  { id: 'build', share: 0.24, durationShare: 0.24, batch: 2, pattern: 'scatter', pauseAfter: 450 },
  { id: 'escalate', share: 0.34, durationShare: 0.3, batch: 3, pattern: 'pulse', pauseAfter: 520 },
  { id: 'recover', share: 0.14, durationShare: 0.2, batch: 1, pattern: 'scatter', pauseAfter: 650 },
  { id: 'finale', share: 0.28, durationShare: 0.26, batch: 4, pattern: 'surround', pauseAfter: 0 }
];

const PRESSURE_BY_ROLE = Object.freeze({
  fodder: 1,
  runner: 1.2,
  tank: 1.45,
  shooter: 1.3,
  'area-denial': 1.4,
  exploder: 1.3,
  support: 1.4,
  summoner: 1.5
});

const PRESSURE_BY_SEGMENT = Object.freeze({
  build: 0.7,
  escalate: 1,
  recover: 0.55,
  finale: 1,
  'boss-entry': 1
});

const ADAPTIVE_PRESSURE_RATIO = 0.45;
const MIN_ADAPTIVE_CADENCE_MS = 360;
const MAX_ADAPTIVE_LOOKAHEAD_MS = 900;

export function allocateBudgets(total, segments) {
  const budgets = segments.map((segment) => Math.floor(total * segment.share));
  let remaining = total - budgets.reduce((sum, value) => sum + value, 0);
  let index = budgets.length - 1;
  while (remaining > 0) {
    budgets[index] += 1;
    remaining -= 1;
    index = (index - 1 + budgets.length) % budgets.length;
  }
  return budgets;
}

export class SpawnDirector {
  constructor(scene) {
    this.scene = scene;
    this.reset();
  }

  reset() {
    this.wave = null;
    this.queue = [];
    this.segments = [];
    this.segmentIndex = 0;
    this.segmentSpawned = 0;
    this.spawnedCount = 0;
    this.nextSpawnAt = Infinity;
    this.lastSpawnAt = null;
    this.pressureState = this.emptyPressureState();
    this.done = true;
  }

  start(wave, queue, startAt) {
    this.wave = wave;
    this.queue = [...queue];
    const curve = wave.pressureCurve?.length ? wave.pressureCurve : DEFAULT_CURVE;
    const budgets = allocateBudgets(queue.length, curve);
    const viewport = getSceneViewport(this.scene);
    const requestedTargetMs = wave.directorTargetDurationMs;
    const targetMs = (requestedTargetMs && typeof requestedTargetMs === 'object'
      ? (viewport.height > viewport.width ? requestedTargetMs.portrait : requestedTargetMs.desktop)
      : requestedTargetMs)
      ?? ((wave.targetDuration?.[0] ?? 25) + (wave.targetDuration?.[1] ?? 35)) * 500;
    this.segments = curve.map((segment, index) => {
      const budget = budgets[index];
      const batch = Math.max(1, segment.batch ?? 1);
      const pulses = Math.max(1, Math.ceil(budget / batch));
      const segmentDuration = targetMs * (segment.durationShare ?? segment.share);
      return {
        ...segment,
        budget,
        batch,
        cadence: Math.max(120, Math.floor(segmentDuration / pulses)),
        startedAt: null,
        adaptiveAdvanceMs: 0,
        adaptiveAdvances: 0,
        maxScheduleDebt: 0
      };
    });
    this.segmentIndex = 0;
    this.segmentSpawned = 0;
    this.spawnedCount = 0;
    this.nextSpawnAt = startAt;
    this.lastSpawnAt = null;
    this.segments[0] &&= { ...this.segments[0], startedAt: startAt };
    this.pressureState = this.emptyPressureState();
    this.done = queue.length === 0;
  }

  update(time, enemiesAlive) {
    if (this.done || !this.canSpawn(enemiesAlive)) {
      return 0;
    }
    const segment = this.segments[this.segmentIndex];
    if (!segment) {
      this.done = true;
      return 0;
    }
    this.pressureState = this.getPressureState(segment, time);
    const advancing = this.shouldAdvancePulse(time, segment, this.pressureState);
    if (time < this.nextSpawnAt && !advancing) {
      return 0;
    }
    const remainingInSegment = segment.budget - this.segmentSpawned;
    const remainingTotal = this.queue.length - this.spawnedCount;
    const batchSize = Math.min(segment.batch, remainingInSegment, remainingTotal);
    const configs = this.queue.slice(this.spawnedCount, this.spawnedCount + batchSize);
    const spawned = this.spawnFormation(configs, segment.pattern ?? 'scatter');
    this.spawnedCount += spawned;
    this.segmentSpawned += spawned;
    const pulledMs = advancing ? Math.max(0, this.nextSpawnAt - time) : 0;
    if (advancing && pulledMs > 0) {
      segment.adaptiveAdvanceMs += pulledMs;
      segment.adaptiveAdvances += 1;
      this.scene.telemetry.record('adaptivePulseAdvanced', time, {
        wave: this.scene.waveSystem.currentWave,
        segment: segment.id,
        pressure: this.pressureState.weightedVisible,
        pressureTarget: this.pressureState.target,
        scheduleDebt: this.pressureState.scheduleDebt,
        pulledMs
      });
    }
    this.lastSpawnAt = time;
    this.nextSpawnAt = time + segment.cadence;

    if (this.segmentSpawned >= segment.budget || this.spawnedCount >= this.queue.length) {
      this.segmentIndex += 1;
      this.segmentSpawned = 0;
      this.nextSpawnAt = time + (segment.pauseAfter ?? 0);
      const nextSegment = this.segments[this.segmentIndex];
      if (nextSegment) {
        nextSegment.startedAt = this.nextSpawnAt;
      }
    }
    if (this.spawnedCount >= this.queue.length) {
      this.done = true;
    }
    return spawned;
  }

  emptyPressureState() {
    return {
      weightedVisible: 0,
      visibleEnemies: 0,
      unseenEnemies: 0,
      unseenLimit: 0,
      target: 0,
      ratio: 0,
      scheduleDebt: 0,
      adaptiveEligible: false
    };
  }

  isAdaptiveWave() {
    return this.scene.adaptiveSpawnsEnabled !== false
      && this.wave?.adaptiveSpawns !== false
      && !this.wave?.bossWave
      && !this.wave?.encounter
      && !this.wave?.primaryRoles?.includes('boss');
  }

  getPressureState(segment, time) {
    const view = this.scene.cameras.main.worldView;
    const visibleEnemies = this.scene.enemies.filter((enemy) => (
      enemy.sprite?.active
      && enemy.sprite.x >= view.x
      && enemy.sprite.x <= view.x + view.width
      && enemy.sprite.y >= view.y
      && enemy.sprite.y <= view.y + view.height
    ));
    const weightedVisible = visibleEnemies.reduce((total, enemy) => (
      total + this.getEnemyPressure(enemy)
    ), 0);
    const { width, height } = getSceneViewport(this.scene);
    const mobile = Math.min(width, height) <= 600;
    const baseTarget = Phaser.Math.Clamp(
      (this.wave?.targetPeak ?? 30) * (mobile ? 0.055 : 0.07),
      2,
      mobile ? 6 : 8
    );
    const target = baseTarget * (PRESSURE_BY_SEGMENT[segment.id] ?? 1);
    const unseenEnemies = Math.max(0, this.scene.enemies.length - visibleEnemies.length);
    const unseenLimit = Math.max(segment.batch * 2, Math.ceil(target * 2));
    const scheduleDebt = this.getScheduleDebt(segment, time);
    segment.maxScheduleDebt = Math.max(segment.maxScheduleDebt, scheduleDebt);
    return {
      weightedVisible,
      visibleEnemies: visibleEnemies.length,
      unseenEnemies,
      unseenLimit,
      target,
      ratio: target > 0 ? weightedVisible / target : 1,
      scheduleDebt,
      adaptiveEligible: this.isAdaptiveWave()
    };
  }

  getEnemyPressure(enemy) {
    let pressure = PRESSURE_BY_ROLE[enemy.role] ?? 1;
    if (enemy.elite || enemy.champion) pressure *= 1.5;
    return pressure;
  }

  getScheduleDebt(segment, time) {
    if (segment.startedAt === null || time <= segment.startedAt) {
      return 0;
    }
    const plannedPulses = Math.min(
      Math.ceil(segment.budget / segment.batch),
      Math.floor((time - segment.startedAt) / segment.cadence) + 1
    );
    return Math.max(0, plannedPulses * segment.batch - this.segmentSpawned);
  }

  shouldAdvancePulse(time, segment, pressure) {
    if (!pressure.adaptiveEligible || time >= this.nextSpawnAt || this.segmentSpawned >= segment.budget) {
      return false;
    }
    if (this.scene.combatFeedback?.activeTelegraphs > 0) {
      return false;
    }
    if (pressure.unseenEnemies >= pressure.unseenLimit) {
      return false;
    }
    const minimumCadence = Math.max(MIN_ADAPTIVE_CADENCE_MS, Math.floor(segment.cadence * 0.45));
    if (this.lastSpawnAt !== null && time - this.lastSpawnAt < minimumCadence) {
      return false;
    }
    const maxAdvanceMs = Math.min(MAX_ADAPTIVE_LOOKAHEAD_MS, Math.floor(segment.cadence * 0.9));
    const pulledMs = this.nextSpawnAt - time;
    if (pulledMs > MAX_ADAPTIVE_LOOKAHEAD_MS || segment.adaptiveAdvanceMs + pulledMs > maxAdvanceMs) {
      return false;
    }
    return pressure.ratio < ADAPTIVE_PRESSURE_RATIO;
  }

  canSpawn(enemiesAlive) {
    const { width, height } = getSceneViewport(this.scene);
    const mobile = Math.min(width, height) <= 600;
    const cap = mobile
      ? this.wave.mobileActiveCap ?? this.wave.targetPeak ?? 60
      : this.wave.activeCap ?? Math.ceil((this.wave.targetPeak ?? 60) * 1.15);
    return enemiesAlive < cap;
  }

  spawnFormation(configs, pattern) {
    if (!configs.length) {
      return 0;
    }
    const points = this.getFormationPoints(
      pattern,
      configs.length,
      this.wave.spawnMinDistance ?? 260
    );
    let spawned = 0;
    configs.forEach((config, index) => {
      const point = points[index] ?? this.scene.entities.findSafeEdgeSpawn(this.wave.spawnMinDistance ?? 260);
      if (this.scene.entities.spawnEnemyAt(config, point.x, point.y)) {
        spawned += 1;
      }
    });
    return spawned;
  }

  getFormationPoints(pattern, count, minDistance) {
    if (pattern === 'scatter') {
      const startSide = this.wave.spawnPlayerLeading
        ? 0
        : this.scene.rng.int(0, 3, 'camera-spawn-side');
      return Array.from({ length: count }, (_, index) => (
        this.scene.entities.findSafeCameraSpawn(minDistance, {
          sideOffset: startSide + index,
          targetBuffer: this.wave.spawnTargetBuffer,
          preferPlayerVelocity: this.wave.spawnPlayerLeading,
          approachDistance: this.wave.spawnApproachDistance
        })
      ));
    }
    // Every Wave-1 pulse uses the same player-leading camera rim. Without
    // this, the final single-enemy pulse can trail a moving player offscreen
    // and turn the learning wave into an empty wait.
    if (this.wave.spawnPlayerLeading && (pattern === 'pulse' || pattern === 'surround')) {
      return Array.from({ length: count }, (_, index) => (
        this.scene.entities.findSafeCameraSpawn(minDistance, {
          sideOffset: index,
          formationIndex: index,
          formationCount: count,
          targetBuffer: this.wave.spawnTargetBuffer,
          preferPlayerVelocity: true,
          approachDistance: pattern === 'pulse'
            ? this.wave.spawnPulseApproachDistance
            : this.wave.spawnApproachDistance
        })
      ));
    }
    if (pattern === 'surround') {
      if (this.wave.spawnEdgePreference === 'nearest-safe') {
        const edge = this.pickSpawnEdge(minDistance);
        return Array.from({ length: count }, (_, index) => (
          this.pointOnEdge(edge, index, count, minDistance)
        ));
      }
      const startEdge = this.scene.rng.int(0, 3, 'spawn-formation');
      return Array.from({ length: count }, (_, index) => (
        this.pointOnEdge((startEdge + index) % 4, index, count, minDistance)
      ));
    }
    const edge = this.pickSpawnEdge(minDistance);
    return Array.from({ length: count }, (_, index) => (
      this.pointOnEdge(edge, index, count, minDistance, pattern === 'rusher-line' ? 72 : 44)
    ));
  }

  pickSpawnEdge(minDistance) {
    const candidates = Array.from({ length: 4 }, (_, edge) => ({
      edge,
      point: this.pointOnEdge(edge, 0, 1, minDistance)
    }));
    const nearestSafe = this.wave.spawnEdgePreference === 'nearest-safe';
    return candidates.sort((a, b) => (
      nearestSafe ? a.point.distance - b.point.distance : b.point.distance - a.point.distance
    ))[0].edge;
  }

  pointOnEdge(edge, index, count, minDistance, spacing = 58) {
    const cameraPoint = this.scene.entities.findSafeCameraSpawn(minDistance, {
      sideOffset: edge,
      formationIndex: index,
      formationCount: count,
      spacing,
      targetBuffer: this.wave.spawnTargetBuffer,
      approachDistance: this.wave.spawnApproachDistance
    });
    if (cameraPoint.source === 'camera-band') {
      return cameraPoint;
    }

    const margin = 66;
    const bounds = this.scene.arena?.combatBounds ?? {
      x: 0,
      y: 0,
      width: this.scene.entities.arenaWidth,
      height: this.scene.entities.arenaHeight
    };
    const width = bounds.width;
    const height = bounds.height;
    const player = this.scene.player.sprite;
    const offset = (index - (count - 1) / 2) * spacing;
    const horizontal = edge === 0 || edge === 2;
    const center = horizontal
      ? this.scene.rng.int(bounds.x + margin, bounds.x + width - margin, 'spawn-formation')
      : this.scene.rng.int(bounds.y + margin, bounds.y + height - margin, 'spawn-formation');
    let x = horizontal
      ? Phaser.Math.Clamp(center + offset, bounds.x + margin, bounds.x + width - margin)
      : (edge === 1 ? bounds.x + width - margin : bounds.x + margin);
    let y = horizontal
      ? (edge === 0 ? bounds.y + margin : bounds.y + height - margin)
      : Phaser.Math.Clamp(center + offset, bounds.y + margin, bounds.y + height - margin);
    let distance = Phaser.Math.Distance.Between(x, y, player.x, player.y);
    if (distance < minDistance || this.scene.arena?.overlapsObstacle(x, y, 38)) {
      const fallback = this.scene.entities.findSafeEdgeSpawn(minDistance);
      x = fallback.x;
      y = fallback.y;
      distance = fallback.distance;
    }
    return { x, y, distance };
  }

  getState() {
    return {
      done: this.done,
      spawned: this.spawnedCount,
      total: this.queue.length,
      segment: this.segments[this.segmentIndex]?.id ?? 'complete',
      segmentIndex: this.segmentIndex,
      nextSpawnAt: this.nextSpawnAt,
      adaptiveEnabled: this.isAdaptiveWave(),
      pressure: { ...this.pressureState },
      adaptiveAdvances: this.segments.reduce((total, segment) => total + segment.adaptiveAdvances, 0),
      adaptiveAdvanceMs: this.segments.reduce((total, segment) => total + segment.adaptiveAdvanceMs, 0),
      maxScheduleDebt: this.segments.reduce((maximum, segment) => (
        Math.max(maximum, segment.maxScheduleDebt)
      ), 0)
    };
  }
}
