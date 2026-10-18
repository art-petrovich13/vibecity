import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { ErrorBlock, LoadingBlock } from '../Loading';
import { StatusBadge } from '../StatusBadge';
import { formatDate, formatPrice, pluralize } from '../../lib/format';
import type { AdminTab } from './types';

interface AdminOverviewProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminOverview = ({ onNavigate }: AdminOverviewProps) => {
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  if (statsQuery.isError) {
    return <ErrorBlock message="Не удалось загрузить статистику" onRetry={() => statsQuery.refetch()} />;
  }

  if (statsQuery.isLoading || !statsQuery.data) {
    return <LoadingBlock label="Собираем статистику" />;
  }

  const stats = statsQuery.data;

  const cards = [
    {
      label: 'Пользователи',
      value: stats.users,
      icon: Users,
      accent: 'text-vibe-300',
      hint: 'зарегистрировано',
      tab: 'users' as AdminTab,
    },
    {
      label: 'Мероприятия',
      value: stats.events,
      icon: CalendarDays,
      accent: 'text-pulse-300',
      hint: 'в системе',
      tab: 'events' as AdminTab,
    },
    {
      label: 'Билеты',
      value: stats.tickets,
      icon: Ticket,
      accent: 'text-emerald-400',
      hint: 'активных',
      tab: 'events' as AdminTab,
    },
    {
      label: 'Отзывы',
      value: stats.reviews,
      icon: MessageSquare,
      accent: 'text-amber-300',
      hint: 'опубликовано',
      tab: 'reviews' as AdminTab,
    },
  ];

  return (
    <div>
      {stats.pendingEvents > 0 ? (
        <button
          type="button"
          onClick={() => onNavigate('events')}
          className="mb-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] px-5 py-4 text-left transition hover:bg-amber-400/[0.12]"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
              <ShieldCheck size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-amber-100">
                {stats.pendingEvents}{' '}
                {pluralize(stats.pendingEvents, 'мероприятие ждёт', 'мероприятия ждут', 'мероприятий ждут')}{' '}
                модерации
              </span>
              <span className="mt-0.5 block text-xs text-amber-200/50">
                Проверьте карточки и опубликуйте их в афише
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-amber-300" />
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate(card.tab)}
            className="panel-soft group p-4 text-left transition hover:border-white/15 hover:bg-white/[0.045]"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05]">
                <card.icon size={18} className={card.accent} />
              </span>
              <ChevronRight
                size={15}
                className="text-white/15 transition group-hover:translate-x-0.5 group-hover:text-white/40"
              />
            </div>
            <p className="mt-4 font-display text-2xl font-bold">{card.value}</p>
            <p className="mt-0.5 text-xs font-medium text-white/60">{card.label}</p>
            <p className="text-[11px] text-white/25">{card.hint}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Последние</p>
              <h2 className="mt-1 font-display text-lg font-semibold">Новые мероприятия</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="btn btn-ghost btn-sm"
            >
              Все <ChevronRight size={14} />
            </button>
          </div>

          <div className="mt-4 divide-y divide-white/[0.05]">
            {stats.recentEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/35">Мероприятий пока нет</p>
            ) : (
              stats.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 py-3">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/events/${event.id}`}
                      className="block truncate text-sm font-medium text-white/85 transition hover:text-vibe-200"
                    >
                      {event.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-white/30">
                      {event.place.name} · {formatDate(event.date)} · {event.price === 0 ? 'бесплатно' : formatPrice(event.price)}
                    </p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-vibe-500/20 blur-[70px]" />
          <p className="eyebrow relative">Выручка</p>
          <h2 className="relative mt-1 font-display text-lg font-semibold">Продажи билетов</h2>

          <p className="relative mt-6 font-display text-4xl font-bold text-acid">
            {formatPrice(stats.revenue)}
          </p>
          <p className="relative mt-1 text-xs text-white/35">
            по {stats.tickets} {pluralize(stats.tickets, 'активному билету', 'активным билетам', 'активным билетам')}
          </p>

          <div className="relative mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white/45">
            <TrendingUp size={14} className="text-acid" />
            Демо-оплата: реальные средства не списываются
          </div>

          <button
            type="button"
            onClick={() => onNavigate('events')}
            className="btn btn-secondary btn-sm relative mt-4"
          >
            Управлять событиями <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
