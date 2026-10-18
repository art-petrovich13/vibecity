import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const buildPages = (page: number, totalPages: number): Array<number | 'ellipsis'> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];

  if (page > 3) pages.push('ellipsis');

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) pages.push('ellipsis');

  pages.push(totalPages);

  return pages;
};

export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Пагинация">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn btn-secondary h-10 w-10"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((value, index) =>
        value === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-white/30">
            …
          </span>
        ) : (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              'h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition',
              value === page
                ? 'bg-vibe-gradient text-white shadow-glow'
                : 'border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white',
            )}
            aria-current={value === page ? 'page' : undefined}
          >
            {value}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn btn-secondary h-10 w-10"
        aria-label="Следующая страница"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};
