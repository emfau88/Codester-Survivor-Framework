import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ensureTestServer,
  loadPlaywright,
  projectRoot,
  stopTestServer
} from './helpers/test-runtime.mjs';

const artifactDir = path.join(projectRoot, 'test-results');
const margins = (process.env.TARGET_MARGINS ?? '0.15,0.20,0.25')
  .split(',')
  .map(Number)
  .filter(Number.isFinite);
const seeds = (process.env.SPAWN_TARGET_SEEDS ?? 'phase-1-a,phase-1-b')
  .split(',')
  .filter(Boolean);
const viewports = [
  { id: 'desktop', width: 960, height: 540 },
  { id: 'portrait', width: 390, height: 844 }
];
const WAVE_TIMEOUT_MS = 55000;

function assert(condition, message, details) {
  if (!condition) {
    throw new Error(`${message}\n${JSON.stringify(details ?? {}, null, 2)}`);
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

async function runScenario(browser, serverUrl, { margin, seed, viewport }) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  try {
    const url = new URL(serverUrl);
    url.searchParams.set('seed', seed);
    url.searchParams.set('profile', 'average');
    url.searchParams.set('arena', 'open-yard');
    url.searchParams.set('targetMargin', String(margin));
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

    const startedAt = Date.now();
    while (Date.now() - startedAt < WAVE_TIMEOUT_MS) {
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => window.__ROOSTER_TEST__.getState());
      const wave = state.telemetry.waves.find((entry) => entry.wave === 1);
      if (state.gameEnded || wave?.outcome === 'completed') break;
    }

    const result = await page.evaluate(() => {
      const state = window.__ROOSTER_TEST__.getState();
      const wave = state.telemetry.waves.find((entry) => entry.wave === 1);
      const visibility = wave?.visibility ?? {};
      return {
        outcome: wave?.outcome ?? 'missing',
        durationMs: wave?.durationMs ?? 0,
        kills: wave?.kills ?? 0,
        offscreenKills: visibility.offscreenKills ?? 0,
        offscreenKillRate: (visibility.offscreenKills ?? 0) / Math.max(1, wave?.kills ?? 0),
        maxZeroVisibleMs: visibility.maxZeroVisibleMs ?? 0,
        totalZeroVisibleMs: visibility.totalZeroVisibleMs ?? 0,
        averageVisible: visibility.averageVisible ?? 0,
        averageTargetableOffscreen: visibility.averageTargetableOffscreen ?? 0,
        averageSpawnToFirstVisibleMs: visibility.averageSpawnToFirstVisibleMs,
        targetMargin: state.telemetry.targetAcquisitionMargin,
        gameEnded: state.gameEnded,
        lastError: state.lastError
      };
    });
    const report = { margin, seed, viewport: viewport.id, errors, ...result };
    assert(errors.length === 0 && !result.lastError,
      'Spawn/targeting scenario produced a browser error.', report);
    assert(result.outcome === 'completed',
      'Spawn/targeting scenario did not complete Wave 1.', report);
    return report;
  } finally {
    await page.close();
  }
}

function summarize(results) {
  return viewports.flatMap((viewport) => margins.map((margin) => {
    const entries = results.filter((entry) => entry.viewport === viewport.id && entry.margin === margin);
    const offscreenKillRate = median(entries.map((entry) => entry.offscreenKillRate));
    const maxZeroVisibleMs = Math.max(...entries.map((entry) => entry.maxZeroVisibleMs));
    return {
      viewport: viewport.id,
      margin,
      samples: entries.length,
      medianOffscreenKillRate: offscreenKillRate,
      worstZeroVisibleMs: maxZeroVisibleMs,
      medianFirstVisibleMs: median(entries
        .map((entry) => entry.averageSpawnToFirstVisibleMs)
        .filter(Number.isFinite)),
      medianTargetableOffscreen: median(entries.map((entry) => entry.averageTargetableOffscreen)),
      meetsPhaseOneGate: offscreenKillRate < (viewport.id === 'desktop' ? 0.05 : 0.1)
        && maxZeroVisibleMs <= 2000
    };
  }));
}

async function run() {
  assert(margins.length > 0, 'No target-acquisition margins were supplied.');
  const { server, url } = await ensureTestServer();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (const viewport of viewports) {
      for (const margin of margins) {
        for (const seed of seeds) {
          results.push(await runScenario(browser, url, { margin, seed, viewport }));
        }
      }
    }
    const summary = summarize(results);
    const report = {
      generatedAt: new Date().toISOString(),
      margins,
      seeds,
      results,
      summary
    };
    await fs.mkdir(artifactDir, { recursive: true });
    await fs.writeFile(
      path.join(artifactDir, 'spawn-targeting-report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('Spawn and targeting comparison completed.');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
    await stopTestServer(server);
  }
}

run().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
