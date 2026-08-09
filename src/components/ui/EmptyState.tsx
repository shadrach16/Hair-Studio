// EmptyState.tsx — one empty/zero-data treatment for the whole app.
//
// Empty states are where cheap apps look cheapest (a bare "No data" string, or
// worse, a giant emoji). This gives every empty surface the same restrained,
// editorial treatment: a hairline-ringed glyph, a serif line, one action.

import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /** Small line-art icon. Keep it monochrome — no emoji. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center text-center px-8 py-14', className)}>
    {icon && (
      <div className="w-14 h-14 rounded-full ring-1 ring-hairline flex items-center justify-center text-ink-3 mb-4">
        {icon}
      </div>
    )}
    <h3 className="font-display text-title-sm text-ink">{title}</h3>
    {description && (
      <p className="text-body-sm text-ink-2 mt-1.5 max-w-[38ch] leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
