// src/lib/attribution.ts
// Install + campaign attribution for the "Shad Hair Studio" content network.
// Parses UTM/content/ref from deep links / the Play install referrer, persists
// the FIRST meaningful attribution, reports install_attributed once, and exposes
// the pending deep-link target (the referenced hairstyle/result) for routing.
//
// Framework- and plugin-agnostic: the native Install Referrer read lives in the
// caller (App.tsx) and feeds its string into captureAttribution().

import { Capacitor } from '@capacitor/core';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Network identity + deep-link host (override via env for a branded domain later).
export const CHANNEL_HANDLE = (import.meta as any).env?.VITE_CHANNEL_HANDLE || '@ShadHairStudio';
export const APP_LINK_HOST = ((import.meta as any).env?.VITE_APP_LINK_HOST || 'https://167-86-112-90.sslip.io').replace(/\/$/, '');

/** Build a shareable https deep link (routes through /go -> app or Play Store w/ referrer). */
export function buildDeepLink(params: { content?: string; videoId?: string; source?: string; medium?: string; ref?: string }): string {
  const q = new URLSearchParams();
  if (params.content) q.set('content', params.content);
  q.set('utm_source', params.source || 'youtube');
  q.set('utm_medium', params.medium || 'video');
  if (params.videoId) q.set('utm_campaign', params.videoId);
  if (params.ref) q.set('ref', params.ref);
  return `${APP_LINK_HOST}/go?${q.toString()}`;
}

/** A user's referral link as a proper deep link (deferred-install aware). */
export function buildReferralLink(code: string): string {
  return buildDeepLink({ source: 'referral', medium: 'user', ref: code });
}

const LS = {
  installId: 'hs_install_id',
  data: 'hs_attribution',
  pendingTarget: 'hs_pending_artifact',
  sent: 'hs_attribution_sent',
  referrerChecked: 'hs_referrer_checked',
} as const;

export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string; // video_id
  content?: string;  // artifact_id (hairstyle/result)
  ref?: string;
  method?: 'deep_link' | 'install_referrer' | 'first_launch_url' | 'manual';
}

function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* ignore */ }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable per-install id used to dedupe attribution server-side. */
export function getInstallId(): string {
  let v = localStorage.getItem(LS.installId);
  if (!v) { v = genId(); localStorage.setItem(LS.installId, v); }
  return v;
}

/** Extract attribution from a full URL, a "?a=b" query, or a bare referrer string. */
export function parseAttribution(input?: string | null): Attribution {
  if (!input) return {};
  let params: URLSearchParams;
  try {
    params = new URL(input).searchParams;
  } catch {
    params = new URLSearchParams(String(input).replace(/^\?/, ''));
  }
  const pick = (k: string) => {
    const v = params.get(k);
    return v && v.length > 0 ? v : undefined;
  };
  return {
    source: pick('utm_source'),
    medium: pick('utm_medium'),
    campaign: pick('utm_campaign'),
    content: pick('content'),
    ref: pick('ref'),
  };
}

export function hasAttribution(a: Attribution): boolean {
  return !!(a.source || a.campaign || a.content || a.ref);
}

export function getStoredAttribution(): Attribution | null {
  try { return JSON.parse(localStorage.getItem(LS.data) || 'null'); } catch { return null; }
}

/**
 * Capture attribution from an incoming link/referrer. Persists the FIRST
 * meaningful attribution (does not overwrite), records the pending deep-link
 * target, and mirrors a referral code into the existing referral flow.
 */
export function captureAttribution(input?: string | null, method: Attribution['method'] = 'deep_link'): Attribution {
  const a = parseAttribution(input);
  if (!hasAttribution(a)) return a;

  const existing = getStoredAttribution();
  if (!existing || !hasAttribution(existing)) {
    localStorage.setItem(LS.data, JSON.stringify({ ...a, method }));
  }
  // The specific hairstyle/result the content referenced — route to it.
  if (a.content) localStorage.setItem(LS.pendingTarget, a.content);
  // Reuse the existing referral pipeline (don't overwrite a stored code).
  if (a.ref && !localStorage.getItem('referral_code')) localStorage.setItem('referral_code', a.ref);

  return a;
}

/** The referenced hairstyle/result id to deep-link into (or null). */
export function getPendingTarget(): string | null {
  return localStorage.getItem(LS.pendingTarget);
}
/** Set the pending deep-link target (e.g. from a personalized push tap). */
export function setPendingTarget(id: string): void {
  if (id) localStorage.setItem(LS.pendingTarget, id);
}
export function clearPendingTarget(): void {
  localStorage.removeItem(LS.pendingTarget);
}

/** Guard so the native install referrer is read at most once per install. */
export function shouldCheckInstallReferrer(): boolean {
  return Capacitor.getPlatform() === 'android' && localStorage.getItem(LS.referrerChecked) !== '1';
}
export function markInstallReferrerChecked(): void {
  localStorage.setItem(LS.referrerChecked, '1');
}

/**
 * Report install_attributed exactly once per install (organic installs included,
 * with null source). Server dedupes by installId; the local flag avoids spam.
 */
export async function reportInstallOnce(extra?: Partial<Attribution> & { rawReferrer?: string }): Promise<void> {
  if (localStorage.getItem(LS.sent) === '1') return;

  const stored = getStoredAttribution() || {};
  const a: Attribution = { ...stored, ...extra };
  const token = localStorage.getItem('auth_token');

  try {
    const res = await fetch(`${API_BASE_URL}/attribution/install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        installId: getInstallId(),
        source: a.source || null,
        medium: a.medium || null,
        campaign: a.campaign || null,
        content: a.content || null,
        ref: a.ref || null,
        platform: Capacitor.getPlatform(),
        method: extra?.method || stored.method || 'first_launch_url',
        rawReferrer: extra?.rawReferrer || null,
        appVersion: (import.meta as any).env?.VITE_APP_VERSION || null,
      }),
    });
    if (res.ok) localStorage.setItem(LS.sent, '1');
  } catch {
    // Network error — leave the flag unset so we retry on next launch.
  }
}
