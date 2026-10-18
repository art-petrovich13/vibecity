import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { eventsApi, metaApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ErrorBlock, LoadingBlock } from '../components/Loading';
import { EventFormModal } from '../components/EventFormModal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import type { Event } from '../types';
import { formatDateWithYear, formatPrice, pluralize } from '../lib/format';

export const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['my-events'],
    queryFn: eventsApi.mine,
  });

  const catalogQuery = useQuery({
    queryKey: ['catalog'],
    queryFn: metaApi.catalog,
    staleTime: 5 * 60_000,
  });

  const events = eventsQuery.data ?? [];

  const stats = useMemo(() => {
    const approved = events.filter((event) => event.status === 'APPROVED').length;
    const pending = events.filter((event) => event.status === 'PENDING').length;
    const ticketsSold = events.reduce((sum, event) => sum + (event.seats?.sold ?? 0), 0);
    const revenue = events.reduce(
      (sum, event) => sum + (event.seats?.sold ?? 0) * event.price,
      0,
    );

    return { approved, pending, ticketsSold, revenue };
  }, [events]);

  const deleteMutation = useMutation({
    mutationFn: eventsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setActionError('');
      setNotice('Мероприятие удалено');
    },
    onError: (error) => {
      setNotice('');
      setActionError(getErrorMessage(error));
    },
  });

  const handleDelete = (event: Event) => {
    if (window.confirm(`Удалить мероприятие «${event.name}»? Действие необратимо.`)) {
      deleteMutation.mutate(event.id);
    }
  };

  const openCreate = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleSaved = (saved: Event) => {
    setNotice(
      saved.status === 'APPROVED'
        ? 'Мероприятие опубликовано в афише'
        : 'Мероприятие создано и отправлено на модерацию',
    );
    setActionError('');
  };

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-vibe-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-pulse-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Кабинет организатора</p>
            <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
              Создавайте события, которые собирают город
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-white/45">
              Управляйте своими мероприятиями, следите за продажами и публикуйте новые события в
              афише VibeCity.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/35">
              <span className="chip">
                <CheckCircle2 size={12} className="text-emerald-400" />
                {user?.role === 'ADMIN' ? 'Публикация без модерации' : 'Модерация в течение дня'}
              </span>
              <span className="chip">
                <Ticket size={12} className="text-vibe-300" />
                Продажи и QR-билеты
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link to="/profile" className="btn btn-secondary btn-md">
              Мои билеты
            </Link>
            <button type="button" onClick={openCreate} className="btn btn-primary btn-md">
              <Plus size={17} /> Новое мероприятие
            </button>
          </div>
        </div>
      </div>

      {notice ? (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <span className="flex items-start gap-2">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-xs text-emerald-200/60 hover:text-emerald-200"
          >
            Скрыть
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          {actionError}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Всего событий',
            value: events.length,
            icon: Sparkles,
            accent: 'text-vibe-300',
          },
          { label: 'Опубликовано', value: stats.approved, icon: CheckCircle2, accent: 'text-emerald-400' },
          { label: 'На модерации', value: stats.pending, icon: Clock, accent: 'text-amber-300' },
          {
            label: 'Продано билетов',
            value: stats.ticketsSold,
            icon: Ticket,
            accent: 'text-pulse-300',
          },
        ].map((card) => (
          <div key={card.label} className="panel-soft flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
              <card.icon size={18} className={card.accent} />
            </span>
            <div>
              <p className="font-display text-xl font-bold">{card.value}</p>
              <p className="text-[11px] text-white/35">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-white/35">
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp size={14} className="text-acid" />
          Оборот по билетам: <span className="font-semibold text-white/70">{formatPrice(stats.revenue)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BarChart3 size={14} className="text-vibe-300" />
          {stats.approved} {pluralize(stats.approved, 'событие', 'события', 'событий')} в афише
        </span>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Управление</p>
            <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Мои мероприятия</h2>
          </div>
          <span className="text-sm text-white/35">
            {events.length} {pluralize(events.length, 'событие', 'события', 'событий')}
          </span>
        </div>

        {eventsQuery.isError ? (
          <ErrorBlock
            message="Не удалось загрузить ваши мероприятия"
            onRetry={() => eventsQuery.refetch()}
          />
        ) : eventsQuery.isLoading ? (
          <LoadingBlock label="Загружаем мероприятия" />
        ) : events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={22} />}
            title="Здесь пока пусто"
            description="Создайте первое мероприятие — оно появится в афише после модерации."
            action={
              <button type="button" onClick={openCreate} className="btn btn-primary btn-md">
                <Plus size={16} /> Создать мероприятие
              </button>
            }
          />
        ) : (
          <div className="panel overflow-hidden">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-white/30">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Мероприятие</th>
                    <th className="px-4 py-3 font-semibold">Дата</th>
                    <th className="px-4 py-3 font-semibold">Площадка</th>
                    <th className="px-4 py-3 font-semibold">Продано</th>
                    <th className="px-4 py-3 font-semibold">Статус</th>
                    <th className="px-5 py-3 text-right font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {events.map((event) => (
                    <tr key={event.id} className="table-row-hover">
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
                            ) : (
                              <span className="grid h-full w-full place-items-center text-white/20">
                                <Sparkles size={16} />
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/events/${event.id}`}
                              className="block max-w-[260px] truncate font-medium text-white/90 transition hover:text-vibe-200"
                            >
                              {event.name}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-white/30">
                              {event.category} · {event.tag.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-white/55">
                        {formatDateWithYear(event.date)}
                        <span className="block text-[11px] text-white/30">{event.time}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-white/55">
                        <span className="block max-w-[170px] truncate">{event.place.name}</span>
                        <span className="block text-[11px] text-white/30">{event.place.city}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold">
                          {event.seats?.sold ?? 0}
                          <span className="text-white/30"> / {event.seats?.capacity ?? 0}</span>
                        </span>
                        <span className="mt-1 block h-1 w-20 overflow-hidden rounded-full bg-white/10">
                          <span
                            className="block h-full rounded-full bg-vibe-gradient"
                            style={{
                              width: `${
                                event.seats && event.seats.capacity
                                  ? Math.min(100, Math.round((event.seats.sold / event.seats.capacity) * 100))
                                  : 0
                              }%`,
                            }}
                          />
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/events/${event.id}`}
                            className="btn btn-ghost h-8 w-8"
                            title="Открыть страницу"
                          >
                            <Eye size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(event)}
                            className="btn btn-ghost h-8 w-8"
                            title="Редактировать"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(event)}
                            disabled={deleteMutation.isPending}
                            className="btn btn-ghost h-8 w-8 text-white/40 hover:text-red-300"
                            title="Удалить"
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

            <div className="divide-y divide-white/[0.05] md:hidden">
              {events.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-white/20">
                          <Sparkles size={18} />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/events/${event.id}`}
                          className="line-clamp-2 font-medium text-white/90"
                        >
                          {event.name}
                        </Link>
                        <StatusBadge status={event.status} />
                      </div>
                      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/35">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={11} /> {formatDateWithYear(event.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} /> {event.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} /> {event.place.name}
                        </span>
                      </p>
                      <p className="mt-1.5 text-[11px] text-white/35">
                        Продано {event.seats?.sold ?? 0} из {event.seats?.capacity ?? 0} ·{' '}
                        {formatPrice(event.price)}
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Pencil size={13} /> Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event)}
                          disabled={deleteMutation.isPending}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={13} /> Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        event={editingEvent}
        catalog={catalogQuery.data}
        onSaved={handleSaved}
      />
    </div>
  );
};
