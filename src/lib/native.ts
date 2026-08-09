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

export function decideBack(
  hasOpenSheet: boolean,
  pathname: string
): 'close-sheet' | 'navigate-back' | 'minimize' {
  if (hasOpenSheet) return 'close-sheet';
  return BACK_ROOTS.has(pathname) ? 'minimize' : 'navigate-back';
}

/** Register the global Android back handler. Returns an unsubscribe fn. */
export function registerHardwareBack(): () => void {
  if (!isNative) return () => {};

  const handler = (ev: Event) => {
    const detail = (ev as CustomEvent<{ register: (p: number, cb: () => void) => void }>).detail;
    detail.register(10, () => {
      switch (decideBack(backInterceptors.length > 0, window.location.pathname)) {
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
  };

  document.addEventListener('ionBackButton', handler);
  return () => document.removeEventListener('ionBackButton', handler);
}
