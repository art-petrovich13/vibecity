import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { eventsApi, metaApi } from '../api/endpoints';
import { EventCard } from '../components/EventCard';
import {
  DEFAULT_FILTERS,
  FilterSidebar,
  type FilterValues,
  type SortOption,
} from '../components/FilterSidebar';
import { EmptyState } from '../components/EmptyState';
import { ErrorBlock } from '../components/Loading';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { formatDate, formatPrice, pluralize } from '../lib/format';
import { cn } from '../lib/cn';

const PAGE_SIZE = 9;

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'date_asc', label: 'Сначала ближайшие' },
  { value: 'date_desc', label: 'Сначала поздние' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
];

export const HomePage = () => {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      category: filters.category || undefined,
      city: filters.city || undefined,
      tagId: filters.tagId,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sort: filters.sort,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [filters, search, page],
  );

  const catalogQuery = useQuery({
    queryKey: ['catalog'],
    queryFn: metaApi.catalog,
    staleTime: 5 * 60_000,
  });

  const featuredQuery = useQuery({
    queryKey: ['events', 'featured'],
    queryFn: () => eventsApi.list({ limit: 3, sort: 'date_asc' }),
    staleTime: 60_000,
  });

  const eventsQuery = useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.list(params),
    placeholderData: keepPreviousData,
  });

  const patchFilters = (patch: Partial<FilterValues>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const scrollToEvents = () => {
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseCategory = (category: string) => {
    patchFilters({ category: filters.category === category ? '' : category });
    scrollToEvents();
  };

  const featured = featuredQuery.data?.items ?? [];
  const totalEvents = featuredQuery.data?.total ?? 0;
  const events = eventsQuery.data?.items ?? [];
  const total = eventsQuery.data?.total ?? 0;

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.tagId ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 bg-vibe-glow" />
        <div className="pointer-events-none absolute -left-40 top-32 h-72 w-72 rounded-full bg-vibe-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-pulse-500/15 blur-[120px]" />

        <div className="page-container relative grid items-center gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="animate-fade-up">
            <span className="chip border-vibe-400/25 bg-vibe-500/10 text-vibe-200">
              <Sparkles size={13} />
              Афиша на каждый вечер
            </span>

            <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]">
              Город, в котором
              <br />
              <span className="gradient-text">есть вайб</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">
              Концерты, театр, выставки, стендап и спорт — по всей Беларуси. Находите события,
              покупайте билеты и сохраняйте QR-код до самого входа.
            </p>

            <form
              className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/10 bg-ink-900/80 p-1.5 pl-5 shadow-card backdrop-blur transition focus-within:border-vibe-500/50"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
                setPage(1);
                scrollToEvents();
              }}
            >
              <Search size={18} className="shrink-0 text-white/35" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Найти событие, площадку или организатора"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                aria-label="Поиск мероприятий"
              />
              <button type="submit" className="btn btn-primary btn-md shrink-0">
                Найти
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-white/30">Популярное:</span>
              {(catalogQuery.data?.categories ?? ['Концерты', 'Театр', 'Стендап', 'Выставки']).map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => chooseCategory(category)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      filters.category === category
                        ? 'border-vibe-400/50 bg-vibe-500/20 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white',
                    )}
                  >
                    {category}
                  </button>
                ),
              )}
            </div>

            <div className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="font-display text-2xl font-bold text-white">{totalEvents || '—'}</p>
                <p className="text-xs text-white/35">
                  {pluralize(totalEvents, 'событие', 'события', 'событий')} в афише
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  {catalogQuery.data?.cities.length ?? '—'}
                </p>
                <p className="text-xs text-white/35">
                  {pluralize(catalogQuery.data?.cities.length ?? 0, 'город', 'города', 'городов')}
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  {catalogQuery.data?.organizers.length ?? '—'}
                </p>
                <p className="text-xs text-white/35">организаторов</p>
              </div>
            </div>
          </div>

          {/* Poster stack */}
          <div className="on-media relative hidden h-[430px] lg:block" aria-hidden="true">
            <div className="absolute right-6 top-2 h-[340px] w-[250px] rotate-[7deg] overflow-hidden rounded-[28px] border border-white/10 bg-ink-800 shadow-card">
              {featured[1]?.imageUrl ? (
                <img
                  src={featured[1].imageUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(80%_80%_at_50%_0%,rgba(236,72,153,0.35),#14141e_70%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
            </div>

            <div className="absolute left-2 top-16 h-[340px] w-[250px] -rotate-[8deg] overflow-hidden rounded-[28px] border border-white/10 bg-ink-800 shadow-card">
              {featured[2]?.imageUrl ? (
                <img
                  src={featured[2].imageUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(80%_80%_at_50%_0%,rgba(139,92,246,0.4),#14141e_70%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
            </div>

            <div className="absolute bottom-0 left-1/2 h-[300px] w-[280px] -translate-x-1/2 overflow-hidden rounded-[30px] border border-white/15 bg-ink-800 shadow-glow">
              {featured[0]?.imageUrl ? (
                <img
                  src={featured[0].imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(80%_80%_at_50%_0%,rgba(139,92,246,0.5),#14141e_70%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
              {featured[0] ? (
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vibe-300">
                    {featured[0].category}
                  </span>
                  <p className="mt-1.5 font-display text-base font-semibold leading-tight">
                    {featured[0].name}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
                    <CalendarDays size={12} /> {formatDate(featured[0].date)} · {featured[0].time}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                    <MapPin size={12} /> {featured[0].place.city}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="absolute -right-2 bottom-24 rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-card backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Билет от</p>
              <p className="mt-0.5 font-display text-lg font-bold text-acid">
                {featured[0] ? formatPrice(featured[0].price) : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="page-container scroll-mt-24 py-10 lg:py-14">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Подборка VibeCity</p>
            <h2 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl">
              Ближайшие события
            </h2>
            <p className="mt-1.5 text-sm text-white/40">
              {eventsQuery.isLoading
                ? 'Загружаем афишу…'
                : `${total} ${pluralize(total, 'событие', 'события', 'событий')} найдено`}
              {activeFiltersCount > 0 ? ' по вашим фильтрам' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn btn-secondary btn-md lg:hidden"
            >
              <SlidersHorizontal size={16} />
              Фильтры
              {activeFiltersCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-vibe-500 px-1 text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              ) : null}
            </button>

            <label className="relative">
              <span className="sr-only">Сортировка</span>
              <select
                value={filters.sort}
                onChange={(event) => patchFilters({ sort: event.target.value as SortOption })}
                className="field h-10 cursor-pointer appearance-none py-0 pl-4 pr-9 text-xs font-medium"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowRight
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-white/30"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <FilterSidebar
            catalog={catalogQuery.data}
            filters={filters}
            onChange={patchFilters}
            onReset={resetFilters}
            className="sticky top-24 hidden self-start lg:block"
          />

          <div>
            {eventsQuery.isError ? (
              <ErrorBlock
                message="Не удалось загрузить афишу. Попробуйте обновить страницу."
                onRetry={() => eventsQuery.refetch()}
              />
            ) : eventsQuery.isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="panel overflow-hidden">
                    <div className="skeleton aspect-[16/10] rounded-none" />
                    <div className="space-y-3 p-5">
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton h-5 w-5/6" />
                      <div className="skeleton h-3 w-2/3" />
                      <div className="skeleton h-8 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                icon={<Search size={22} />}
                title="Ничего не нашлось"
                description="Попробуйте изменить фильтры, выбрать другой город или расширить диапазон дат."
                action={
                  <button type="button" onClick={resetFilters} className="btn btn-primary btn-md">
                    Сбросить фильтры
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                <div className="mt-10">
                  <Pagination page={page} totalPages={eventsQuery.data?.totalPages ?? 1} onChange={setPage} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="page-container pb-4">
        <div className="on-media relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-vibe-600/25 via-ink-900 to-pulse-500/15 px-6 py-10 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-pulse-500/20 blur-[90px]" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <p className="eyebrow">Организаторам</p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                Проводите события? Расскажите о них городу
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Разместите мероприятие в афише, управляйте продажами и следите за статистикой —
                всё в одном кабинете.
              </p>
            </div>
            <Link to="/organizer" className="btn btn-primary btn-lg shrink-0">
              <Ticket size={18} />
              Разместить событие
            </Link>
          </div>
        </div>
      </section>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Фильтры"
        description="Настройте подборку под свой вечер"
      >
        <FilterSidebar
          catalog={catalogQuery.data}
          filters={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          className="border-0 bg-transparent p-0 backdrop-blur-none"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="btn btn-primary btn-md mt-6 w-full"
        >
          Показать {total} {pluralize(total, 'событие', 'события', 'событий')}
        </button>
      </Modal>
    </div>
  );
};
