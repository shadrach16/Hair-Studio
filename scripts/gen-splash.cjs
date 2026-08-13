// scripts/gen-splash.cjs — the ONLY script that writes native splash resources.
//
//     node scripts/gen-splash.cjs
//
// WHAT IT WRITES
//   committed source art:
//     resources/splash/mark-light.png     680px, "HS" in brass on transparent
//     resources/splash/mark-dark.png      680px, the dark-theme brass
//   into the native project:
//     drawable-{6}/splash_monogram.png        the Android 12+ splash icon, per density
//     drawable-night-{6}/splash_monogram.png  its dark twin
//     drawable/splash.xml                     the pre-Android-12 splash, a layer-list
//     values/colors.xml, values-night/colors.xml
//     values/styles.xml
//   and it DELETES Capacitor's stock splash.png bitmaps — they are generic by
//   definition, and they collide with drawable/splash.xml on the same resource name.
//
// WHY A LAYER-LIST AND NOT BIG PNGs
//   Capacitor's asset generator emits ~26 full-screen splash bitmaps, one per
//   density and orientation, each a copy of the same picture. A layer-list is a
//   colour plus one centred mark: it scales to any screen, needs no orientation
//   variants, and cannot letterbox. Only the mark ships as a bitmap.
//
// WHY IT OWNS THE COLOUR FILES TOO
//   A white flash on boot is never one wrong file — it is two files disagreeing.
//   Before this script the app surface was #FAF8F5 in index.html and native.ts
//   but WHITE in four other places (capacitor.config splash, capacitor.config
//   StatusBar, styles.xml statusBarColor, styles.xml windowSplashScreenBackground),
//   so launching went white system splash -> white Capacitor splash -> paper app.
//   Two visible flashes. The colour has to be identical at every site or the seam
//   comes back, so the sites live together here.
//
//   The two this script does NOT own are capacitor.config.ts and index.html —
//   they are hand-edited TypeScript/HTML. They are checked below and the script
//   fails loudly if they drift.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const RES = path.join(ROOT, 'android/app/src/main/res');
const SRC_ART = path.join(ROOT, 'resources/splash');

// The single source of truth. --surface / --brass from index.css, light and dark.
const SURFACE_LIGHT = '#FAF8F5';
const SURFACE_DARK = '#141210';
const BRASS_LIGHT = '#B98A2F';
const BRASS_DARK = '#D4A94C';

// 170dp box, matching the reference apps. Android 12+ masks the icon into a
// circle, so the mark must sit well inside its own canvas.
const DENSITIES = { ldpi: 128, mdpi: 170, hdpi: 255, xhdpi: 340, xxhdpi: 510, xxxhdpi: 680 };

