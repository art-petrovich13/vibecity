import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Check,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { EmptyState } from '../EmptyState';
import { ErrorBlock, LoadingBlock } from '../Loading';
import { Pagination } from '../Pagination';
import { StatusBadge } from '../StatusBadge';
import type { Event, EventStatus } from '../../types';
import { formatDateShort, formatPrice, pluralize } from '../../lib/format';
import { cn } from '../../lib/cn';

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: EventStatus | ''; label: string }> = [
  { value: '', label: 'Все' },
  { value: 'PENDING', label: 'На модерации' },
  { value: 'APPROVED', label: 'Опубликованы' },
  { value: 'REJECTED', label: 'Отклонены' },
];

export const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const eventsQuery = useQuery({
    queryKey: ['admin-events', { status, search, page }],
    queryFn: () =>
      adminApi.events({
        status: status || undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
        sort: 'date_asc',
      }),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['my-events'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: EventStatus }) =>
      adminApi.updateEventStatus(id, nextStatus),
    onSuccess: () => {
      setError('');
      invalidateAll();
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteEvent(id),
    onSuccess: () => {
      setError('');
      invalidateAll();
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const handleDelete = (event: Event) => {
    if (window.confirm(`Удалить мероприятие «${event.name}» вместе с билетами и отзывами?`)) {
      deleteMutation.mutate(event.id);
    }
  };

  const events = eventsQuery.data?.items ?? [];

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Модерация</p>
          <h2 className="mt-1 font-display text-xl font-bold">Мероприятия</h2>
          <p className="mt-1 text-xs text-white/35">
            Публикуйте, отклоняйте и удаляйте события. На модерацию попадают карточки
            пользователей.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              className="field h-10 w-full py-0 pl-9 pr-3 text-xs sm:w-64"
              placeholder="Название или площадка"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatus('');
              setPage(1);
            }}
            className="btn btn-secondary btn-md"
          >
            <RotateCcw size={14} /> Сбросить
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
              status === filter.value
                ? 'border-vibe-400/50 bg-vibe-500/20 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5">
        {eventsQuery.isError ? (
          <ErrorBlock message="Не удалось загрузить мероприятия" onRetry={() => eventsQuery.refetch()} />
        ) : eventsQuery.isLoading ? (
          <LoadingBlock label="Загружаем мероприятия" />
        ) : events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={22} />}
            title="Мероприятий не найдено"
            description="Смените фильтр статуса или поисковый запрос."
          />
        ) : (
          <>
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-white/30">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Мероприятие</th>
                      <th className="px-4 py-3 font-semibold">Автор</th>
                      <th className="px-4 py-3 font-semibold">Дата</th>
                      <th className="px-4 py-3 font-semibold">Продано</th>
                      <th className="px-4 py-3 font-semibold">Цена</th>
                      <th className="px-4 py-3 font-semibold">Статус</th>
                      <th className="px-5 py-3 text-right font-semibold">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {events.map((event) => (
                      <tr
                        key={event.id}
                        className={cn(
                          'table-row-hover',
                          event.status === 'PENDING' && 'bg-amber-400/[0.025]',
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                              {event.imageUrl ? (
                                <img
                                  src={event.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : null}
                            </span>
                            <div className="min-w-0">
                              <Link
                                to={`/events/${event.id}`}
                                className="block max-w-[280px] truncate font-medium text-white/90 transition hover:text-vibe-200"
                              >
                                {event.name}
                              </Link>
                              <p className="mt-0.5 truncate text-[11px] text-white/30">
                                {event.category} · {event.place.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-white/50">
                          {event.createdBy
                            ? `${event.createdBy.firstName} ${event.createdBy.lastName}`
                            : '—'}
                          <span className="block text-[11px] text-white/25">
                            {event.createdBy?.email ?? ''}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-white/55">
                          {formatDateShort(event.date)}
                          <span className="block text-[11px] text-white/30">{event.time}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-white/55">
                          {event.seats?.sold ?? 0} / {event.seats?.capacity ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-white/70">
                          {formatPrice(event.price)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={event.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {event.status !== 'APPROVED' ? (
                              <button
                                type="button"
                                title="Опубликовать"
                                disabled={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({ id: event.id, nextStatus: 'APPROVED' })
                                }
                                className="btn btn-ghost h-8 w-8 text-emerald-300 hover:bg-emerald-400/10"
                              >
                                {statusMutation.isPending &&
                                statusMutation.variables?.id === event.id &&
                                statusMutation.variables?.nextStatus === 'APPROVED' ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Check size={15} />
                                )}
                              </button>
                            ) : null}

                            {event.status !== 'REJECTED' ? (
                              <button
                                type="button"
                                title="Отклонить"
                                disabled={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({ id: event.id, nextStatus: 'REJECTED' })
                                }
                                className="btn btn-ghost h-8 w-8 text-amber-300 hover:bg-amber-400/10"
                              >
                                {statusMutation.isPending &&
                                statusMutation.variables?.id === event.id &&
                                statusMutation.variables?.nextStatus === 'REJECTED' ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <X size={15} />
                                )}
                              </button>
                            ) : null}

                            <Link
                              to={`/events/${event.id}`}
                              title="Открыть"
                              className="btn btn-ghost h-8 w-8"
                            >
                              <Eye size={15} />
                            </Link>
                            <button
                              type="button"
                              title="Удалить"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDelete(event)}
                              className="btn btn-ghost h-8 w-8 text-white/40 hover:text-red-300"
                            >
                              {deleteMutation.isPending && deleteMutation.variables === event.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-white/30">
                Всего {eventsQuery.data?.total ?? 0}{' '}
                {pluralize(eventsQuery.data?.total ?? 0, 'мероприятие', 'мероприятия', 'мероприятий')}
              </p>
              <Pagination
                page={page}
                totalPages={eventsQuery.data?.totalPages ?? 1}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
