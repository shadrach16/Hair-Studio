/**
 * Seed run 2026-08-18 — 15 eye-validated Pexels styles.
 * Evidence: repo docs/screenshots/2026-08-18-seed-run/
 *
 * Deviation from earlier seedNewHairstyles* scripts, per operator brief:
 * uploads are ORIGINAL RESOLUTION (no baked-in 600x800 crop) — the app
 * applies its own transforms.
 */

require('dotenv').config({ path: '/var/www/hairstudio/.env' });
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Hairstyle = require('/var/www/hairstudio/models/Hairstyle');

const EXPECTED_PRE_COUNT = 172; // active, non-custom
const DATA = JSON.parse(fs.readFileSync('/var/www/hairstudio/scripts/seed-2026-08-18.json', 'utf8'));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const pre = await Hairstyle.countDocuments({ isActive: true, isCustom: false });
  console.log('pre-count active non-custom:', pre);
  if (pre !== EXPECTED_PRE_COUNT) {
    console.error(`ABORT: expected ${EXPECTED_PRE_COUNT}, found ${pre}`);
    process.exit(1);
  }

  const dupes = await Hairstyle.find({ name: { $in: DATA.map(d => d.name) } }, { name: 1 });
  if (dupes.length) {
    console.error('ABORT: name collisions:', dupes.map(d => d.name));
    process.exit(1);
  }

  const results = [];
  for (const d of DATA) {
    const originalUrl = `https://images.pexels.com/photos/${d.pexelsId}/pexels-photo-${d.pexelsId}.jpeg`;
    const up = await cloudinary.uploader.upload(originalUrl, {
      public_id: `Hairstyles/${d.slug}`,
      folder: '',
      overwrite: false,
      resource_type: 'image',
    });
    const doc = await Hairstyle.create({
      name: d.name,
      category: d.category,
      gender: d.gender,
      hairType: d.hairType,
      thumbnail: up.secure_url,
      ai_description: d.ai_description,
      price: d.price,
      popularity: d.popularity,
      isActive: true,
      isCustom: false,
    });
    console.log(`inserted ${doc._id} ${d.name} (${up.width}x${up.height})`);
    results.push({
      slug: d.slug, name: d.name, styleId: String(doc._id),
      cloudinaryUrl: up.secure_url, uploadedW: up.width, uploadedH: up.height,
      sourceUrl: d.sourceUrl, photographer: d.photographer, license: d.license,
    });
  }

  const post = await Hairstyle.countDocuments({ isActive: true, isCustom: false });
  console.log('post-count active non-custom:', post);
  fs.writeFileSync('/var/www/hairstudio/scripts/seed-2026-08-18-result.json', JSON.stringify(results, null, 2));
  console.log('DONE', results.length, 'inserted; delta', post - pre);
  await mongoose.disconnect();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