const FONT = fs
  .readFileSync(
    path.join(ROOT, 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2')
  )
  .toString('base64');

/**
 * The mark: "HS" in Fraunces, the app's display face — the same letterforms as
 * the wordmark in lib/shareCard.ts, so the splash and the share card are
 * recognisably one brand. A monogram rather than the full wordmark because
 * Android 12+ centre-crops this into a circle; "Hair Studio" would be clipped
 * to "air Stu".
 */
function markHtml(size, colour) {
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:'Fraunces';src:url(data:font/woff2;base64,${FONT}) format('woff2');
               font-weight:100 900;font-display:block;}
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:transparent;}
    .w{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
    .m{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:${Math.round(size * 0.42)}px;
       color:${colour};letter-spacing:-0.04em;line-height:1;}
  </style><div class="w"><div class="m">HS</div></div>`;
}

const SPLASH_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- The pre-Android-12 splash: the app surface colour with the brand mark centred.
     The colour comes from @color/splash_background and the bitmap from
     drawable-night-*, so both flip with the system theme and a dark boot never
     shows a light frame. Android 12+ ignores this and draws
     windowSplashScreenBackground + windowSplashScreenAnimatedIcon instead (see
     values/styles.xml); the composition is identical either way.
     Replaces Capacitor's stock splash.png. Written by scripts/gen-splash.cjs. -->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <color android:color="@color/splash_background" />
    </item>
    <item
        android:width="170dp"
        android:height="170dp"
        android:gravity="center">
        <bitmap
            android:src="@drawable/splash_monogram"
            android:gravity="fill" />
    </item>
</layer-list>
`;

const COLORS_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by scripts/gen-splash.cjs. Do not hand-edit: splash_background has to
     equal the surface token in index.css or the boot flashes.
     (XML comments cannot contain a double hyphen, so the CSS custom property is
     named in prose here rather than written out.)
     The three Capacitor template colours are kept so the @color refs in
     styles.xml always resolve; they now carry brass instead of the old amber,
     which was left over from before the redesign. -->
<resources>
    <color name="colorPrimary">${BRASS_LIGHT}</color>
    <color name="colorPrimaryDark">#7C5A1A</color>
    <color name="colorAccent">${BRASS_LIGHT}</color>
    <color name="splash_background">${SURFACE_LIGHT}</color>
</resources>
`;

const COLORS_NIGHT_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Dark-theme splash surface: the app's warm charcoal, so the native splash hands
     off to the WebView with no colour jump. Written by scripts/gen-splash.cjs. -->
<resources>
    <color name="splash_background">${SURFACE_DARK}</color>
    <color name="colorAccent">${BRASS_DARK}</color>
</resources>
`;

const STYLES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by scripts/gen-splash.cjs. -->
<resources>

    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:windowTranslucentStatus">false</item>
        <!-- The surface colour, not white. lib/native.ts repaints this at runtime
             per screen; this value is what shows in the gap before the WebView
             has painted, so it must be the same colour. -->
        <item name="android:statusBarColor">@color/splash_background</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:windowFullscreen">false</item>
    </style>

    <!-- The launch splash: the brand mark centred on the app surface colour, light
         and dark via values-night. Android 12+ renders the themed system splash
         from the two windowSplashScreen* items; older versions draw
         @drawable/splash, the same composition as a layer-list.
         windowSplashScreenAnimatedIcon was previously unset, which meant Android
         12+ fell back to the LAUNCHER ICON on a white field — the one surface
         where the old clipart badge was guaranteed to appear. -->
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_monogram</item>
        <!-- windowBackground, NOT background: the latter is a view attribute and
             the starting window ignores it. Logcat on a Note 10 (Android 12)
             reported suggestType=3, LEGACY_SPLASH_SCREEN, which draws ONLY
             windowBackground, so the mark never appeared while the colour did.
             Pointing windowBackground at the layer-list makes the legacy path
             draw the whole composition. -->
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
`;


// API 31+ reads the PLATFORM attributes (android:windowSplashScreen*). The
// unprefixed ones in values/styles.xml are androidx compat aliases, consumed by
// installSplashScreen() on older releases. On a Note 10 running Android 12 the
// background applied but the icon never did, which is exactly what an unmapped
// alias looks like — so the platform names are declared explicitly here.
const STYLES_V31_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by scripts/gen-splash.cjs. Android 12+ only. -->
<resources>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:windowSplashScreenBackground">@color/splash_background</item>
        <item name="android:windowSplashScreenAnimatedIcon">@drawable/splash_monogram</item>
        <item name="android:windowSplashScreenIconBackgroundColor">@color/splash_background</item>
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_monogram</item>
        <!-- windowBackground, NOT background: the latter is a view attribute and
             the starting window ignores it. Logcat on a Note 10 (Android 12)
             reported suggestType=3, LEGACY_SPLASH_SCREEN, which draws ONLY
             windowBackground, so the mark never appeared while the colour did.
             Pointing windowBackground at the layer-list makes the legacy path
             draw the whole composition. -->
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
`;

/** Fail loudly if a colour site this script does NOT own has drifted. */
function checkUnownedSites() {
  const problems = [];

  const cap = fs.readFileSync(path.join(ROOT, 'capacitor.config.ts'), 'utf8');
  const capColours = [...cap.matchAll(/backgroundColor["']?\s*:\s*["'](#[0-9a-fA-F]{3,8})["']/g)].map(
    (m) => m[1].toUpperCase()
  );
  for (const c of capColours) {
    if (c !== SURFACE_LIGHT.toUpperCase()) {
      problems.push(`capacitor.config.ts has backgroundColor ${c}, expected ${SURFACE_LIGHT}`);
    }
  }

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const theme = html.match(/name=["']theme-color["'][^>]*content=["'](#[0-9a-fA-F]{3,8})["']/);
  if (theme && theme[1].toUpperCase() !== SURFACE_LIGHT.toUpperCase()) {
    problems.push(`index.html theme-color is ${theme[1]}, expected ${SURFACE_LIGHT}`);
  }

  return problems;
}

// aapt2 rejects a double hyphen inside an XML comment, and the failure surfaces
// as a resource-merge error hundreds of lines into a Gradle stack trace. Catch it
// here instead.
function assertXmlCommentsValid(name, xml) {
  for (const c of xml.match(/<!--[\s\S]*?-->/g) || []) {
    if (c.slice(4, -3).includes('--')) {
      throw new Error(`${name}: XML comment contains a double hyphen, which aapt2 rejects`);
    }
  }
}

(async () => {
  for (const [n, x] of [['splash.xml', SPLASH_XML], ['colors.xml', COLORS_XML],
                        ['colors-night.xml', COLORS_NIGHT_XML], ['styles.xml', STYLES_XML],
                        ['styles-v31.xml', STYLES_V31_XML]]) {
    assertXmlCommentsValid(n, x);
  }

  fs.mkdirSync(SRC_ART, { recursive: true });
  const browser = await chromium.launch();

  // 1. Source art + per-density monograms, light and dark.
  for (const [variant, colour, nightDir] of [
    ['light', BRASS_LIGHT, false],
    ['dark', BRASS_DARK, true],
  ]) {
    for (const [density, px] of Object.entries(DENSITIES)) {
      const page = await browser.newPage({ viewport: { width: px, height: px } });
      await page.setContent(markHtml(px, colour), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);

      const dir = path.join(RES, `drawable-${nightDir ? 'night-' : ''}${density}`);
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, 'splash_monogram.png'), omitBackground: true });

      // Keep the largest as committed source art.
      if (px === DENSITIES.xxxhdpi) {
        await page.screenshot({ path: path.join(SRC_ART, `mark-${variant}.png`), omitBackground: true });
      }
      await page.close();
    }
    console.log(`  monogram (${variant}) x${Object.keys(DENSITIES).length} densities`);
  }
  await browser.close();

  // 2. Remove Capacitor's stock full-screen splash bitmaps — they would collide
  //    with drawable/splash.xml on the resource name `splash`.
  let removed = 0;
  for (const dir of fs.readdirSync(RES)) {
    const p = path.join(RES, dir, 'splash.png');
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      removed++;
      // Drop the directory if the splash was all it held.
      const rest = fs.readdirSync(path.join(RES, dir));
      if (!rest.length) fs.rmdirSync(path.join(RES, dir));
    }
  }
  console.log(`  removed ${removed} stock splash.png bitmaps`);

  // 3. Composition + colour + theme.
  fs.mkdirSync(path.join(RES, 'drawable'), { recursive: true });
  fs.writeFileSync(path.join(RES, 'drawable/splash.xml'), SPLASH_XML);
  fs.writeFileSync(path.join(RES, 'values/colors.xml'), COLORS_XML);
  fs.mkdirSync(path.join(RES, 'values-night'), { recursive: true });
  fs.writeFileSync(path.join(RES, 'values-night/colors.xml'), COLORS_NIGHT_XML);
  fs.writeFileSync(path.join(RES, 'values/styles.xml'), STYLES_XML);
  fs.mkdirSync(path.join(RES, 'values-v31'), { recursive: true });
  fs.writeFileSync(path.join(RES, 'values-v31/styles.xml'), STYLES_V31_XML);
  console.log('  drawable/splash.xml, values{,-night,-v31}/*.xml');

  // 4. Report on the sites this script cannot write.
  const problems = checkUnownedSites();
  if (problems.length) {
    console.error('\nSurface colour disagrees with a site this script does not own:');
    problems.forEach((p) => console.error(`  - ${p}`));
    console.error('Fix those by hand, or the boot will flash.');
    process.exit(1);
  }
  console.log('\nAll surface-colour sites agree on ' + SURFACE_LIGHT + '.');
})().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
