import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ensureTestServer,
  loadPlaywright,
  projectRoot,
  stopTestServer
} from './helpers/test-runtime.mjs';

const artifactDir = path.join(projectRoot, 'test-results');
const WAVE_TIMEOUT_MS = 55000;
const strictComparison = process.env.ADAPTIVE_COMPARE_STRICT !== '0';
const viewports = [
  { id: 'desktop', width: 960, height: 540, activeCap: 20 },
  { id: 'portrait', width: 390, height: 844, activeCap: 18 }
];

function assert(condition, message, details) {
  if (!condition) {
    throw new Error(`${message}\n${JSON.stringify(details ?? {}, null, 2)}`);
  }
}

async function runWave(browser, serverUrl, { viewport, adaptive }) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  try {
    const url = new URL(serverUrl);
    url.searchParams.set('seed', `phase-2-${viewport.id}`);
    url.searchParams.set('profile', 'average');
    url.searchParams.set('arena', 'open-yard');
    if (!adaptive) url.searchParams.set('adaptiveSpawns', '0');
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__ROOSTER_TEST__?.startWave, null, { timeout: 5000 });
    await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      api.selectRooster('ace');
      api.pauseWaves();
      api.clearEnemies();
      api.clearProjectiles();
      api.enableBot('average');
      api.startWave(1);
    });
    await page.waitForTimeout(180);
    const initialSpawn = await page.evaluate(() => ({
      bounds: window.__ROOSTER_TEST__.getTargetAcquisitionState().bounds,
      player: window.__ROOSTER_TEST__.getState().player,
      enemies: window.__ROOSTER_TEST__.getEnemySnapshot().map((enemy) => ({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        velocityX: enemy.velocityX,
        velocityY: enemy.velocityY
      }))
    }));
    const startedAt = Date.now();
    while (Date.now() - startedAt < WAVE_TIMEOUT_MS) {
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => window.__ROOSTER_TEST__.getState());
      const wave = state.telemetry.waves.find((entry) => entry.wave === 1);
      if (wave?.outcome === 'completed' || state.gameEnded) break;
    }
    const result = await page.evaluate(() => {
      const state = window.__ROOSTER_TEST__.getState();
      const wave = state.telemetry.waves.find((entry) => entry.wave === 1);
      return {
        waveOutcome: wave?.outcome ?? 'missing',
        waveDurationMs: wave?.durationMs ?? 0,
        maxEnemiesAlive: wave?.maxEnemiesAlive ?? 0,
        visibility: wave?.visibility ?? null,
        waveStartedAt: wave?.startedAt ?? null,
        segments: state.telemetry.segments.filter((segment) => segment.wave === 1),
        adaptive: state.telemetry.adaptive,
        director: window.__ROOSTER_TEST__.getSpawnDirectorState(),
        lastError: state.lastError
      };
    });
    const report = { viewport: viewport.id, adaptive, errors, initialSpawn, ...result };
    assert(errors.length === 0 && !result.lastError && result.waveOutcome === 'completed',
      'Adaptive spawn scenario did not finish cleanly.', report);
    assert(result.maxEnemiesAlive <= viewport.activeCap,
      'Adaptive spawn scenario exceeded the hard active cap.', report);
    return report;
  } finally {
    await page.close();
  }
}

async function testBossExclusion(browser, serverUrl) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  try {
    await page.goto(`${serverUrl}?seed=phase-2-boss&profile=average`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__ROOSTER_TEST__?.startWave, null, { timeout: 5000 });
    const result = await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      api.pauseWaves();
      api.clearEnemies();
      api.startWave(10);
      return api.getSpawnDirectorState();
    });
    assert(result.adaptiveEnabled === false && result.adaptiveAdvances === 0,
      'Boss wave was not excluded from adaptive spawning.', result);
    return result;
  } finally {
    await page.close();
  }
}

async function run() {
  const { server, url } = await ensureTestServer();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  try {
    const baselines = [];
    const adaptive = [];
    for (const viewport of viewports) {
      baselines.push(await runWave(browser, url, { viewport, adaptive: false }));
      adaptive.push(await runWave(browser, url, { viewport, adaptive: true }));
    }
    const comparison = adaptive.map((entry) => {
      const baseline = baselines.find((candidate) => candidate.viewport === entry.viewport);
      return {
        viewport: entry.viewport,
        baselineMaxZeroVisibleMs: baseline.visibility.maxZeroVisibleMs,
        adaptiveMaxZeroVisibleMs: entry.visibility.maxZeroVisibleMs,
        adaptiveDurationMs: entry.waveDurationMs,
        adaptiveEnabled: entry.segments.some((segment) => segment.adaptiveAdvances > 0),
        adaptiveAdvances: entry.adaptive.spawnAdvances,
        advanceMs: entry.adaptive.totalAdvanceMs
      };
    });
    const boss = await testBossExclusion(browser, url);
    const report = { generatedAt: new Date().toISOString(), baselines, adaptive, comparison, boss };
    await fs.mkdir(artifactDir, { recursive: true });
    await fs.writeFile(path.join(artifactDir, 'adaptive-spawn-report.json'), JSON.stringify(report, null, 2));
    if (strictComparison) {
      comparison.forEach((entry) => {
        if (entry.adaptiveEnabled) {
          assert(entry.adaptiveAdvances > 0,
            'Adaptive director never advanced a pulse during the low-pressure scenario.', entry);
          assert(entry.adaptiveMaxZeroVisibleMs <= 2000,
            'Adaptive director exceeded the two-second visible-threat gap.', entry);
          if (entry.baselineMaxZeroVisibleMs > 2000) {
            assert(entry.adaptiveMaxZeroVisibleMs <= entry.baselineMaxZeroVisibleMs,
              'Adaptive director did not reduce a failing zero-visible interval.', entry);
          }
          assert(entry.adaptiveDurationMs >= 22000 && entry.adaptiveDurationMs <= 28000,
            'Adaptive Wave 1 fell outside its 22–28 second duration target.', entry);
        } else {
          assert(entry.adaptiveMaxZeroVisibleMs <= 2000,
            'Static Wave 1 exceeded the two-second visible-threat gap.', entry);
          assert(entry.adaptiveDurationMs >= 22000 && entry.adaptiveDurationMs <= 28000,
            'Static Wave 1 fell outside its 22–28 second duration target.', entry);
        }
      });
    }
    console.log(strictComparison ? 'Adaptive spawn gate passed.' : 'Adaptive spawn diagnostic completed.');
    console.log(JSON.stringify(comparison, null, 2));
  } finally {
    await browser.close();
    await stopTestServer(server);
  }
}

run().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
