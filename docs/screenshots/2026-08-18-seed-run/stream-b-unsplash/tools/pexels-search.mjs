// Stream B tool (this file was deleted from repo root in commit 6541c84 as an
// unidentified "producer"; restored here from the session transcript for the
// record). Drives a real Chromium via Playwright against Pexels search pages —
// one query per launch, paced, challenge-aware. See STREAM-B.md.
import { chromium } from 'playwright';
import fs from 'fs';

const queries = JSON.parse(process.argv[2]);
const out = process.argv[3];
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 1400, height: 1000 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();
const all = prev;

async function grab() {
  return page.evaluate(() => {
    const seen = new Map();
    document.querySelectorAll('a[href*="/photo/"]').forEach(a => {
      const href = a.getAttribute('href');
      const m = href && href.match(/\/photo\/([a-z0-9-]+-)?(\d+)\/?$/);
      if (!m) return;
      const img = a.querySelector('img') || (a.parentElement && a.parentElement.querySelector('img'));
      const src = img ? (img.currentSrc || img.src) : null;
      if (!src || !src.includes('images.pexels.com')) return;
      if (!seen.has(m[2])) seen.set(m[2], { id: m[2], page: 'https://www.pexels.com' + href.split('?')[0], src, alt: img.alt || '' });
    });
    return [...seen.values()];
  });
}

for (const q of queries) {
  if (all[q] && all[q].length) { console.log(q, 'already have', all[q].length); continue; }
  const url = 'https://www.pexels.com/search/' + encodeURIComponent(q) + '/';
  let items = [];
  for (let attempt = 1; attempt <= 2 && !items.length; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(7000);
      if ((await page.title()).includes('Just a moment')) {
        console.log(q, 'challenge... waiting');
        await page.waitForTimeout(15000);
      }
      await page.mouse.wheel(0, 1600); await page.waitForTimeout(3000);
      items = await grab();
      if (!items.length && attempt < 2) await page.waitForTimeout(12000);
    } catch (e) { console.log(q, 'err:', e.message.slice(0, 60)); }
  }
  all[q] = items.slice(0, 14);
  console.log(q, '->', items.length);
  fs.writeFileSync(out, JSON.stringify(all, null, 1));
  await page.waitForTimeout(9000 + Math.floor(3000 * (queries.indexOf(q) % 3)));
}
await browser.close();
console.log('done');
