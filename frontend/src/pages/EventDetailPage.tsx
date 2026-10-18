import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  UserRound,
  Users,
} from 'lucide-react';
import { eventsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { BuyTicketModal } from '../components/BuyTicketModal';
import { ErrorBlock } from '../components/Loading';
import { RatingStars } from '../components/RatingStars';
import { ReviewSection } from '../components/ReviewSection';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { formatDateWithYear, formatPrice, formatWeekday } from '../lib/format';

export const EventDetailPage = () => {
  const { id } = useParams();
  const eventId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
  const [buyOpen, setBuyOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId),
    enabled: Number.isInteger(eventId) && eventId > 0,
  });

  const event = eventQuery.data;

  const handleBuy = () => {
    if (!token) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setBuyOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (eventQuery.isLoading) {
    return (
      <div className="page-container py-10">
        <div className="skeleton h-4 w-28" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <div className="skeleton h-8 w-32" />
            <div className="skeleton mt-4 h-14 w-full max-w-2xl" />
            <div className="skeleton mt-6 h-5 w-80" />
            <div className="skeleton mt-8 aspect-[16/9] w-full rounded-3xl" />
            <div className="skeleton mt-8 h-40 w-full rounded-3xl" />
          </div>
          <div className="skeleton h-[430px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (eventQuery.isError || !event) {
    return (
      <div className="page-container py-20">
        <ErrorBlock
          message={getErrorMessage(eventQuery.error)}
          onRetry={() => eventQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <Link to="/" className="btn btn-secondary btn-md">
            <ArrowLeft size={16} /> Вернуться в афишу
          </Link>
        </div>
      </div>
    );
  }

  const seats = event.seats;
  const soldPercent = seats && seats.capacity > 0 ? Math.min(100, Math.round((seats.sold / seats.capacity) * 100)) : 0;
  const isSoldOut = seats?.available === 0;

  return (
    <div>
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        {event.imageUrl && !imageFailed ? (
          <div className="pointer-events-none absolute inset-0">
            <img
              src={event.imageUrl}
              alt=""
              className="h-full w-full scale-110 object-cover opacity-[0.18] blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-950/50 via-ink-950/80 to-ink-950" />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-vibe-glow" />
        )}

        <div className="page-container relative pb-10 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft size={15} /> Все события
          </Link>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip border-vibe-400/30 bg-vibe-500/15 text-vibe-200">
                  {event.category}
                </span>
                <span className="chip">#{event.tag.name}</span>
                {event.status !== 'APPROVED' ? <StatusBadge status={event.status} /> : null}
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.9rem]">
                {event.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={16} className="text-vibe-300" />
                  {formatDateWithYear(event.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={16} className="text-vibe-300" />
                  {event.time}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={16} className="text-pulse-400" />
                  {event.place.name}, {event.place.city}
                </span>
                <a href="#reviews" className="inline-flex items-center gap-1.5">
                  <RatingStars rating={event.rating} count={event.reviewsCount} showCount />
                </a>
              </div>

              <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-3xl border border-white/10 bg-ink-800">
                {event.imageUrl && !imageFailed ? (
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(80%_80%_at_50%_0%,rgba(139,92,246,0.4),rgba(236,72,153,0.12)_55%,#11111a_100%)]">
                    <Sparkles className="h-12 w-12 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent" />
              </div>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="panel overflow-hidden p-6">
                <p className="eyebrow">Билеты</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <span className="font-display text-3xl font-bold">{formatPrice(event.price)}</span>
                  {event.rating ? (
                    <RatingStars rating={event.rating} count={event.reviewsCount} showCount />
                  ) : null}
                </div>

                {seats ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/45">Свободно мест</span>
                      <span className={isSoldOut ? 'font-semibold text-red-300' : 'font-semibold text-acid'}>
                        {seats.available} / {seats.capacity}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-vibe-gradient"
                        style={{ width: `${Math.max(4, soldPercent)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-white/30">
                      Продано {seats.sold} из {seats.capacity} мест
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 space-y-2.5 border-t border-white/5 pt-5 text-sm">
                  <div className="flex items-center gap-3 text-white/60">
                    <CalendarDays size={15} className="shrink-0 text-vibe-300" />
                    {formatDateWithYear(event.date)}, {formatWeekday(event.date)}
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <Clock size={15} className="shrink-0 text-vibe-300" />
                    Начало в {event.time}
                  </div>
                  <div className="flex items-start gap-3 text-white/60">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-pulse-400" />
                    <span>
                      {event.place.name}
                      <span className="block text-xs text-white/35">{event.place.address}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={isSoldOut}
                  className="btn btn-primary btn-lg mt-6 w-full"
                >
                  <TicketIcon size={18} />
                  {isSoldOut ? 'Мест нет' : 'Купить билет'}
                </button>

                <div className="mt-4 space-y-2 text-[11px] text-white/35">
                  <p className="flex items-center gap-2">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    Уникальный QR-код в личном кабинете
                  </p>
                  <p className="flex items-center gap-2">
                    <TicketIcon size={13} className="text-vibe-300" />
                    Выбор конкретного места
                  </p>
                  <p className="flex items-center gap-2">
                    <Check size={13} className="text-vibe-300" />
                    Демо-оплата: деньги не списываются
                  </p>
                </div>
              </div>

              <div className="panel mt-5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                  Организатор
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                  <UserRound size={15} className="text-vibe-300" />
                  {event.organizer.name}
                </p>
                <p className="mt-1.5 text-xs text-white/40">
                  Контактное лицо: {event.organizer.contactPerson}
                </p>
                <a
                  href={`tel:${event.organizer.phone.replace(/\s/g, '')}`}
                  className="mt-1 inline-block text-xs text-vibe-300 hover:text-vibe-200"
                >
                  {event.organizer.phone}
                </a>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="btn btn-secondary btn-md mt-5 w-full"
              >
                {copied ? <Check size={15} className="text-emerald-300" /> : <Share2 size={15} />}
                {copied ? 'Ссылка скопирована' : 'Поделиться событием'}
              </button>
            </aside>
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <section>
              <p className="eyebrow">О событии</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Описание</h2>
              <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-white/60">
                {event.description}
              </p>
            </section>

            <section className="mt-9">
              <p className="eyebrow">Детали</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Место и формат</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="panel-soft flex items-start gap-3 p-4">
                  <CalendarDays size={18} className="mt-0.5 text-vibe-300" />
                  <div>
                    <p className="text-xs text-white/35">Дата</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {formatDateWithYear(event.date)}
                    </p>
                    <p className="text-xs text-white/35">Начало в {event.time}</p>
                  </div>
                </div>

                <div className="panel-soft flex items-start gap-3 p-4">
                  <Building2 size={18} className="mt-0.5 text-pulse-400" />
                  <div>
                    <p className="text-xs text-white/35">Площадка</p>
                    <p className="mt-0.5 text-sm font-semibold">{event.place.name}</p>
                    <p className="text-xs text-white/35">
                      {event.place.city}, {event.place.address}
                    </p>
                  </div>
                </div>

                <div className="panel-soft flex items-start gap-3 p-4">
                  <Users size={18} className="mt-0.5 text-vibe-300" />
                  <div>
                    <p className="text-xs text-white/35">Вместимость</p>
                    <p className="mt-0.5 text-sm font-semibold">{event.place.capacity} мест</p>
                    <p className="text-xs text-white/35">Покупка с выбором места</p>
                  </div>
                </div>

                <div className="panel-soft flex items-start gap-3 p-4">
                  <UserRound size={18} className="mt-0.5 text-pulse-400" />
                  <div>
                    <p className="text-xs text-white/35">Организатор</p>
                    <p className="mt-0.5 text-sm font-semibold">{event.organizer.name}</p>
                    <p className="text-xs text-white/35">{event.organizer.contactPerson}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-white/40">
                <Sparkles size={14} className="text-vibe-300" />
                Категория: <span className="text-white/70">{event.category}</span>
                <span className="text-white/15">·</span>
                Тег: <span className="text-white/70">#{event.tag.name}</span>
                <span className="text-white/15">·</span>
                Организатор: <span className="text-white/70">{event.organizer.name}</span>
              </div>
            </section>

            <ReviewSection
              eventId={event.id}
              reviews={event.reviews ?? []}
              rating={event.rating}
              reviewsCount={event.reviewsCount}
            />
          </div>

          <aside className="space-y-5 lg:mt-[68px]">
            <div className="panel p-5">
              <p className="eyebrow">Как это работает</p>
              <ol className="mt-4 space-y-4">
                {[
                  ['Выберите место', 'Укажите номер места и промокод, если он есть.'],
                  ['Получите QR-код', 'Билет сразу появится в разделе «Мои билеты».'],
                  ['Покажите на входе', 'QR-код считают на входе — и вы внутри.'],
                ].map(([title, description], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-vibe-500/15 text-xs font-bold text-vibe-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/40">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-vibe-600/20 to-pulse-500/10 p-5">
              <p className="font-display text-base font-semibold">Есть промокод?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                Введите его при покупке билета — скидка применится автоматически. Попробуйте{' '}
                <span className="font-mono font-semibold text-acid">VIBE10</span>.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <BuyTicketModal event={event} open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
};
