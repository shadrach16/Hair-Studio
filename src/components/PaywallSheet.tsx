// PaywallSheet — the tier paywall (M5 §7.4).
//
// The old sheet was titled "Get Credits" and opened on a balance pill reading
// "12 credits", then a grid of packs priced in credits. That asks the user to do
// arithmetic — how many credits is a look? — before they are allowed to want
// anything. It is also why zero subscriptions ever converted: nothing on the
// screen described an ongoing relationship, only a refill.
//
// This leads with what you get: looks per day. Price is a trailing chip. Plus is
// preselected because it is the tier the pricing was designed around, and Free
// is shown — not to be chosen, but to anchor what the user has now.
//
// Top-up packs stay (§7.3). They are the only thing this app has ever actually
// sold, and the over-cap moment is exactly when someone wants one. They sit
// BELOW the tiers as a secondary path rather than competing for the headline.

import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import {
  TIERS,
  DEFAULT_TIER,
  priceLabel,
  isPurchasable,
  type TierId,
  type Tier,
  type StorePrices,
} from '@/lib/tiers';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { cn } from '@/lib/utils';

interface PaywallSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** The tier the user is on today, so "Current plan" can be shown honestly. */
  currentTier?: TierId;
  /** Purchase a subscription product. Absent -> the CTA explains why. */
  onSubscribe?: (productId: string) => Promise<void> | void;
  /** Opens the existing top-up pack flow. */
  onTopUp?: () => void;
  /** Contextual reason the sheet opened, e.g. hitting the daily cap. */
  reason?: string;
  /**
   * What the store is actually selling, productId -> formatted price.
   *
   * Walk 4's blocker: the CTA read "Get Plus — $3.99/mo" and answered a tap with
   * `Subscription "plus_monthly_399" not found.` The old guard was
   * `!chosen.productId` — whether we had WRITTEN DOWN an id, not whether the
   * store had one to sell. Filling in `productId` in tiers.ts silently turned a
   * dead button live. This is the same question asked of the store instead, so
   * the day the products are created the CTA goes live on its own and it can
   * never again advertise something Play will refuse.
   *
   * Undefined means "no store here" (web), where the plan price still shows.
   */
  storePrices?: StorePrices;
}

/**
 * The tier cards plus their single CTA, with no chrome of its own — so it can be
 * dropped into the existing PricingModal instead of nesting a second sheet
 * (which would mean two drag handles and two backdrops).
 */
export const TierChooser: React.FC<Omit<PaywallSheetProps, 'isOpen' | 'onClose'> & {
  onClose?: () => void;
}> = ({
  currentTier = 'free',
  onSubscribe,
  onTopUp,
  reason,
  storePrices,
}) => {
  const [selected, setSelected] = useState<TierId>(DEFAULT_TIER);
  const [busy, setBusy] = useState(false);

  const chosen = TIERS.find((t) => t.id === selected)!;
  const isCurrent = chosen.id === currentTier;
  const canBuy = isPurchasable(chosen, storePrices);
  const chosenPrice = priceLabel(chosen, storePrices);

  const handleSubscribe = async () => {
    if (!canBuy || !chosen.productId || !onSubscribe || isCurrent) return;
    setBusy(true);
    try {
      await onSubscribe(chosen.productId);
    } finally {
      setBusy(false);
    }
  };

  return (
      <div className="pb-2">
        <div className="mb-5">
          <h2 className="font-display text-[26px] leading-tight text-ink">
            Style without counting
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            {reason || 'Every look you try, every day — no credits to track.'}
          </p>
        </div>

        <div className="space-y-2.5">
          {TIERS.map((t) => (
            <TierCard
              key={t.id}
              tier={t}
              selected={t.id === selected}
              isCurrent={t.id === currentTier}
              price={priceLabel(t, storePrices)}
              onSelect={() => setSelected(t.id)}
            />
          ))}
        </div>

        {/* One primary action, reflecting the selected card. */}
        <button
          onClick={handleSubscribe}
          disabled={busy || isCurrent || !canBuy}
          className={cn(
            'mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-opacity',
            isCurrent || !canBuy
              ? 'bg-surface text-ink-3 ring-1 ring-hairline'
              : 'bg-brass text-white active:scale-[0.99]',
            busy && 'opacity-60'
          )}
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          {isCurrent
            ? 'Your current plan'
            : !canBuy
            ? `${chosen.label} isn't on sale yet`
            : `Get ${chosen.label} — ${chosenPrice}`}
        </button>

        {/* Said plainly rather than left to a greyed-out button, because "a dead
            primary button with no explanation is a serious finding" and the
            person reading it is trying to give us money. */}
        {!isCurrent && !canBuy && (
          <p className="mt-2.5 text-center text-[12px] leading-relaxed text-ink-2">
            Plans are not open yet. Top up below and you can style today — your
            looks never expire.
          </p>
        )}

        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-ink-3">
          Cancel any time in Google Play. Your existing credits stay in your
          account and never expire.
        </p>

        {/* Secondary path. Deliberately quiet, deliberately present. */}
        {onTopUp && (
          <button
            onClick={onTopUp}
            className="mt-5 w-full text-center text-[13px] text-ink-2 underline underline-offset-4"
          >
            Just need a few more looks? Top up instead
          </button>
        )}
      </div>
  );
};

/** The standalone sheet, kept for surfaces that are not already in a modal. */
export const PaywallSheet: React.FC<PaywallSheetProps> = ({ isOpen, onClose, ...rest }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} breakpoints={[0, 0.92]} initialBreakpoint={0.92}>
    <TierChooser {...rest} onClose={onClose} />
  </BottomSheet>
);

const TierCard: React.FC<{
  tier: Tier;
  selected: boolean;
  isCurrent: boolean;
  /** Null when the store is not selling this tier — then no price is shown. */
  price: string | null;
  onSelect: () => void;
}> = ({ tier: t, selected, isCurrent, price, onSelect }) => (
  <button
    onClick={onSelect}
    className={cn(
      'w-full rounded-2xl px-4 py-3.5 text-left transition-colors',
      selected ? 'bg-surface-2 ring-2 ring-brass' : 'bg-surface ring-1 ring-hairline'
    )}
  >
    <div className="flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[19px] text-ink">{t.label}</span>
        {isCurrent && (
          <span className="rounded-full bg-hairline px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-2">
            Current
          </span>
        )}
      </div>
      {/* Price is a trailing chip, not the headline — and absent entirely when
          the store has nothing to sell, rather than a number we invented. */}
      <span className="text-[13px] font-medium text-ink-2">
        {price ?? 'Soon'}
      </span>
    </div>

    {/* The number that actually matters. */}
    <p className="mt-0.5 text-[15px] text-ink">{t.headline}</p>

    <ul className="mt-2 space-y-1">
      {t.perks.map((p) => (
        <li key={p} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-2">
          <IonIcon icon={checkmark} style={{ fontSize: 13, marginTop: 2 }} className="text-brass" />
          {p}
        </li>
      ))}
      {/* Limitations get a neutral dash, never a brass tick. */}
      {(t.limits || []).map((l) => (
        <li key={l} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-3">
          <span className="mt-[9px] h-px w-2 shrink-0 bg-ink-3/60" />
          {l}
        </li>
      ))}
    </ul>
  </button>
);

export default PaywallSheet;
