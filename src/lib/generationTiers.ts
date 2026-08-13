// generationTiers.ts — the single source of truth for what a generation costs.
//
// This file exists because the cost was previously duplicated in three places
// (ConfirmGenerateScreen, PreGenerationSheet, StyleDetailSheet) and computed as
// `hairstyle.price * multiplier`, while the backend charges a FLAT per-tier
// amount. The two drifted: the UI advertised "1 credit" on styles the server
// charged 2 for. Any future price change must happen here (and in the backend's
// MODE_PRICING, which these values mirror).

// The ids stay 'standard' | 'hd' | 'pro' — they are the wire format the backend
// MODE_PRICING is keyed on, and every stored generation record uses them.
// Only the DISPLAY names changed (M4 §6.1).
export type GenerationMode = 'standard' | 'hd' | 'pro';

export interface GenerationTier {
  id: GenerationMode;
  /** User-facing name. Camera language, not AI language. */
  label: string;
  /** Flat credit cost — matches backend MODE_PRICING[mode].credits exactly. */
  credits: number;
  description: string;
}

// "Standard / HD / Pro" is spec-sheet language — it describes a FILE. Photography
// language describes what the user gets, and it is the whole reason someone pays
// three times as much: they are buying a portrait, not a bigger render.
export const GENERATION_TIERS: GenerationTier[] = [
  { id: 'standard', label: 'Preview', credits: 2, description: 'A quick look at the style' },
  { id: 'hd', label: 'Portrait', credits: 4, description: 'Sharper detail and truer skin tones' },
  { id: 'pro', label: 'Studio', credits: 6, description: 'Our closest likeness and finish' },
];

/** Presentation-agnostic lookup, so no component re-types the names. */
export function tierMeta(mode: GenerationMode): GenerationTier {
  return GENERATION_TIERS.find((t) => t.id === mode) ?? GENERATION_TIERS[0];
}

/** Cost of the cheapest (default) tier — what a "try this style" costs. */
export const BASE_GENERATION_COST =
  GENERATION_TIERS.find((t) => t.id === 'standard')!.credits;

export function tierCost(mode: GenerationMode): number {
  return GENERATION_TIERS.find((t) => t.id === mode)?.credits ?? BASE_GENERATION_COST;
}
