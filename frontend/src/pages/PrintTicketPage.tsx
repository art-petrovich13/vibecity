import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MapPin,
  Printer,
  Ticket as TicketIcon,
  UserRound,
} from 'lucide-react';
import { ticketsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { ErrorBlock, LoadingBlock } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateWithYear, formatPrice, fullName } from '../lib/format';

const InfoRow = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 text-vibe-500">{icon}</span>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  </div>
);

export const PrintTicketPage = () => {
  const { id } = useParams();
  const ticketId = Number(id);

  const ticketQuery = useQuery({
    queryKey: ['ticket-print', ticketId],
    queryFn: () => ticketsApi.get(ticketId),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  });

  const ticket = ticketQuery.data;

  if (ticketQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#eef0f5] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <LoadingBlock label="Готовим билет" />
        </div>
      </div>
    );
  }

  if (ticketQuery.isError || !ticket) {
    return (
      <div className="min-h-screen bg-[#eef0f5] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <ErrorBlock
            message={getErrorMessage(ticketQuery.error)}
            onRetry={() => ticketQuery.refetch()}
          />
          <div className="mt-6 text-center">
            <Link to="/profile" className="btn btn-secondary btn-md">
              <ArrowLeft size={16} /> Мои билеты
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef0f5] px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Мои билеты
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-400">
              В диалоге печати выберите «Сохранить как PDF»
            </p>
            <button type="button" onClick={() => window.print()} className="btn btn-primary btn-md">
              <Printer size={16} /> Печать / сохранить PDF
            </button>
          </div>
        </div>

        <article className="print-ticket overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)]">
          <div className="on-media relative overflow-hidden bg-vibe-gradient px-6 py-6 text-white sm:px-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 font-display text-xl font-bold ring-1 ring-white/25">
                  V
                </span>
                <div>
                  <p className="font-display text-lg font-semibold leading-tight">VibeCity</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">
                    Электронный билет
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Билет</p>
                <p className="font-display text-xl font-bold">№ {ticket.id}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-vibe-200 bg-vibe-50 px-3 py-1 text-[11px] font-semibold text-vibe-700">
                    {ticket.event.category}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
                <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                  {ticket.event.name}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {ticket.event.organizer.name} · {ticket.event.place.city}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <InfoRow
                icon={<CalendarDays size={17} />}
                label="Дата и время"
                value={`${formatDateWithYear(ticket.event.date)} · ${ticket.event.time}`}
              />
              <InfoRow
                icon={<MapPin size={17} />}
                label="Место проведения"
                value={ticket.event.place.name}
                hint={`${ticket.event.place.city}, ${ticket.event.place.address}`}
              />
              <InfoRow
                icon={<UserRound size={17} />}
                label="Зритель"
                value={fullName(ticket.user)}
                hint={ticket.user.email}
              />
              <InfoRow
                icon={<TicketIcon size={17} />}
                label="Место и стоимость"
                value={`Место № ${ticket.seatNumber} · ${formatPrice(ticket.price)}`}
                hint={ticket.promo ? `Промокод ${ticket.promo.code} · ${ticket.promo.discount}%` : undefined}
              />
            </div>

            <div className="mt-6 flex flex-col items-center gap-5 border-t border-dashed border-slate-300 pt-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="order-2 text-center sm:order-1 sm:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  QR-код для входа
                </p>
                <p className="mt-1 max-w-xs break-all font-mono text-[10px] leading-relaxed text-slate-400">
                  {ticket.qrCode}
                </p>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 sm:justify-start">
                  <CheckCircle2 size={14} /> Покажите этот QR-код на входе
                </p>
              </div>

              <div className="order-1 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:order-2">
                <QRCodeSVG value={ticket.qrCode} size={172} level="M" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4 text-[10px] leading-relaxed text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Демонстрационный билет. Оплата не проводилась. Билет действителен на одно лицо и
                указанное место.
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Clock size={12} /> {ticket.event.time} · {ticket.event.place.city}
              </p>
            </div>
          </div>
        </article>

        <div className="no-print mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Download size={14} /> PDF сохраняется через диалог печати браузера
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail size={14} /> {ticket.user.email}
          </span>
        </div>
      </div>
    </div>
  );
};
