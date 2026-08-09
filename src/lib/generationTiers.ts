// generationTiers.ts — the single source of truth for what a generation costs.
//
// This file exists because the cost was previously duplicated in three places
// (ConfirmGenerateScreen, PreGenerationSheet, StyleDetailSheet) and computed as
// `hairstyle.price * multiplier`, while the backend charges a FLAT per-tier
// amount. The two drifted: the UI advertised "1 credit" on styles the server
// charged 2 for. Any future price change must happen here (and in the backend's
// MODE_PRICING, which these values mirror).

export type GenerationMode = 'standard' | 'hd' | 'pro';

export interface GenerationTier {
  id: GenerationMode;
  /** User-facing name. Camera language, not AI language. */
  label: string;
  /** Flat credit cost — matches backend MODE_PRICING[mode].credits exactly. */
  credits: number;
  description: string;
}

export const GENERATION_TIERS: GenerationTier[] = [
  { id: 'standard', label: 'Standard', credits: 2, description: 'Fast results, good quality' },
  { id: 'hd', label: 'HD', credits: 4, description: 'Sharper detail, better realism' },
  { id: 'pro', label: 'Pro', credits: 6, description: 'Best quality, most lifelike' },
];

/** Cost of the cheapest (default) tier — what a "try this style" costs. */
export const BASE_GENERATION_COST =
  GENERATION_TIERS.find((t) => t.id === 'standard')!.credits;

export function tierCost(mode: GenerationMode): number {
  return GENERATION_TIERS.find((t) => t.id === mode)?.credits ?? BASE_GENERATION_COST;
}
