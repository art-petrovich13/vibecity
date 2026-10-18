import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-16 text-center',
      className,
    )}
  >
    {icon ? (
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/40">
        {icon}
      </div>
    ) : null}
    <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
    {description ? (
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/45">{description}</p>
    ) : null}
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);
