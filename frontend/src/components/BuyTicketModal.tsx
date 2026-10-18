import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, CreditCard, Loader2, QrCode, Ticket as TicketIcon } from 'lucide-react';
import { eventsApi, promocodesApi, ticketsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Modal } from './Modal';
import { useAuthStore } from '../stores/authStore';
import type { Event, Ticket } from '../types';
import { formatDate, formatPrice } from '../lib/format';
import { cn } from '../lib/cn';

interface BuyTicketModalProps {
  event: Event;
  open: boolean;
  onClose: () => void;
}

export const BuyTicketModal = ({ event, open, onClose }: BuyTicketModalProps) => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [seatInput, setSeatInput] = useState('');
  const [promo, setPromo] = useState('');
  const [promoDebounced, setPromoDebounced] = useState('');
  const [validationError, setValidationError] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const seatsQuery = useQuery({
    queryKey: ['event-seats', event.id],
    queryFn: () => eventsApi.seats(event.id),
    enabled: open,
  });

  useEffect(() => {
    const timer = setTimeout(() => setPromoDebounced(promo.trim()), 500);
    return () => clearTimeout(timer);
  }, [promo]);

  const promoQuery = useQuery({
    queryKey: ['promo-preview', promoDebounced],
    queryFn: () => promocodesApi.validate(promoDebounced),
    enabled: open && promoDebounced.length > 1 && !ticket,
    retry: false,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: ticketsApi.buy,
    onSuccess: (created) => {
      setTicket(created);
      queryClient.invalidateQueries({ queryKey: ['event-seats', event.id] });
      queryClient.invalidateQueries({ queryKey: ['event', event.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
    },
  });

  useEffect(() => {
    if (open) {
      setTicket(null);
      setSeatInput('');
      setPromo('');
      setPromoDebounced('');
      setValidationError('');
      queryClient.removeQueries({ queryKey: ['promo-preview'] });
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const capacity = seatsQuery.data?.seats.capacity ?? event.seats?.capacity ?? 0;
  const available = seatsQuery.data?.seats.available ?? event.seats?.available ?? 0;
  const takenSeats = seatsQuery.data?.takenSeats ?? [];
  const selectedSeat = Number(seatInput);
  const showSeatGrid = capacity > 0 && capacity <= 150;
  const promoPreview = promoQuery.data;
  const finalPrice = promoPreview
    ? Math.max(0, Math.round(event.price * (1 - promoPreview.discount / 100)))
    : event.price;

  const handleSubmit = () => {
    setValidationError('');

    if (!token) {
      setValidationError('Войдите в аккаунт, чтобы купить билет');
      return;
    }

    if (!Number.isInteger(selectedSeat) || selectedSeat < 1 || selectedSeat > capacity) {
      setValidationError(`Выберите место от 1 до ${capacity}`);
      return;
    }

    if (takenSeats.includes(selectedSeat)) {
      setValidationError('Это место уже занято, выберите другое');
      return;
    }

    mutation.mutate({
      eventId: event.id,
      seatNumber: selectedSeat,
      promoCode: promo.trim() || undefined,
    });
  };

  const errorMessage = validationError || (mutation.isError ? getErrorMessage(mutation.error) : '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ticket ? 'Билет куплен!' : 'Покупка билета'}
      description={ticket ? 'Покажите QR-код на входе' : event.name}
      size="lg"
      footer={
        ticket ? undefined : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">К оплате</p>
              <div className="flex items-baseline gap-2">
                {promoPreview ? (
                  <span className="text-sm text-white/30 line-through">{formatPrice(event.price)}</span>
                ) : null}
                <p className="font-display text-xl font-bold">{formatPrice(finalPrice)}</p>
              </div>
              {promoPreview ? (
                <p className="text-[11px] text-emerald-300">
                  Промокод {promoPreview.code} · −{promoPreview.discount}%
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || available === 0}
              className="btn btn-primary btn-lg"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Оформляем…
                </>
              ) : (
                <>
                  <CreditCard size={18} /> Купить билет
                </>
              )}
            </button>
          </div>
        )
      }
    >
      {ticket ? (
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">{ticket.event.name}</h3>
          <p className="mt-1 text-sm text-white/50">
            {formatDate(ticket.event.date)} · {ticket.event.time} · {ticket.event.place.name}
          </p>

          <div className="mx-auto mt-6 w-fit rounded-3xl bg-white p-4">
            <QRCodeSVG value={ticket.qrCode} size={168} level="M" />
          </div>

          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 text-left">
            <div className="panel-soft px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Место</p>
              <p className="mt-0.5 font-semibold">№ {ticket.seatNumber}</p>
            </div>
            <div className="panel-soft px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Стоимость</p>
              <p className="mt-0.5 font-semibold">{formatPrice(ticket.price)}</p>
            </div>
          </div>

          {ticket.promo ? (
            <p className="mt-3 text-xs text-emerald-300">
              Применён промокод {ticket.promo.code} · скидка {ticket.promo.discount}%
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/profile" onClick={onClose} className="btn btn-primary btn-md">
              <QrCode size={16} /> Мои билеты
            </Link>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Закрыть
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {!token ? (
            <div className="rounded-2xl border border-vibe-400/25 bg-vibe-500/10 px-4 py-3 text-sm text-vibe-100">
              Чтобы купить билет, нужно войти в аккаунт.{' '}
              <Link to="/login" className="font-semibold underline underline-offset-2">
                Войти
              </Link>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Свободных мест</p>
              <p className="text-xs text-white/40">
                Всего {capacity}, занято {takenSeats.length}
              </p>
            </div>
            <span className="font-display text-2xl font-bold text-acid">{available}</span>
          </div>

          <div>
            <label className="field-label" htmlFor="seat-number">
              Номер места
            </label>

            {showSeatGrid ? (
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-ink-950/50 p-3">
                <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
                  {Array.from({ length: capacity }, (_, index) => index + 1).map((seat) => {
                    const taken = takenSeats.includes(seat);
                    const selected = selectedSeat === seat;
                    return (
                      <button
                        key={seat}
                        type="button"
                        disabled={taken}
                        onClick={() => setSeatInput(String(seat))}
                        title={taken ? 'Место занято' : `Место ${seat}`}
                        className={cn(
                          'h-8 rounded-lg text-[11px] font-semibold transition',
                          taken
                            ? 'cursor-not-allowed bg-white/[0.03] text-white/20 line-through'
                            : selected
                              ? 'bg-vibe-gradient text-white shadow-glow'
                              : 'bg-white/[0.06] text-white/60 hover:bg-white/15 hover:text-white',
                        )}
                      >
                        {seat}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <input
                id="seat-number"
                type="number"
                min={1}
                max={capacity}
                className="field"
                placeholder={`От 1 до ${capacity}`}
                value={seatInput}
                onChange={(event) => setSeatInput(event.target.value)}
              />
            )}

            {takenSeats.length > 0 ? (
              <p className="mt-2 text-xs text-white/35">
                Занятые места:{' '}
                {takenSeats.slice(0, 24).join(', ')}
                {takenSeats.length > 24 ? '…' : ''}
              </p>
            ) : null}
          </div>

          <div>
            <label className="field-label" htmlFor="promo-code">
              Промокод <span className="normal-case tracking-normal text-white/25">(необязательно)</span>
            </label>
            <input
              id="promo-code"
              className="field uppercase placeholder:normal-case"
              placeholder="Например, VIBE10"
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
            />
            {promoDebounced.length > 1 ? (
              promoQuery.isFetching ? (
                <p className="mt-1.5 text-xs text-white/35">Проверяем промокод…</p>
              ) : promoPreview ? (
                <p className="mt-1.5 text-xs text-emerald-300">
                  Промокод действует: скидка {promoPreview.discount}% · подарок «{promoPreview.gift}»
                </p>
              ) : promoQuery.isError ? (
                <p className="mt-1.5 text-xs text-red-300">{getErrorMessage(promoQuery.error)}</p>
              ) : null
            ) : (
              <p className="mt-1.5 text-xs text-white/30">
                Скидка по промокоду применится автоматически. Попробуйте{' '}
                <span className="font-mono text-acid">VIBE10</span>.
              </p>
            )}
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-white/40">
            <TicketIcon size={16} className="mt-0.5 shrink-0 text-vibe-300" />
            После оплаты билет с уникальным QR-кодом появится в личном кабинете. Демо-оплата:
            реальные деньги не списываются.
          </div>
        </div>
      )}
    </Modal>
  );
};
