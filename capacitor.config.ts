import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hairstudio.app',
  appName: 'Hair Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  },
  // Add the Android version block to set the SDK versions
  android: {
    // Minimum version required is 34 to satisfy your latest dependencies
    compileSdkVersion: 34, 
    targetSdkVersion: 34,
    // The WebView's own background, behind the page. Left unset it is white,
    // which is the colour that flashed on boot.
    backgroundColor: '#FAF8F5'
  },
   assets: {
    icon: {
      source: 'app-icon.png' 
    },
    splash: {
      // --surface, not white. This and the five other surface-colour sites must
      // be byte-identical or the launch flashes; scripts/gen-splash.cjs checks.
      backgroundColor: '#FAF8F5',
    }
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Calendar: {
      permissions: ['calendar']
    },
    Filesystem: {
      permissions: ['storage']
    },
      CordovaPurchase: {
      log: 'DEBUG'
      },
      "StatusBar": {
      "overlaysWebView": false,
      "style": "LIGHT",
      // The one-plane rule: status bar, splash and page share one surface colour.
      // lib/native.ts repaints this per screen; this is the boot value.
      "backgroundColor": "#FAF8F5"
    },
    "SplashScreen": {
      // Hand off as soon as the WebView has painted rather than sitting on a
      // timer. The old config had no SplashScreen block at all, so it used the
      // 500ms default fade with autoHide on a fixed delay.
      // autoHide stays TRUE deliberately: it is the backstop. If the web layer
      // never calls hide(), the splash still lifts on its own rather than
      // locking the app behind a paper rectangle.
      "launchAutoHide": true,
      "launchFadeOutDuration": 200,
      "backgroundColor": "#FAF8F5",
      // Was 1000. Walk 5 measured the splash holding the screen for ~2.2s with
      // nothing drawn on it — this OEM renders windowSplashScreenBackground but
      // not the animated icon, so a long duration buys a longer blank. Hand over
      // quickly instead; #boot in index.html carries the brand beat on the same
      // colour, and main.tsx holds it long enough to be read.
      "launchShowDuration": 300,
      // FIT_CENTER, not CENTER_CROP: the layer-list's intrinsic size is the
      // 170dp mark, so CENTER_CROP would scale it about 5x to fill the screen.
      "androidScaleType": "FIT_CENTER",
      "showSpinner": false,
      "splashFullScreen": false,
      "splashImmersive": false
    },
      "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
 
  }
};

export default config;

