import {
  ensureTestServer,
  loadPlaywright,
  stopTestServer
} from './helpers/test-runtime.mjs';

function assert(condition, message, details) {
  if (!condition) {
    throw new Error(`${message}\n${JSON.stringify(details, null, 2)}`);
  }
}

async function run() {
  const { server, url } = await ensureTestServer();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__ROOSTER_TEST__?.getState, null, { timeout: 5000 });
    await page.evaluate(() => {
      const api = window.__ROOSTER_TEST__;
      api.selectRooster('ace');
      api.pauseWaves();
      api.clearEnemies();
      api.clearProjectiles();
      api.setPlayerCombatModifiers({ regenPerSecond: 24 });
      api.setPlayerHp(50);
      const player = api.getState().player;
      api.spawnEnemyType('elite-brute', player.x + 80, player.y, { speed: 0, hp: 9999 });
    });
    await page.waitForFunction(() => window.__ROOSTER_TEST__.getState().enemyTelegraphs > 0, null, { timeout: 3000 });

    const beforePause = await page.evaluate(() => {
      window.__ROOSTER_TEST__.startLevelUp();
      return window.__ROOSTER_TEST__.getState();
    });
    await page.waitForTimeout(900);
    const duringUpgrade = await page.evaluate(() => window.__ROOSTER_TEST__.getState());
    assert(
      duringUpgrade.choosingUpgrade
        && duringUpgrade.pause?.reasons.includes('upgrade')
        && duringUpgrade.playerHp === beforePause.playerHp
        && duringUpgrade.elapsed === beforePause.elapsed
        && duringUpgrade.telemetry.damageTaken === beforePause.telemetry.damageTaken,
      'Upgrade selection allowed combat, regeneration, or elapsed game time to advance.',
      { beforePause, duringUpgrade }
    );

    await page.evaluate(() => window.__ROOSTER_TEST__.resumeIfUpgradeOpen());
    await page.waitForTimeout(760);
    const afterResume = await page.evaluate(() => window.__ROOSTER_TEST__.getState());
    assert(
      !afterResume.pause?.paused && afterResume.telemetry.damageTaken > beforePause.telemetry.damageTaken,
      'The delayed elite stomp did not resume after selecting an upgrade.',
      { beforePause, afterResume }
    );

    const beforeSettings = await page.evaluate(() => {
      window.__ROOSTER_TEST__.setPlayerHp(40);
      window.__ROOSTER_TEST__.openSettings();
      return window.__ROOSTER_TEST__.getState();
    });
    await page.waitForTimeout(500);
    const duringSettings = await page.evaluate(() => window.__ROOSTER_TEST__.getState());
    assert(
      duringSettings.pause?.reasons.includes('settings')
        && duringSettings.playerHp === beforeSettings.playerHp
        && duringSettings.elapsed === beforeSettings.elapsed,
      'Settings did not freeze the active run.',
      { beforeSettings, duringSettings }
    );
    await page.locator('.settings-close').evaluate((button) => button.click());
    await page.waitForFunction(() => !window.__ROOSTER_TEST__.getState().pause?.paused, null, { timeout: 2000 });

    const focusPause = await page.evaluate(() => window.__ROOSTER_TEST__.pauseForFocusLoss());
    assert(
      focusPause.reasons.includes('focus'),
      'Focus loss did not create a pause reason.',
      focusPause
    );
    await page.click('[data-focus-resume]');
    await page.waitForFunction(() => !window.__ROOSTER_TEST__.getState().pause?.paused, null, { timeout: 2000 });
    assert(errors.length === 0, 'Browser errors occurred during pause handling.', errors);
    console.log('Pause handling test passed.');
  } finally {
    await page.close();
    await browser.close();
    await stopTestServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
