import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Gift,
  Loader2,
  MapPin,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Ticket as TicketIcon,
  UserRound,
} from 'lucide-react';
import { ticketsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ErrorBlock, LoadingBlock } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import type { ScannerTicket } from '../types';
import { formatDateWithYear, formatPrice, fullName } from '../lib/format';
import { cn } from '../lib/cn';

type StatusFilter = 'ALL' | 'ACTIVE' | 'USED';

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'USED', label: 'Использованные' },
];

const TicketQrCard = ({
  ticket,
  selected,
  onSelect,
}: {
  ticket: ScannerTicket;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition',
      selected
        ? 'border-vibe-400/60 bg-vibe-500/10 shadow-glow'
        : 'border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]',
    )}
  >
    <span className="shrink-0 rounded-xl bg-white p-1.5 shadow-sm">
      <QRCodeSVG value={ticket.qrCode} size={64} level="M" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-semibold text-white/90">{ticket.event.name}</span>
        <StatusBadge status={ticket.status} />
      </span>
      <span className="mt-1.5 block truncate text-[11px] text-white/40">
        {fullName(ticket.user)} · место № {ticket.seatNumber}
      </span>
      <span className="mt-1 block text-[11px] text-white/30">
        {formatDateWithYear(ticket.event.date)} · {ticket.event.place.name}
      </span>
    </span>
  </button>
);

