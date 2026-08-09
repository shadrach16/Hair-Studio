// scripts/shot.cjs — screenshot the running dev server at phone dimensions.
//
// Lets visual work be verified in the browser (layout, type, colour, sheets)
// without occupying the physical device. Native-only behaviour — status-bar
// plane, hardware back, safe-area insets, share sheet, camera, purchases —
// still has to be checked on the phone; those APIs are no-ops on web.
//
//   node scripts/shot.cjs <outfile> [url] [--dark] [--wait=ms] [--tap=x,y]
//
// Safe-area insets are simulated so layout that depends on them is not judged
// against a desktop browser's zeroes.

const { chromium, devices } = require('playwright');

const [, , outArg, urlArg, ...rest] = process.argv;
const out = outArg || 'shot.png';
const url = urlArg && !urlArg.startsWith('--') ? urlArg : 'http://localhost:5173/';
const flags = rest.concat(urlArg && urlArg.startsWith('--') ? [urlArg] : []);
const dark = flags.includes('--dark');
const waitFlag = flags.find((f) => f.startsWith('--wait='));
const wait = waitFlag ? parseInt(waitFlag.split('=')[1], 10) : 3500;
const tapFlag = flags.find((f) => f.startsWith('--tap='));

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    colorScheme: dark ? 'dark' : 'light',
    // Approximate a modern Android's notch/gesture-bar so safe-area-dependent
    // chrome (which the browser otherwise reports as 0) lays out realistically.
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.addStyleTag({
    content: `:root{--safe-area-top:28px;--safe-area-bottom:16px}`,
  }).catch(() => {});

  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message.slice(0, 200)));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 200));
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(wait);

  if (tapFlag) {
    const [x, y] = tapFlag.split('=')[1].split(',').map(Number);
    await page.mouse.click(x, y);
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: out });
  console.log('saved:', out);
  await browser.close();
})().catch((e) => {
  console.error('shot failed:', e.message);
  process.exit(1);
});
