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

// Norican — the logotype face, and ONLY the logotype face. Plan §1.1 allows
// exactly this: "a single lettering face for the 'Hair Studio' logotype only,
// splash + auth header. Never UI text." It is SIL OFL 1.1, self-hosted from
// node_modules, so nothing is fetched at runtime.
//
// The previous mark was "HS" set in Fraunces. Fraunces is a serif, and at
// monogram size a two-letter serif lockup reads as a monogram on a business
// card rather than as a salon's own hand. Penmanship is the point: this is a
// beauty brand, and a signature says "somebody did this to your hair" in a way
// a set capital cannot.
const SCRIPT_FONT = fs
  .readFileSync(path.join(ROOT, 'node_modules/@fontsource/norican/files/norican-latin-400-normal.woff2'))
  .toString('base64');

const FACE = `@font-face{font-family:'Norican';src:url(data:font/woff2;base64,${SCRIPT_FONT}) format('woff2');
              font-weight:400;font-display:block;}`;

/**
 * The native icon: a script "HS" ligature.
 *
 * Still a monogram rather than the full wordmark, and for an unchanged reason —
 * Android 12+ centre-crops windowSplashScreenAnimatedIcon into a circle, so
 * "Hair Studio" would be clipped to "air Stu". The letters now come from the
 * script face, so the circle holds a signature rather than a serif lockup.
 */
function markHtml(size, colour) {
  return `<!doctype html><meta charset="utf-8"><style>
    ${FACE}
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:transparent;}
    .w{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
    .m{font-family:'Norican',cursive;font-size:${Math.round(size * 0.46)}px;
       color:${colour};line-height:1;padding-bottom:${Math.round(size * 0.04)}px;}
  </style><div class="w"><div class="m">HS</div></div>`;
}

/**
 * The full wordmark, for the beat the WebView draws.
 *
 * This is the one that actually gets seen: the test handset renders
 * windowSplashScreenBackground but not the icon, so #boot in index.html is the
 * brand moment in practice. It ships as a PNG inlined into the HTML as a data
 * URI rather than as a webfont, because #boot paints BEFORE any bundle or font
 * request — asking for Norican there would either block the first paint or fall
 * back to a system cursive, and a wordmark rendered in whatever cursive the
 * device happens to own is worse than no wordmark at all.
 */
function wordmarkHtml(w, h, colour) {
  return `<!doctype html><meta charset="utf-8"><style>
    ${FACE}
    html,body{margin:0;padding:0;width:${w}px;height:${h}px;background:transparent;}
    .w{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
    .m{font-family:'Norican',cursive;font-size:${Math.round(h * 0.62)}px;color:${colour};
       line-height:1;letter-spacing:.01em;white-space:nowrap;}
  </style><div class="w"><div class="m">Hair Studio</div></div>`;
}

// Sized for the largest place it is drawn (300 CSS px wide) at 2x, and no
// larger: this PNG is inlined into the HTML head, so every byte is paid before
// the first paint. 1200x300 came out at 98KB of base64, which is a worse boot
// than the blank screen it replaces.
const WORDMARK_W = 640;
const WORDMARK_H = 160;

/**
 * Write the rendered wordmark into index.html between its markers.
 *
 * index.html is hand-edited and this script deliberately does not own it, so it
 * replaces only what is between the two comment markers and fails if they are
 * missing rather than guessing where the mark goes.
 */
function injectWordmark(lightDataUri, darkDataUri) {
  const file = path.join(ROOT, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const start = '/* WORDMARK:START */';
  const end = '/* WORDMARK:END */';
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1) {
    throw new Error('index.html is missing the WORDMARK:START / WORDMARK:END markers');
  }
  const block = `${start}
    #boot .mark { background-image: url("${lightDataUri}"); }
    @media (prefers-color-scheme: dark) { #boot .mark { background-image: url("${darkDataUri}"); } }
    ${end}`;
  fs.writeFileSync(file, html.slice(0, i) + block + html.slice(j + end.length));
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

  // 1b. The wordmark for #boot, inlined into index.html as a data URI.
  const uris = {};
  for (const [variant, colour] of [['light', BRASS_LIGHT], ['dark', BRASS_DARK]]) {
    const page = await browser.newPage({
      viewport: { width: WORDMARK_W, height: WORDMARK_H },
      deviceScaleFactor: 1,
    });
    await page.setContent(wordmarkHtml(WORDMARK_W, WORDMARK_H, colour), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(120);
    const file = path.join(SRC_ART, `wordmark-${variant}.png`);
    await page.screenshot({ path: file, omitBackground: true });
    uris[variant] = `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;

    // Also published to public/ so the APP can use the same lettering — the
    // sign-in sheet and the menu header are the "auth header" plan §1.1 allows
    // the logotype on. Same file, so the boot beat and the app can never drift.
    const pub = path.join(ROOT, 'public/brand');
    fs.mkdirSync(pub, { recursive: true });
    fs.copyFileSync(file, path.join(pub, `wordmark-${variant}.png`));
    await page.close();
  }
  injectWordmark(uris.light, uris.dark);
  const kb = (uris.light.length + uris.dark.length) / 1024;
  console.log(`  wordmark (light + dark) inlined into index.html, ${kb.toFixed(1)}KB of data URI`);
  if (kb > 90) {
    console.error(`  ! wordmark data URIs are ${kb.toFixed(1)}KB — that is paid before first paint`);
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
