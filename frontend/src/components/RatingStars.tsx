import { Star } from 'lucide-react';
import { cn } from '../lib/cn';

interface RatingStarsProps {
  rating?: number | null;
  count?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}

export const RatingStars = ({
  rating,
  count,
  size = 14,
  showCount = false,
  className,
}: RatingStarsProps) => {
  if (rating === null || rating === undefined) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-white/35', className)}>
        <Star size={size} />
        Нет отзывов
      </span>
    );
  }

  const filled = Math.round(rating);

  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={`Рейтинг ${rating} из 5`}>
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            size={size}
            className={index < filled ? 'fill-amber-300 text-amber-300' : 'text-white/20'}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-white/80">{rating.toFixed(1)}</span>
      {showCount && typeof count === 'number' ? (
        <span className="text-xs text-white/35">({count})</span>
      ) : null}
    </span>
  );
};
