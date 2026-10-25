import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, MapPin, Sparkles, Star } from 'lucide-react';
import type { Event } from '../types';
import { formatDateShort, formatPrice } from '../lib/format';

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [day, month] = formatDateShort(event.date).split(' ');
  const isSoldOut = event.seats?.available === 0;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-900/90 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-card"
    >
      <div className="on-media relative aspect-[16/10] overflow-hidden bg-ink-800">
        {event.imageUrl && !imageFailed ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(80%_80%_at_50%_0%,rgba(139,92,246,0.4),rgba(236,72,153,0.12)_55%,#11111a_100%)]">
            <Sparkles className="h-10 w-10 text-white/25" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />

        <div className="absolute left-4 top-4 flex min-w-[54px] flex-col items-center rounded-2xl border border-white/10 bg-ink-950/70 px-3 py-2 backdrop-blur-md">
          <span className="text-lg font-extrabold leading-none text-white">{day}</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
            {month}
          </span>
        </div>

        {typeof event.rating === 'number' ? (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-950/70 px-2.5 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md">
            <Star size={12} className="fill-amber-300" />
            {event.rating.toFixed(1)}
          </div>
        ) : null}

        <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 bg-ink-950/60 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md">
            {event.category}
          </span>
          <span className="rounded-full border border-white/10 bg-ink-950/60 px-2.5 py-1 text-[11px] font-medium text-white/60 backdrop-blur-md">
            {event.tag.name}
          </span>
          {isSoldOut ? (
            <span className="rounded-full border border-red-400/30 bg-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-200 backdrop-blur-md">
              Мест нет
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs text-white/45">
          <CalendarDays size={13} className="text-vibe-300" />
          {new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            weekday: 'short',
            timeZone: 'UTC',
          }).format(new Date(event.date))}{' '}
          · {event.time}
        </div>

        <h3 className="mt-2.5 line-clamp-2 font-display text-lg font-semibold leading-snug text-white transition-colors group-hover:text-vibe-200">
          {event.name}
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/45">
          <MapPin size={14} className="shrink-0 text-pulse-400" />
          <span className="line-clamp-1">
            {event.place.name} · {event.place.city}
          </span>
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-white/30">от</span>
            <span className="text-base font-bold text-white">{formatPrice(event.price)}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-white/40 transition-colors group-hover:text-white">
            Подробнее
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
};
