import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Gift as GiftIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  QrCode,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  UserRound,
} from 'lucide-react';
import { authApi, ticketsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ErrorBlock, LoadingBlock } from '../components/Loading';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import type { Ticket } from '../types';
import { formatDateWithYear, formatPrice, fullName } from '../lib/format';
import { cn } from '../lib/cn';
import { QRCodeSVG } from 'qrcode.react';

type Tab = 'tickets' | 'settings';

const TicketCard = ({ ticket, onShowQr }: { ticket: Ticket; onShowQr: (ticket: Ticket) => void }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const eventDate = new Date(ticket.event.date);
  eventDate.setUTCHours(23, 59, 59, 999);
  const isPast = eventDate.getTime() < Date.now();

  return (
    <article className="panel overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="on-media relative h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-ink-800 sm:w-36">
          {ticket.event.imageUrl && !imageFailed ? (
            <img
              src={ticket.event.imageUrl}
              alt={ticket.event.name}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(80%_80%_at_50%_0%,rgba(139,92,246,0.4),#14141e_70%)]">
              <Sparkles className="h-7 w-7 text-white/20" />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-lg bg-ink-950/70 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur">
            {formatDateWithYear(ticket.event.date)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <span className="chip">{ticket.event.category}</span>
            {isPast ? <span className="text-[11px] text-white/30">Событие прошло</span> : null}
          </div>

          <Link
            to={`/events/${ticket.event.id}`}
            className="mt-2 block truncate font-display text-base font-semibold transition hover:text-vibe-200 sm:text-lg"
          >
            {ticket.event.name}
          </Link>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} className="text-vibe-300" />
              {formatDateWithYear(ticket.event.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-vibe-300" />
              {ticket.event.time}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-pulse-400" />
              {ticket.event.place.name}
            </span>
          </div>

          {ticket.promo?.gift ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] text-emerald-300">
              <GiftIcon size={12} /> {ticket.promo.gift.name} · {ticket.promo.code}
            </p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3 sm:w-40 sm:flex-col sm:items-end sm:justify-between sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Место</p>
            <p className="font-display text-lg font-bold">№ {ticket.seatNumber}</p>
            <p className="mt-0.5 text-xs text-white/40">{formatPrice(ticket.price)}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <button
              type="button"
              onClick={() => onShowQr(ticket)}
              disabled={ticket.status !== 'ACTIVE'}
              className="btn btn-secondary btn-sm w-fit"
            >
              <QrCode size={14} /> QR-код
            </button>
            <Link
              to={`/tickets/${ticket.id}/print`}
              className="btn btn-secondary btn-sm w-fit"
            >
              <Printer size={14} /> PDF
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export const ProfilePage = () => {
  const { user, token, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('tickets');
  const [qrTicket, setQrTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);

  const [profileForm, setProfileForm] = useState({
    lastName: user?.lastName ?? '',
    firstName: user?.firstName ?? '',
    patronymic: user?.patronymic ?? '',
    phone: user?.phone ?? '',
  });
  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordNotice, setPasswordNotice] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const ticketsQuery = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsApi.my(),
    enabled: Boolean(token),
  });

  const tickets = ticketsQuery.data ?? [];

  const stats = useMemo(() => {
    const active = tickets.filter((ticket) => ticket.status === 'ACTIVE');
    return {
      total: tickets.length,
      active: active.length,
      spent: active.reduce((sum, ticket) => sum + ticket.price, 0),
    };
  }, [tickets]);

  const profileMutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        lastName: profileForm.lastName.trim(),
        firstName: profileForm.firstName.trim(),
        patronymic: profileForm.patronymic.trim() || null,
        phone: profileForm.phone.trim(),
      }),
    onSuccess: (updated) => {
      setUser(updated);
      setProfileError('');
      setProfileNotice('Данные профиля обновлены');
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
    onError: (error) => {
      setProfileNotice('');
      setProfileError(getErrorMessage(error));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      }),
    onSuccess: () => {
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordError('');
      setPasswordNotice('Пароль изменён');
    },
    onError: (error) => {
      setPasswordNotice('');
      setPasswordError(getErrorMessage(error));
    },
  });

  const handleProfileSubmit = (event: FormEvent) => {
    event.preventDefault();
    setProfileNotice('');
    setProfileError('');

    if (profileForm.lastName.trim().length < 2 || profileForm.firstName.trim().length < 2) {
      setProfileError('Фамилия и имя должны содержать минимум 2 символа');
      return;
    }

    if (!/^\+?[0-9\s\-()]{10,20}$/.test(profileForm.phone.trim())) {
      setProfileError('Некорректный формат телефона');
      return;
    }

    profileMutation.mutate();
  };

  const handlePasswordSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPasswordNotice('');
    setPasswordError('');

    if (!passwordForm.current) {
      setPasswordError('Укажите текущий пароль');
      return;
    }

    if (passwordForm.next.length < 6) {
      setPasswordError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    passwordMutation.mutate();
  };

  const copyQr = async () => {
    if (!qrTicket) return;
    try {
      await navigator.clipboard.writeText(qrTicket.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-vibe-500/15 blur-[90px]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-vibe-gradient font-display text-xl font-bold text-white shadow-glow">
              {initials}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold">{fullName(user)}</h1>
                <StatusBadge status={user.role} />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/40">
                <Mail size={14} /> {user.email}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/40">
                <Phone size={14} /> {user.phone}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="panel-soft px-4 py-3 text-center">
              <p className="font-display text-xl font-bold">{stats.active}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">Активных</p>
            </div>
            <div className="panel-soft px-4 py-3 text-center">
              <p className="font-display text-xl font-bold">{stats.total}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">Всего</p>
            </div>
            <div className="panel-soft px-4 py-3 text-center">
              <p className="font-display text-xl font-bold text-acid">{formatPrice(stats.spent)}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">Потрачено</p>
            </div>
          </div>
        </div>

        {user.role === 'ADMIN' ? (
          <Link
            to="/admin"
            className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-vibe-400/25 bg-vibe-500/10 px-4 py-2.5 text-sm font-medium text-vibe-200 transition hover:bg-vibe-500/15"
          >
            <ShieldCheck size={16} /> Перейти в админ-панель
            <ArrowRight size={15} />
          </Link>
        ) : (
          <Link
            to="/organizer"
            className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Sparkles size={16} className="text-vibe-300" /> Кабинет организатора
            <ArrowRight size={15} />
          </Link>
        )}
      </div>

      <div className="mt-7 flex gap-1 rounded-full border border-white/10 bg-white/[0.025] p-1">
        <button
          type="button"
          onClick={() => setTab('tickets')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
            tab === 'tickets' ? 'bg-vibe-gradient text-white shadow-glow' : 'text-white/50 hover:text-white',
          )}
        >
          <TicketIcon size={16} /> Мои билеты
        </button>
        <button
          type="button"
          onClick={() => setTab('settings')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
            tab === 'settings' ? 'bg-vibe-gradient text-white shadow-glow' : 'text-white/50 hover:text-white',
          )}
        >
          <Settings size={16} /> Настройки профиля
        </button>
      </div>

      <div className="mt-6">
        {tab === 'tickets' ? (
          ticketsQuery.isError ? (
            <ErrorBlock
              message="Не удалось загрузить билеты"
              onRetry={() => ticketsQuery.refetch()}
            />
          ) : ticketsQuery.isLoading ? (
            <LoadingBlock label="Загружаем билеты" />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<TicketIcon size={22} />}
              title="Билетов пока нет"
              description="Выберите событие в афише — билет с QR-кодом появится здесь сразу после покупки."
              action={
                <Link to="/" className="btn btn-primary btn-md">
                  Перейти в афишу <ArrowRight size={16} />
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onShowQr={setQrTicket} />
              ))}
            </div>
          )
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="panel p-6">
              <div className="flex items-center gap-2">
                <UserRound size={18} className="text-vibe-300" />
                <h2 className="font-display text-lg font-semibold">Личные данные</h2>
              </div>
              <p className="mt-1 text-xs text-white/35">
                Email изменить нельзя — это логин для входа.
              </p>

              <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="profile-last-name">
                      Фамилия
                    </label>
                    <input
                      id="profile-last-name"
                      className="field"
                      value={profileForm.lastName}
                      onChange={(event) =>
                        setProfileForm((previous) => ({ ...previous, lastName: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="profile-first-name">
                      Имя
                    </label>
                    <input
                      id="profile-first-name"
                      className="field"
                      value={profileForm.firstName}
                      onChange={(event) =>
                        setProfileForm((previous) => ({ ...previous, firstName: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="profile-patronymic">
                    Отчество
                  </label>
                  <input
                    id="profile-patronymic"
                    className="field"
                    value={profileForm.patronymic}
                    onChange={(event) =>
                      setProfileForm((previous) => ({ ...previous, patronymic: event.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="profile-phone">
                    Телефон
                  </label>
                  <input
                    id="profile-phone"
                    className="field"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((previous) => ({ ...previous, phone: event.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="profile-email">
                    Email
                  </label>
                  <input id="profile-email" className="field opacity-60" value={user.email} disabled />
                </div>

                {profileError ? (
                  <p className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> {profileError}
                  </p>
                ) : null}

                {profileNotice ? (
                  <p className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> {profileNotice}
                  </p>
                ) : null}

                <button type="submit" disabled={profileMutation.isPending} className="btn btn-primary btn-md">
                  {profileMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Сохраняем…
                    </>
                  ) : (
                    'Сохранить изменения'
                  )}
                </button>
              </form>
            </section>

            <section className="panel p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-vibe-300" />
                <h2 className="font-display text-lg font-semibold">Безопасность</h2>
              </div>
              <p className="mt-1 text-xs text-white/35">
                Пароль хранится в зашифрованном виде (bcrypt).
              </p>

              <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="field-label" htmlFor="password-current">
                    Текущий пароль
                  </label>
                  <input
                    id="password-current"
                    type="password"
                    autoComplete="current-password"
                    className="field"
                    value={passwordForm.current}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({ ...previous, current: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="password-next">
                    Новый пароль
                  </label>
                  <input
                    id="password-next"
                    type="password"
                    autoComplete="new-password"
                    className="field"
                    value={passwordForm.next}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({ ...previous, next: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="password-confirm">
                    Повторите новый пароль
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    className="field"
                    value={passwordForm.confirm}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({ ...previous, confirm: event.target.value }))
                    }
                  />
                </div>

                {passwordError ? (
                  <p className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> {passwordError}
                  </p>
                ) : null}

                {passwordNotice ? (
                  <p className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> {passwordNotice}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="btn btn-secondary btn-md"
                >
                  {passwordMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Обновляем…
                    </>
                  ) : (
                    'Изменить пароль'
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-relaxed text-white/35">
                Аккаунт создан{' '}
                {new Intl.DateTimeFormat('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(user.createdAt))}
                . При проблемах с доступом обратитесь к администратору.
              </div>
            </section>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(qrTicket)}
        onClose={() => {
          setQrTicket(null);
          setCopied(false);
        }}
        title="Ваш билет"
        description={qrTicket?.event.name}
        size="sm"
      >
        {qrTicket ? (
          <div className="text-center">
            <div className="mx-auto w-fit rounded-3xl bg-white p-4">
              <QRCodeSVG value={qrTicket.qrCode} size={200} level="M" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-left">
              <div className="panel-soft px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Место</p>
                <p className="mt-0.5 font-semibold">№ {qrTicket.seatNumber}</p>
              </div>
              <div className="panel-soft px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Стоимость</p>
                <p className="mt-0.5 font-semibold">{formatPrice(qrTicket.price)}</p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-ink-950/50 px-4 py-3 text-left">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Код билета</p>
              <p className="mt-1 break-all font-mono text-[11px] text-white/55">{qrTicket.qrCode}</p>
              <button type="button" onClick={copyQr} className="btn btn-ghost btn-sm mt-2 px-0">
                {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                {copied ? 'Скопировано' : 'Скопировать код'}
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-white/35">
              Покажите QR-код на входе. Скриншот также подойдёт. Билет действует на одно лицо и
              указанное место.
            </p>

            <Link
              to={`/tickets/${qrTicket.id}/print`}
              onClick={() => setQrTicket(null)}
              className="btn btn-primary btn-md mt-4 w-full"
            >
              <Printer size={16} /> Печать / сохранить PDF
            </Link>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
