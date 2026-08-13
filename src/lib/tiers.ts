// tiers.ts — the subscription tiers, as the APP talks about them (M5 §7.2/§7.4).
//
// Mirrors backend/services/entitlements.js. That file is the authority on what
// a user may DO; this one is the authority on how it is SOLD. They must agree on
// the numbers, which is why both list them explicitly rather than one deriving
// from the other across a network boundary.
//
// The unit language is deliberate. Internally a "unit" is one Preview
// generation and higher qualities cost more, but nobody buys units — they buy
// looks. Every string here is in looks, and the price is a trailing chip rather
// than the headline, because the previous paywall led with credit arithmetic
// ("4 cr", "8 cr") and asked the user to do maths before they could want
// anything.

export type TierId = 'free' | 'plus' | 'studio';

export interface Tier {
  id: TierId;
  label: string;
  /** RevenueCat product identifier. Absent until the product exists. */
  productId?: string;
  priceUsd: number;
  /** Daily allowance in units — 1 unit = 1 Preview look. */
  dailyUnits: number;
  monthlyUnits: number;
  /** Headline benefit, in the user's language. */
  headline: string;
  /** Two or three concrete things this tier unlocks. Never more. */
  perks: string[];
  /** Limitations. Rendered with a neutral marker — a tick beside "watermark on
      shares" reads as though the watermark were something you are buying. */
  limits?: string[];
  qualities: Array<'standard' | 'hd' | 'pro'>;
}

export const TIERS: Tier[] = [
  {
    id: 'free',
    label: 'Free',
    priceUsd: 0,
    dailyUnits: 2,
    monthlyUnits: 20,
    headline: '2 looks a day',
    perks: ['Preview quality'],
    limits: ['Shares carry a small wordmark'],
    qualities: ['standard'],
  },
  {
    id: 'plus',
    label: 'Plus',
    productId: 'plus_monthly_399',
    priceUsd: 3.99,
    dailyUnits: 8,
    monthlyUnits: 80,
    headline: '8 looks a day',
    perks: ['Portrait quality', 'No watermark', 'Editorial share cards'],
    qualities: ['standard', 'hd'],
  },
  {
    id: 'studio',
    label: 'Studio',
    productId: 'studio_monthly_999',
    priceUsd: 9.99,
    dailyUnits: 20,
    monthlyUnits: 200,
    headline: '20 looks a day',
    perks: ['Studio quality — our best likeness', '4K downloads', 'Priority queue'],
    qualities: ['standard', 'hd', 'pro'],
  },
];

/** Plus is preselected: it is the tier the pricing is designed around. */
export const DEFAULT_TIER: TierId = 'plus';

export function tier(id: TierId): Tier {
  return TIERS.find((t) => t.id === id) ?? TIERS[0];
}

/** "$3.99/mo" — or "Free". Kept here so no component formats money itself. */
export function priceLabel(t: Tier): string {
  return t.priceUsd === 0 ? 'Free' : `$${t.priceUsd.toFixed(2)}/mo`;
}
