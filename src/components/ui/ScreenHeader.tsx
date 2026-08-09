// ScreenHeader.tsx — the large-title header.
//
// Ported from the verified Retinue/Nerve pattern. Deliberately NOT a
// translucent blur bar: the references keep status bar, chrome bar and page as
// one continuous plane of --surface, and put the title *below* the chrome bar
// rather than inside it. Zero seams is what reads "premium native".
//
// Our one deviation: the title is set in the editorial serif (Fraunces) rather
// than sans, per the two-typeface system — the title is Hair Studio's voice.

import type { ReactNode } from 'react';

export interface ScreenHeaderProps {
  /** Usually a string; accepts a node so a wordmark can stand in as a logo. */
  title: ReactNode;
  subtitle?: string;
  /** Right-hand slot — keep to ONE action for a calm header. */
  trailing?: ReactNode;
  /**
   * True ONLY when this header is the topmost element on screen (no chrome bar
   * above it). Inside the shell the chrome bar already owns the safe-area
   * inset; repeating it here double-pads the title — a bug the reference app
   * hit in production. The rule: exactly one element owns the top inset.
   */
  standalone?: boolean;
}

export function ScreenHeader({ title, subtitle, trailing, standalone = false }: ScreenHeaderProps) {
  return (
    <header
      className="px-5 pb-2"
      style={{
        paddingTop: standalone ? 'calc(env(safe-area-inset-top) + 0.75rem)' : '0.375rem',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-display text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-label text-ink-3">{subtitle}</p>}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </header>
  );
}

export default ScreenHeader;
