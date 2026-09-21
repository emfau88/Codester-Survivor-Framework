import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ensureTestServer,
  loadPlaywright,
  projectRoot,
  stopTestServer
} from './helpers/test-runtime.mjs';

const artifactDir = path.join(projectRoot, 'test-results');
const seedCount = Math.max(1, Math.floor(Number(process.env.EARLY_PACING_SEEDS ?? 5)));
const concurrency = Math.max(1, Math.floor(Number(process.env.EARLY_PACING_CONCURRENCY ?? 1)));
const roosters = ['ace', 'artillery', 'storm'];
const viewports = [
  { id: 'desktop', width: 960, height: 540 },
  { id: 'portrait', width: 390, height: 844 }
];
const scenarios = roosters.flatMap((rooster) => viewports.flatMap((viewport) => (
  Array.from({ length: seedCount }, (_, index) => ({
    id: `${rooster}-${viewport.id}-${index + 1}`,
    rooster,
    seed: `early-${rooster}-${viewport.id}-${index + 1}`,
    viewport: { width: viewport.width, height: viewport.height }
  }))
)));
const FIRST_PICK_WINDOW_MS = [25000, 35000];

function assert(condition, message, details) {
  if (!condition) throw new Error(`${message}\n${JSON.stringify(details ?? {}, null, 2)}`);
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? null;
}

function summarize(results) {
  return Object.values(results.reduce((groups, result) => {
    const key = `${result.rooster}/${result.id.split('-')[1]}`;
    const group = groups[key] ?? { rooster: result.rooster, viewport: result.id.split('-')[1], results: [] };
    group.results.push(result);
    groups[key] = group;
    return groups;
  }, {})).map((group) => {
    const values = group.results.map((result) => result.firstUpgradeAtMs);
    return {
      rooster: group.rooster,
      viewport: group.viewport,
      samples: values.length,
      minMs: Math.min(...values),
      medianMs: percentile(values, 0.5),
      p90Ms: percentile(values, 0.9),
      maxMs: Math.max(...values),
      outsideProductionWindow: group.results.filter((result) => (
        result.firstUpgradeAtMs < FIRST_PICK_WINDOW_MS[0] || result.firstUpgradeAtMs > FIRST_PICK_WINDOW_MS[1]
      )).map((result) => result.id)
    };
  });
}

async function runScenario(browser, serverUrl, scenario) {
  const page = await browser.newPage({ viewport: scenario.viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  try {
    const url = new URL(serverUrl);
    url.searchParams.set('seed', scenario.seed);
    url.searchParams.set('profile', 'average');
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__ROOSTER_TEST__?.getState, null, { timeout: 5000 });
    await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      api.unlockAllMeta();
      api.selectMetaChallenge('standard');
      api.restart();
    });
    await page.waitForFunction(() => window.__ROOSTER_TEST__?.getChallengeState().id === 'standard');
    await page.evaluate((rooster) => {
      const api = window.__ROOSTER_TEST__;
      api.selectRooster(rooster);
      api.enableBot('average');
    }, scenario.rooster);
    try {
      await page.waitForFunction(() => (
        Number.isFinite(window.__ROOSTER_TEST__?.getTelemetry().progression.firstUpgradeAtMs)
        || window.__ROOSTER_TEST__?.getState().gameEnded
      ), null, { timeout: 50000 });
    } catch (error) {
      const diagnostic = await page.evaluate(() => {
        const api = window.__ROOSTER_TEST__;
        return { state: api?.getState?.() ?? null, telemetry: api?.getTelemetry?.() ?? null };
      });
      throw new Error(`${scenario.id} timed out waiting for its first upgrade.\n${JSON.stringify({
        scenario,
        errors,
        diagnostic
      }, null, 2)}\n${error.message}`);
    }
    const result = await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      const state = api.getState();
      return {
        firstUpgradeAtMs: state.telemetry.progression.firstUpgradeAtMs,
        wave: state.wave,
        kills: state.kills,
        xpCollected: state.xpCollected,
        outcome: state.telemetry.outcome,
        waveOne: api.getWaveCatalog()[0]
      };
    });
    assert(Number.isFinite(result.firstUpgradeAtMs),
      `${scenario.id} did not reach its first upgrade.`, result);
    assert(result.wave <= 2, `${scenario.id} reached the first upgrade after wave two.`, result);
    assert(Math.abs(result.waveOne.allocatedXp - 40) < 0.001
      && JSON.stringify(result.waveOne.xpCurve.segmentShares) === JSON.stringify([0.4, 0.34, 0.1, 0.16]),
    `${scenario.id} changed the wave-one XP pacing budget or lost the frontload curve.`, result.waveOne);
    assert(errors.length === 0, `${scenario.id} reported browser errors.`, errors);
    return { ...scenario, ...result };
  } finally {
    await page.close();
  }
}

async function run() {
  await fs.mkdir(artifactDir, { recursive: true });
  const serverState = await ensureTestServer();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (let index = 0; index < scenarios.length; index += concurrency) {
      results.push(...await Promise.all(
        scenarios.slice(index, index + concurrency).map((scenario) => runScenario(browser, serverState.url, scenario))
      ));
    }
    const groups = summarize(results);
    const report = {
      generatedAt: new Date().toISOString(),
      seedCount,
      concurrency,
      productionWindowMs: FIRST_PICK_WINDOW_MS,
      groups,
      results
    };
    await fs.writeFile(path.join(artifactDir, 'early-pacing-report.json'), JSON.stringify(report, null, 2));
    results.forEach((result) => {
      assert(result.firstUpgradeAtMs >= FIRST_PICK_WINDOW_MS[0]
        && result.firstUpgradeAtMs <= FIRST_PICK_WINDOW_MS[1],
      `${result.id} first upgrade is outside the 25-35 second pacing window.`, result);
    });
    console.log('Rooster early-upgrade pacing gate passed.');
    console.log(JSON.stringify(groups.map((group) => ({
      ...group,
      minSeconds: Number((group.minMs / 1000).toFixed(1)),
      medianSeconds: Number((group.medianMs / 1000).toFixed(1)),
      p90Seconds: Number((group.p90Ms / 1000).toFixed(1)),
      maxSeconds: Number((group.maxMs / 1000).toFixed(1))
    })), null, 2));
  } finally {
    await browser.close();
    await stopTestServer(serverState.server);
  }
}

run().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
