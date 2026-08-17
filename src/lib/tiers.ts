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

/**
 * What the store will actually charge, keyed by the tier's `productId`.
 *
 * Walk 4 found the paywall printing "$3.99/mo" to a handset whose Play account
 * bills in naira — the price was a literal in this file, and §7.4 step 3 says in
 * so many words that the paywall reads the offering and hardcodes no store price.
 * `priceUsd` above is the PLAN's number, used for ordering and for the margin
 * maths; it is never shown to anyone once the store has quoted a real one.
 */
export type StorePrices = Record<string, string>;

/**
 * Google Play returns subscription identifiers as "subscriptionId:basePlanId"
 * ("plus_annual:plus-annual-1y"), so a plain id must match the head as well as
 * the whole. One-time packs have no colon and still match exactly.
 */
export function productMatches(identifier: string, productId?: string): boolean {
  return !!productId && (identifier === productId || identifier.split(':')[0] === productId);
}

/**
 * The price to print, or null when the store has not offered this product.
 *
 * Null is the important case and the reason this returns one: a tier whose
 * product does not exist in the live offering cannot be bought, so quoting a
 * price for it is an advertisement for something that is not for sale.
 */
export function priceLabel(t: Tier, prices?: StorePrices): string | null {
  if (t.priceUsd === 0) return 'Free';
  const quoted = t.productId ? prices?.[t.productId] : undefined;
  // A price is only ever shown for something that can actually be bought.
  // Printing "$3.99/mo" beside a button reading "Plus isn't on sale yet" is
  // still an advertisement for a thing that is not for sale — and `priceUsd` is
  // the plan's dollar figure, which is not what a naira account would be
  // charged even once the product does exist.
  return quoted ? `${quoted}/mo` : null;
}

/** Can this tier actually be purchased right now? */
export function isPurchasable(t: Tier, prices?: StorePrices): boolean {
  if (!t.productId) return false;
  // Without a store catalogue we cannot claim it is buyable.
  return !!prices && !!prices[t.productId];
}