export const ScannerPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';
  const [selected, setSelected] = useState<ScannerTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const ticketsQuery = useQuery({
    queryKey: ['scanner-tickets'],
    queryFn: ticketsApi.scanner,
  });

  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);

  useEffect(() => {
    if (!selected && tickets.length > 0) {
      setSelected(tickets[0]);
    }
  }, [selected, tickets]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      active: tickets.filter((ticket) => ticket.status === 'ACTIVE').length,
      used: tickets.filter((ticket) => ticket.status === 'USED').length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
      if (!term) return true;

      return [
        ticket.event.name,
        ticket.event.place.name,
        ticket.event.place.city,
        fullName(ticket.user),
        ticket.user.email,
        ticket.qrCode,
        String(ticket.seatNumber),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [tickets, statusFilter, search]);

  const scanMutation = useMutation({
    mutationFn: (value: string) => ticketsApi.scan(value),
    onSuccess: (ticket) => {
      setSelected(ticket);
      setCode('');
      setError('');
      setNotice(`Билет найден: ${ticket.event.name}`);
    },
    onError: (mutationError) => {
      setNotice('');
      setError(getErrorMessage(mutationError));
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (id: number) => ticketsApi.checkIn(id),
    onSuccess: (ticket) => {
      setSelected(ticket);
      setError('');
      setNotice('Билет отмечен как использованный');
      queryClient.invalidateQueries({ queryKey: ['scanner-tickets'] });
    },
    onError: (mutationError) => {
      setNotice('');
      setError(getErrorMessage(mutationError));
    },
  });

  const handleScan = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const value = code.trim();
    if (!value) {
      setError('Введите QR-код билета');
      return;
    }

    scanMutation.mutate(value);
  };

  const handleCheckIn = () => {
    if (!selected) return;
    if (window.confirm(`Отметить билет № ${selected.id} как использованный?`)) {
      checkInMutation.mutate(selected.id);
    }
  };

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-vibe-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-pulse-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Контроль доступа</p>
            <h1 className="mt-2 flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-vibe-gradient shadow-glow">
                <ScanLine size={22} className="text-white" />
              </span>
              Сканер билетов
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              {isAdmin
                ? 'Вы видите QR-коды всех билетов. Выберите билет из списка или вставьте код, чтобы проверить его.'
                : 'Здесь собраны QR-коды билетов на мероприятия, которые вы создали. Выберите билет или вставьте код.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="chip">
                <ShieldCheck size={13} className="text-emerald-400" />
                {isAdmin ? 'Администратор · все мероприятия' : 'Организатор · свои мероприятия'}
              </span>
              <span className="chip">
                <ScanLine size={13} className="text-vibe-300" />
                Демо-режим без камеры
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="panel-soft px-4 py-3 text-center">
              <p className="font-display text-xl font-bold">{stats.total}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">Всего</p>
            </div>
            <div className="panel-soft px-4 py-3 text-center">
              <p className="font-display text-xl font-bold text-emerald-400">{stats.active}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">Активных</p>
            </div>
            <div className="panel-soft px-4 py-3 text-center">
              <p className="font-display text-xl font-bold text-amber-300">{stats.used}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">Использовано</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleScan} className="panel mt-5 flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <QrCode
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            className="field pl-11"
            placeholder="Вставьте QR-код билета и нажмите «Проверить»"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
        <button type="submit" disabled={scanMutation.isPending} className="btn btn-primary btn-md shrink-0">
          {scanMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Ищем…
            </>
          ) : (
            <>
              <ScanLine size={16} /> Проверить
            </>
          )}
        </button>
      </form>

      {error ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          {notice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Билеты</p>
              <h2 className="mt-1 font-display text-xl font-bold">QR-коды</h2>
            </div>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                className="field h-10 w-full py-0 pl-9 pr-3 text-xs sm:w-60"
                placeholder="Поиск по событию, гостю, коду"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                  statusFilter === tab.value
                    ? 'border-vibe-400/50 bg-vibe-500/20 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {ticketsQuery.isError ? (
              <ErrorBlock message="Не удалось загрузить билеты" onRetry={() => ticketsQuery.refetch()} />
            ) : ticketsQuery.isLoading ? (
              <LoadingBlock label="Загружаем билеты" />
            ) : tickets.length === 0 ? (
              <EmptyState
                icon={<TicketIcon size={22} />}
                title="Проданных билетов пока нет"
                description={
                  isAdmin
                    ? 'Билеты появятся здесь, как только зрители начнут покупать их.'
                    : 'Создайте мероприятие и дождитесь модерации — билеты на него появятся в сканере.'
                }
                action={
                  <Link to="/organizer" className="btn btn-primary btn-md">
                    <CalendarDays size={16} /> Мои мероприятия
                  </Link>
                }
              />
            ) : filteredTickets.length === 0 ? (
              <EmptyState
                icon={<Search size={22} />}
                title="Билеты не найдены"
                description="Измените фильтр или поисковый запрос."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredTickets.map((ticket) => (
                  <TicketQrCard
                    key={ticket.id}
                    ticket={ticket}
                    selected={selected?.id === ticket.id}
                    onSelect={() => {
                      setSelected(ticket);
                      setNotice('');
                      setError('');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
                <div>
                  <p className="eyebrow">Информация о билете</p>
                  <p className="mt-1 font-display text-base font-semibold">№ {selected.id}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="p-5">
                <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
                  <QRCodeSVG value={selected.qrCode} size={180} level="M" />
                </div>

                <div className="mt-4 text-center">
                  <p className="font-display text-lg font-semibold leading-snug">{selected.event.name}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {formatDateWithYear(selected.event.date)} · {selected.event.time}
                  </p>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-white/5 pt-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-pulse-400" />
                    <span className="text-white/60">
                      {selected.event.place.name}
                      <span className="block text-xs text-white/35">
                        {selected.event.place.city}, {selected.event.place.address}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserRound size={15} className="mt-0.5 shrink-0 text-vibe-300" />
                    <span className="text-white/60">
                      {fullName(selected.user)}
                      <span className="block text-xs text-white/35">{selected.user.email}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TicketIcon size={15} className="shrink-0 text-vibe-300" />
                    <span className="text-white/60">
                      Место № {selected.seatNumber} · {formatPrice(selected.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={15} className="shrink-0 text-vibe-300" />
                    <span className="text-white/60">
                      Билет создан {formatDateWithYear(selected.createdAt)}
                    </span>
                  </div>
                  {selected.promo?.gift ? (
                    <div className="flex items-center gap-3">
                      <Gift size={15} className="shrink-0 text-emerald-400" />
                      <span className="text-white/60">
                        {selected.promo.gift.name} · {selected.promo.code}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 break-all rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[10px] text-white/30">
                  QR: {selected.qrCode}
                </div>

                {selected.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={checkInMutation.isPending}
                    className="btn btn-primary btn-md mt-4 w-full"
                  >
                    {checkInMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Отмечаем…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Отметить использованным
                      </>
                    )}
                  </button>
                ) : selected.status === 'USED' ? (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5 text-xs font-medium text-emerald-300">
                    <CheckCircle2 size={15} /> Билет уже использован
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-center text-xs font-medium text-red-200">
                    Билет отменён
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<QrCode size={22} />}
              title="Выберите билет"
              description="Нажмите на QR-код слева или вставьте код билета, чтобы увидеть информацию."
            />
          )}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-white/35">
            <p className="flex items-center gap-2 font-semibold text-white/60">
              <ScanLine size={14} className="text-vibe-300" /> Как это работает
            </p>
            <p className="mt-1.5">
              Реальный сканер камеры не используется. Организатор выбирает QR-код из списка или
              вставляет его вручную. После проверки билет можно отметить использованным.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
