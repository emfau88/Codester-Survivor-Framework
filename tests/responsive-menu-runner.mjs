import {
  ensureTestServer,
  loadPlaywright,
  stopTestServer
} from './helpers/test-runtime.mjs';

const viewports = [
  { name: 'desktop-full-hd', width: 1920, height: 1080 },
  { name: 'laptop-large', width: 1440, height: 900 },
  { name: 'laptop-standard', width: 1366, height: 768 },
  { name: 'embedded-desktop', width: 967, height: 604 },
  { name: 'desktop', width: 960, height: 540 },
  { name: 'desktop-short', width: 907, height: 510 },
  { name: 'laptop-short', width: 821, height: 462 },
  { name: 'landscape-short', width: 800, height: 450 },
  { name: 'portrait', width: 390, height: 844 },
  { name: 'phone-short', width: 320, height: 568 }
];

function assert(condition, message, details) {
  if (!condition) {
    throw new Error(`${message}\n${JSON.stringify(details, null, 2)}`);
  }
}

function insideViewport(rect, viewport) {
  const tolerance = 2;
  return rect.left >= -tolerance && rect.top >= -tolerance
    && rect.right <= viewport.width + tolerance && rect.bottom <= viewport.height + tolerance;
}

async function readRect(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  });
}

async function verifyViewport(browser, url, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  try {
    await page.goto(`${url}?seed=responsive-${viewport.name}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.henhouse-panel');
    const hub = await page.evaluate(() => {
      const panel = document.querySelector('.henhouse-panel');
      const play = document.querySelector('[data-hub-view="play"]');
      const start = document.querySelector('[data-run-start]');
      const panelRect = panel.getBoundingClientRect();
      const startRect = start.getBoundingClientRect();
      return {
        panel: { left: panelRect.left, top: panelRect.top, right: panelRect.right, bottom: panelRect.bottom },
        start: { left: startRect.left, top: startRect.top, right: startRect.right, bottom: startRect.bottom },
        playClientHeight: play.clientHeight,
        playScrollHeight: play.scrollHeight,
        documentWidth: document.documentElement.scrollWidth
      };
    });
    assert(insideViewport(hub.panel, viewport) && insideViewport(hub.start, viewport),
      `${viewport.name}: Henhouse or Start Run exceeds the viewport.`, hub);
    assert(Math.abs(hub.panel.left - (viewport.width - hub.panel.right)) <= 2,
      `${viewport.name}: Henhouse is not horizontally centered.`, hub);
    if (viewport.name !== 'phone-short') {
      assert(hub.playScrollHeight <= hub.playClientHeight + 1,
        `${viewport.name}: the Play tab should remain a single-screen layout.`, hub);
    }
    assert(hub.documentWidth <= viewport.width,
      `${viewport.name}: Hub creates horizontal document overflow.`, hub);
    await page.evaluate(() => window.__ROOSTER_TEST__.selectRooster('ace'));
    await page.waitForFunction(() => !window.__ROOSTER_TEST__.getState().choosingRooster);
    await page.evaluate(() => window.__ROOSTER_TEST__.openSettings());
    const settings = {
      panel: await readRect(page, '.settings-panel'),
      continue: await readRect(page, '.settings-close'),
      documentWidth: await page.evaluate(() => document.documentElement.scrollWidth)
    };
    assert(insideViewport(settings.panel, viewport) && insideViewport(settings.continue, viewport),
      `${viewport.name}: Settings or Continue is outside the viewport.`, settings);
    assert(settings.documentWidth <= viewport.width,
      `${viewport.name}: Settings creates horizontal document overflow.`, settings);
    const returnButton = page.locator('[data-return-hub]');
    if (await returnButton.count()) {
      await returnButton.click();
      const returnPanel = await readRect(page, '.return-hub-panel');
      assert(insideViewport(returnPanel, viewport),
        `${viewport.name}: Return-to-Henhouse confirmation exceeds the viewport.`, returnPanel);
      await page.locator('[data-return-cancel]').click();
      await page.waitForSelector('.settings-panel');
    }
    await page.locator('.settings-panel').press('Escape');
    await page.waitForFunction(() => !window.__ROOSTER_TEST__.getState().pause?.paused);

    await page.evaluate(() => window.__ROOSTER_TEST__.startLevelUp());
    const upgrade = {
      panel: await readRect(page, '.upgrade-panel').then((rect) => rect),
      choices: await page.locator('.upgrade-button').evaluateAll((buttons) => buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      })),
      documentWidth: await page.evaluate(() => document.documentElement.scrollWidth)
    };
    assert(insideViewport(upgrade.panel, viewport) && upgrade.choices.every((choice) => insideViewport(choice, viewport)),
      `${viewport.name}: an upgrade choice is outside the viewport.`, upgrade);
    assert(upgrade.documentWidth <= viewport.width,
      `${viewport.name}: Upgrade selection creates horizontal document overflow.`, upgrade);
    await page.evaluate(() => window.__ROOSTER_TEST__.resumeIfUpgradeOpen());

    assert(errors.length === 0, `${viewport.name}: browser errors while checking menus.`, errors);
    return { name: viewport.name, hub, settings, upgrade };
  } finally {
    await page.close();
  }
}

async function run() {
  const { server, url } = await ensureTestServer();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const results = [];
    for (const viewport of viewports) {
      results.push(await verifyViewport(browser, url, viewport));
    }
    console.log('Responsive menu test passed.');
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
    await stopTestServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
