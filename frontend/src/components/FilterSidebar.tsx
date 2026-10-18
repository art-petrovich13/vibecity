import { CalendarDays, MapPin, RotateCcw, Tag as TagIcon } from 'lucide-react';
import type { Catalog } from '../types';
import { cn } from '../lib/cn';

export type SortOption = 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc';

export interface FilterValues {
  category: string;
  city: string;
  tagId?: number;
  dateFrom: string;
  dateTo: string;
  sort: SortOption;
}

export const DEFAULT_FILTERS: FilterValues = {
  category: '',
  city: '',
  tagId: undefined,
  dateFrom: '',
  dateTo: '',
  sort: 'date_asc',
};

interface FilterSidebarProps {
  catalog?: Catalog;
  filters: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onReset: () => void;
  className?: string;
}

export const FilterSidebar = ({ catalog, filters, onChange, onReset, className }: FilterSidebarProps) => {
  const activeCount =
    (filters.category ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.tagId ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <aside className={cn('panel p-5 sm:p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Подбор</p>
          <h2 className="mt-1 font-display text-lg font-semibold">Фильтры</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={activeCount === 0}
          className="btn btn-ghost btn-sm"
          title="Сбросить фильтры"
        >
          <RotateCcw size={14} />
          {activeCount > 0 ? `Сбросить (${activeCount})` : 'Сбросить'}
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <label className="field-label flex items-center gap-1.5" htmlFor="filter-city">
            <MapPin size={12} /> Город
          </label>
          <select
            id="filter-city"
            className="field"
            value={filters.city}
            onChange={(event) => onChange({ city: event.target.value })}
          >
            <option value="">Все города</option>
            {catalog?.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="field-label">Категория</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ category: '' })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                filters.category === ''
                  ? 'border-vibe-400/50 bg-vibe-500/20 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white',
              )}
            >
              Все
            </button>
            {catalog?.categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  onChange({ category: filters.category === category ? '' : category })
                }
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  filters.category === category
                    ? 'border-vibe-400/50 bg-vibe-500/20 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white',
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label flex items-center gap-1.5">
            <TagIcon size={12} /> Теги
          </span>
          <div className="flex flex-wrap gap-2">
            {catalog?.tags.map((tag) => {
              const active = filters.tagId === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onChange({ tagId: active ? undefined : tag.id })}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'border-pulse-400/50 bg-pulse-500/15 text-pulse-200'
                      : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white',
                  )}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="field-label flex items-center gap-1.5">
            <CalendarDays size={12} /> Даты
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1 block text-[10px] text-white/30">С</span>
              <input
                type="date"
                className="field px-3 py-2 text-xs"
                value={filters.dateFrom}
                onChange={(event) => onChange({ dateFrom: event.target.value })}
              />
            </div>
            <div>
              <span className="mb-1 block text-[10px] text-white/30">По</span>
              <input
                type="date"
                className="field px-3 py-2 text-xs"
                value={filters.dateTo}
                onChange={(event) => onChange({ dateTo: event.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
