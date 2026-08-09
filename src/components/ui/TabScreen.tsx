// TabScreen.tsx — shared scaffold for a tab/screen.
//
// Ported from Nerve's TabScreen: an IonPage (so Ionic owns page transitions)
// with fixed chrome above a scrolling IonContent. `footer` pins a primary
// action ABOVE the tab bar without scrolling — for a CTA that must always be
// reachable (e.g. "Upload photo to try on").
//
// Safe-area rule (4.1): the ChromeBar owns env(safe-area-inset-top). When a
// screen has no chrome bar, pass `standaloneHeader` so ScreenHeader takes the
// inset instead — exactly one element, never both.

import type { ReactNode } from 'react';
import { IonContent, IonFooter, IonPage } from '@ionic/react';
import { ScreenHeader } from './ScreenHeader';
import { ErrorBoundary } from './ErrorBoundary';
import { cn } from '@/lib/utils';

export interface TabScreenProps {
  title: ReactNode;
  subtitle?: string;
  /** Right-hand slot on the large title row. */
  trailing?: ReactNode;
  /** The top chrome strip (wordmark + actions, or a back row). */
  chrome?: ReactNode;
  /** Set when there is no chrome bar above the title. */
  standaloneHeader?: boolean;
  /** Hide the large title entirely (full-bleed screens like Results). */
  hideHeader?: boolean;
  footer?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}

export function TabScreen({
  title,
  subtitle,
  trailing,
  chrome,
  standaloneHeader = false,
  hideHeader = false,
  footer,
  contentClassName,
  children,
}: TabScreenProps) {
  return (
    <IonPage>
      {chrome}
      {!hideHeader && (
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          trailing={trailing}
          standalone={standaloneHeader && !chrome}
        />
      )}
      <IonContent scrollY className={cn('hs-content', contentClassName)}>
        {/* Per-tab boundary: one broken tab can't take the whole shell down. */}
        <ErrorBoundary scope={typeof title === 'string' ? title : undefined}>
          <div className="flex min-h-full flex-col">{children}</div>
        </ErrorBoundary>
      </IonContent>
      {footer && (
        <IonFooter className="ion-no-border">
          {/* Hairline + surface so the pinned action reads as a bar, not a
              floating chip. */}
          <div className="border-t border-hairline bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        </IonFooter>
      )}
    </IonPage>
  );
}

export default TabScreen;
