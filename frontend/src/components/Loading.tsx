import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn('h-5 w-5 animate-spin', className)} />
);

export const LoadingBlock = ({ label = 'Загружаем данные' }: { label?: string }) => (
  <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-white/40">
    <Spinner className="h-7 w-7 text-vibe-400" />
    <span className="text-sm">{label}…</span>
  </div>
);

export const ErrorBlock = ({
  message = 'Не удалось загрузить данные',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center">
    <p className="max-w-md text-sm text-red-300">{message}</p>
    {onRetry ? (
      <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm">
        Попробовать снова
      </button>
    ) : null}
  </div>
);
