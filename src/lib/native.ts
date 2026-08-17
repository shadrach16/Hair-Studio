// native.ts — status bar + hardware back.
//
// Ported from Retinue's lib/native.ts. Two behaviours that @ionic/react does
// NOT give you and that both read as bugs when missing:
//   1. syncStatusBar — makes the status bar the SAME colour as the chrome bar,
//      so there is no seam between the clock and the app (4.2).
//   2. registerHardwareBack — Android back must close a sheet, then pop a
//      screen, and only minimize at a tab root. Without it, back closes the app
//      from anywhere (the reference app hit this in production).

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ResolvedTheme = 'light' | 'dark';

const isNative = Capacitor.isNativePlatform();

// Must match --surface in index.css exactly, or a seam appears at the boundary.
const SURFACE_HEX: Record<ResolvedTheme, string> = {
  light: '#FAF8F5',
  dark: '#141210',
};
// Full-bleed surfaces (Results, camera) sit on near-black under light icons.
const FULL_BLEED_HEX = '#0B0B0C';

/**
 * Paint the status bar to match the app surface. Android needs an explicit
 * background colour; iOS only needs the icon style.
 */
export async function syncStatusBar(theme: ResolvedTheme = 'light'): Promise<void> {
  if (!isNative) return;
  try {
    // Style.Dark = dark ICONS (for a light background) — the naming is inverted.
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: SURFACE_HEX[theme] });
    }
  } catch {
    /* plugin unavailable — non-fatal */
  }
}

/** Light icons on near-black, for photo-first screens. Restore with syncStatusBar(). */
export async function setFullBleedStatusBar(): Promise<void> {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: FULL_BLEED_HEX });
    }
  } catch {
    /* non-fatal */
  }
}

/**
 * Apply at boot AND again shortly after: the splash screen / plugin can race
 * and silently drop the first call. The retry is deliberate, not superstition —
 * the reference app needs it to avoid a white status bar on cold start.
 */
export function initStatusBar(theme: ResolvedTheme = 'light'): void {
  void syncStatusBar(theme);
  setTimeout(() => void syncStatusBar(theme), 1600);
}

// ─── Hardware back ──────────────────────────────────────────────────────────

/** Screens that are a tab root: back here should minimize, never blank-exit. */
const BACK_ROOTS = new Set(['/', '/looks', '/profile']);

// Open sheets register a closer; the newest one handles back first.
const backInterceptors: Array<() => void> = [];

export function pushBackInterceptor(close: () => void): () => void {
  backInterceptors.push(close);
  return () => {
    const i = backInterceptors.indexOf(close);
    if (i >= 0) backInterceptors.splice(i, 1);
  };
}

function popBackInterceptor(): void {
  const close = backInterceptors.pop();
  close?.();
}

// Studio screens that ARE a root: back from these should leave the app.
// Everything else in the studio is a step the user walked into and must be able
// to walk out of.
const ROOT_STUDIO_STATES = new Set(['', 'home', 'discover']);

export function decideBack(
  hasOpenSheet: boolean,
  pathname: string,
  search = ''
): 'close-sheet' | 'navigate-back' | 'minimize' {
  if (hasOpenSheet) return 'close-sheet';
  if (!BACK_ROOTS.has(pathname)) return 'navigate-back';

  // The studio keeps its state in the QUERY STRING, so every one of its screens
  // reports pathname '/'. Matching on pathname alone therefore treated the photo
  // screen, the confirm screen and the result as roots and minimised the app
  // from all three. Walk 1 watched back drop from the photo screen straight to
  // the launcher, which is the whole of the "hardware back is unresolved" note
  // on the board.
  const state = new URLSearchParams(search).get('studio_status') || '';
  return ROOT_STUDIO_STATES.has(state) ? 'minimize' : 'navigate-back';
}

/**
 * Register the global Android back handler. Returns an unsubscribe fn.
 *
 * Uses Capacitor's own `backButton` event rather than Ionic's `ionBackButton`.
 * Ionic only dispatches `ionBackButton` when its router/IonRouterOutlet drives
 * navigation — and this app deliberately uses Ionic components standalone with
 * react-router v6 (@ionic/react-router requires v5). Verified on device: the
 * Ionic event never fired, so back exited the app from any screen, including
 * with a sheet open. Capacitor's event always fires in a Capacitor app, and
 * registering a listener suppresses the default "exit" behaviour.
 */
export function registerHardwareBack(): () => void {
  if (!isNative) return () => {};

  // Capacitor's own event — device-traced as the one that actually fires here.
  // Ionic's `ionBackButton` never dispatches in this setup, so it cannot be
  // used; Ionic's competing exit handler is disabled via
  // setupIonicReact({ hardwareBackButton: false }) in App.tsx.
  const sub = App.addListener('backButton', () => {
    switch (decideBack(backInterceptors.length > 0, window.location.pathname, window.location.search)) {
      case 'close-sheet':
        popBackInterceptor();
        break;
      case 'navigate-back':
        window.history.back();
        break;
      case 'minimize':
        void App.minimizeApp();
        break;
    }
  });

  return () => {
    void sub.then((h) => h.remove());
  };
}
