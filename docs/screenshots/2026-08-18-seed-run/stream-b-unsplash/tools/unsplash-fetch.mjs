// Stream B tool (deleted from repo root in commit 6541c84; restored from the
// session transcript for the record). Fetches Unsplash photo metadata via the
// public napi endpoint and downloads a 1080px validation copy per candidate.
// Skips premium (Unsplash+) results — those are NOT freely licensed.
import fs from 'fs';
const ids = process.argv[2].split(',');
const dir = 'docs/screenshots/2026-08-18-seed-run/stream-b-unsplash/candidates';
const manifestPath = 'docs/screenshots/2026-08-18-seed-run/stream-b-unsplash/unsplash-manifest.json';
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
fs.mkdirSync(dir, { recursive: true });
for (const id of ids) {
  if (manifest[id] && fs.existsSync(`${dir}/u-${id}.jpg`)) { console.log(id, 'cached'); continue; }
  try {
    const r = await fetch(`https://unsplash.com/napi/photos/${id}`);
    if (!r.ok) { console.log(id, 'HTTP', r.status); continue; }
    const j = await r.json();
    if (j.premium) { console.log(id, 'PREMIUM - skip'); continue; }
    const imgUrl = j.urls.raw + '&w=1080&q=85&fm=jpg';
    const img = await fetch(imgUrl);
    const buf = Buffer.from(await img.arrayBuffer());
    fs.writeFileSync(`${dir}/u-${id}.jpg`, buf);
    manifest[id] = {
      source: 'unsplash', id, page: j.links.html, photographer: j.user.name,
      raw: j.urls.raw, w: j.width, h: j.height, alt: j.alt_description || '', license: 'Unsplash License',
    };
    console.log(id, 'ok', j.width + 'x' + j.height, j.user.name, '|', (j.alt_description || '').slice(0, 50));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
    await new Promise(s => setTimeout(s, 2500));
  } catch (e) { console.log(id, 'ERR', e.message.slice(0, 60)); }
}
