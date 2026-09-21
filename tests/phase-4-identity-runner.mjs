import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ensureTestServer,
  loadPlaywright,
  projectRoot,
  stopTestServer
} from './helpers/test-runtime.mjs';

const artifactDir = path.join(projectRoot, 'test-results');

function assert(condition, message, details) {
  if (!condition) throw new Error(`${message}\n${JSON.stringify(details ?? {}, null, 2)}`);
}

async function openScenario(browser, url, roosterId) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`${url}?seed=phase-4-${roosterId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ROOSTER_TEST__?.getState, null, { timeout: 5000 });
  await page.evaluate((id) => {
    const api = window.__ROOSTER_TEST__;
    api.selectRooster(id);
    api.pauseWaves();
    api.clearEnemies();
    api.clearProjectiles();
  }, roosterId);
  return { page, errors };
}

async function testAce(browser, url) {
  const { page, errors } = await openScenario(browser, url, 'ace');
  try {
    const result = await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      const player = api.getState().player;
      const first = api.spawnEnemyType('slime', player.x + 160, player.y, { hp: 9999, speed: 0, damage: 0 });
      const second = api.spawnEnemyType('slime', player.x + 205, player.y, { hp: 9999, speed: 0, damage: 0 });
      const before = api.getState().player;
      api.triggerPrimaryAttack();
      const initialShot = api.getProjectileSnapshot();
      api.clearProjectiles();
      api.applyUpgradeById('primary-ace-rank');
      api.applyUpgradeById('primary-ace-rank');
      api.triggerPrimaryAttack(3);
      return {
        first,
        second,
        before,
        after: api.getState().player,
        initialShot,
        criticalShot: api.getProjectileSnapshot()
      };
    });
    assert(result.initialShot.every((shot) => shot.targetId === result.first),
      'Ace did not acquire the closest target for its initial lock.', result);
    assert(result.criticalShot.length === 2 && result.criticalShot.every((shot) => shot.forceCritical && shot.criticalVisual),
      'Ace rank-two cadence did not produce its deterministic critical volley.', result);
    assert(result.before.x === result.after.x && result.before.y === result.after.y
      && result.before.velocityX === result.after.velocityX && result.before.velocityY === result.after.velocityY,
    'Ace firing changed player position or velocity.', result);
    assert(errors.length === 0, 'Ace scenario logged browser errors.', errors);
    return result;
  } finally {
    await page.close();
  }
}

async function testArtillery(browser, url) {
  const { page, errors } = await openScenario(browser, url, 'artillery');
  try {
    const result = await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      const player = api.getState().player;
      const isolated = api.spawnEnemyType('slime', player.x + 135, player.y, { hp: 9999, speed: 0, damage: 0 });
      const cluster = [
        api.spawnEnemyType('slime', player.x + 300, player.y, { hp: 9999, speed: 0, damage: 0 }),
        api.spawnEnemyType('slime', player.x + 330, player.y + 20, { hp: 9999, speed: 0, damage: 0 }),
        api.spawnEnemyType('slime', player.x + 322, player.y - 24, { hp: 9999, speed: 0, damage: 0 })
      ];
      api.triggerPrimaryAttack();
      return { isolated, cluster, enemies: api.getEnemySnapshot(), projectile: api.getProjectileSnapshot()[0] };
    });
    assert(result.cluster.includes(result.projectile.targetId) && result.projectile.targetId !== result.isolated,
      'Boombardier did not select the highest-value splash cluster.', result);
    assert(result.projectile.splashRadius > 0, 'Boombardier shot lost its splash radius.', result);
    assert(errors.length === 0, 'Artillery scenario logged browser errors.', errors);
    return result;
  } finally {
    await page.close();
  }
}

async function testStorm(browser, url) {
  const { page, errors } = await openScenario(browser, url, 'storm');
  try {
    const result = await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      const player = api.getState().player;
      const isolated = api.spawnEnemyType('slime', player.x + 125, player.y, { hp: 9999, speed: 0, damage: 0 });
      const cluster = [
        api.spawnEnemyType('slime', player.x + 280, player.y, { hp: 9999, speed: 0, damage: 0 }),
        api.spawnEnemyType('slime', player.x + 340, player.y + 30, { hp: 9999, speed: 0, damage: 0 })
      ];
      api.triggerPrimaryAttack();
      return { isolated, cluster, projectile: api.getProjectileSnapshot()[0] };
    });
    assert(result.cluster.includes(result.projectile.targetId) && result.projectile.targetId !== result.isolated,
      'Stormcrest did not anchor its first contact in a chainable cluster.', result);
    assert(result.projectile.stormContactVisual && result.projectile.chainRemaining > 0,
      'Stormcrest first-contact feedback is not linked to its chain payload.', result);
    assert(errors.length === 0, 'Storm scenario logged browser errors.', errors);
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
    const report = {
      generatedAt: new Date().toISOString(),
      ace: await testAce(browser, url),
      artillery: await testArtillery(browser, url),
      storm: await testStorm(browser, url)
    };
    await fs.mkdir(artifactDir, { recursive: true });
    await fs.writeFile(path.join(artifactDir, 'phase-4-identity-report.json'), JSON.stringify(report, null, 2));
    console.log('Phase 4 identity gate passed.');
  } finally {
    await browser.close();
    await stopTestServer(server);
  }
}

run().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
