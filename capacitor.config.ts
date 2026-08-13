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
      "launchAutoHide": true,
      "launchFadeOutDuration": 200,
      "backgroundColor": "#FAF8F5",
      "androidScaleType": "CENTER_CROP",
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

