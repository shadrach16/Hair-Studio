// TabBar.tsx — the bottom tab bar (4.5).
//
// Same one-plane rule as the chrome bar: flat `bg-surface`, hairline top edge,
// no blur, no shadow. Uses ionicons with the outline -> filled swap on active
// (the pattern native tab bars use) and a brass active tint.
//
// Replaces MobileBottomNavigation, which used a white bar, lucide icons and a
// black top-accent stripe.

import { IonIcon } from '@ionic/react';
import {
  sparkles,
  sparklesOutline,
  heart,
  heartOutline,
  person,
  personOutline,
} from 'ionicons/icons';
import { cn } from '@/lib/utils';
import type { MobileShellTab } from '@/hooks/useStudioPageLogic';

interface TabItem {
  id: MobileShellTab;
  label: string;
  icon: string;
  iconActive: string;
}

const TABS: TabItem[] = [
  { id: 'try-on', label: 'Try On', icon: sparklesOutline, iconActive: sparkles },
  { id: 'looks', label: 'Looks', icon: heartOutline, iconActive: heart },
  { id: 'profile', label: 'Profile', icon: personOutline, iconActive: person },
];

export interface TabBarProps {
  activeTab: MobileShellTab;
  onNavigate: (tab: MobileShellTab) => void;
  /** Dot on Looks when a new result has landed there. */
  looksBadge?: boolean;
}

export function TabBar({ activeTab, onNavigate, looksBadge }: TabBarProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface lg:hidden"
    >
      <div
        className="mx-auto flex max-w-lg items-stretch justify-around px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-2',
                'transition-colors duration-150',
                isActive ? 'text-brass' : 'text-ink-3'
              )}
            >
              <span className="relative">
                <IonIcon
                  icon={isActive ? tab.iconActive : tab.icon}
                  aria-hidden="true"
                  style={{ fontSize: 24 }}
                />
                {tab.id === 'looks' && looksBadge && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brass ring-2 ring-surface" />
                )}
              </span>
              <span className={cn('text-micro', isActive ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TabBar;
