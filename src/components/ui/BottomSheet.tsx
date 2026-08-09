// BottomSheet.tsx — the app's single sheet primitive.
//
// Uses IonModal in sheet mode, which gives genuinely native behaviour that
// hand-rolled modals cannot: drag-to-dismiss, snap breakpoints, rubber-band
// physics, correct backdrop/scroll locking, and hardware back-button handling.
// Replaces the 7 ad-hoc modal implementations across the app.
//
// Deliberately NOT using @ionic/react-router: that package requires
// react-router v5 and this app is on v6. Ionic components work standalone.

import React from 'react';
import { IonModal } from '@ionic/react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Sheet heights as fractions of the screen. Default: half then full. */
  breakpoints?: number[];
  initialBreakpoint?: number;
  /** Title rendered in the editorial serif. Omit for a chrome-less sheet. */
  title?: string;
  /** Small line under the title. */
  subtitle?: string;
  /** Hide the grab handle (e.g. for a non-dismissible flow). */
  showHandle?: boolean;
  /** Prevent swipe/backdrop dismissal (destructive or in-flight actions). */
  canDismiss?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  breakpoints = [0, 0.6, 1],
  initialBreakpoint = 0.6,
  title,
  subtitle,
  showHandle = true,
  canDismiss = true,
  className,
  children,
}) => (
  <IonModal
    isOpen={isOpen}
    onDidDismiss={onClose}
    breakpoints={breakpoints}
    initialBreakpoint={initialBreakpoint}
    handle={showHandle}
    canDismiss={canDismiss}
    className="hs-sheet"
  >
    <div className={cn('flex flex-col max-h-full bg-surface-2 text-ink', className)}>
      {(title || subtitle) && (
        <div className="px-5 pt-4 pb-3 border-b border-hairline">
          {title && <h2 className="font-display text-title text-ink">{title}</h2>}
          {subtitle && <p className="text-caption text-ink-2 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
    </div>
  </IonModal>
);

export default BottomSheet;
