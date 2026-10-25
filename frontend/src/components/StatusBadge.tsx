import { cn } from '../lib/cn';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'На модерации', className: 'border-amber-400/25 bg-amber-400/10 text-amber-300' },
  APPROVED: { label: 'Опубликовано', className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' },
  REJECTED: { label: 'Отклонено', className: 'border-red-400/25 bg-red-400/10 text-red-300' },
  ACTIVE: { label: 'Активен', className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' },
  USED: { label: 'Использован', className: 'border-white/15 bg-white/5 text-white/50' },
  CANCELLED: { label: 'Отменён', className: 'border-red-400/25 bg-red-400/10 text-red-300' },
  EXPIRED: { label: 'Истёк', className: 'border-white/15 bg-white/5 text-white/45' },
  AVAILABLE: { label: 'Доступен', className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' },
  RESERVED: { label: 'Зарезервирован', className: 'border-sky-400/25 bg-sky-400/10 text-sky-300' },
  GIVEN: { label: 'Выдан', className: 'border-white/15 bg-white/5 text-white/50' },
  USER: { label: 'Пользователь', className: 'border-white/15 bg-white/5 text-white/60' },
  ORGANIZER: { label: 'Организатор', className: 'border-pulse-400/30 bg-pulse-400/10 text-pulse-300' },
  ADMIN: { label: 'Администратор', className: 'border-vibe-400/30 bg-vibe-400/10 text-vibe-300' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: 'border-white/15 bg-white/5 text-white/60',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
};
