import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, Star, Trash2 } from 'lucide-react';
import { eventsApi, reviewsApi, ticketsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { EmptyState } from './EmptyState';
import { RatingStars } from './RatingStars';
import { useAuthStore } from '../stores/authStore';
import type { Review } from '../types';
import { fullName, shortName } from '../lib/format';
import { cn } from '../lib/cn';

interface ReviewSectionProps {
  eventId: number;
  reviews: Review[];
  rating?: number | null;
  reviewsCount?: number;
}

export const ReviewSection = ({ eventId, reviews, rating, reviewsCount }: ReviewSectionProps) => {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [formRating, setFormRating] = useState(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const ticketsQuery = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsApi.my(),
    enabled: Boolean(token),
  });

  const hasTicket =
    ticketsQuery.data?.some((ticket) => ticket.eventId === eventId && ticket.status === 'ACTIVE') ??
    false;

  const ownReview = user ? reviews.find((review) => review.userId === user.id) : undefined;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
  };

  const createMutation = useMutation({
    mutationFn: () => eventsApi.createReview(eventId, { rating: formRating, text: text.trim() }),
    onSuccess: () => {
      setText('');
      setFormRating(5);
      setError('');
      invalidate();
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => reviewsApi.remove(reviewId),
    onSuccess: invalidate,
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const handleDelete = (reviewId: number) => {
    if (window.confirm('Удалить отзыв?')) {
      deleteMutation.mutate(reviewId);
    }
  };

  return (
    <section id="reviews" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Мнения зрителей</p>
          <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Отзывы</h2>
        </div>
        <RatingStars rating={rating} count={reviewsCount ?? reviews.length} showCount size={16} />
      </div>

      <div className="mt-5">
        {!token ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm text-white/45">
            <Link to="/login" className="font-semibold text-vibe-300 hover:text-vibe-200">
              Войдите в аккаунт
            </Link>{' '}
            и купите билет, чтобы оставить отзыв.
          </div>
        ) : ownReview ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-emerald-200">
              Спасибо! Вы уже оставили отзыв на это мероприятие.
            </p>
            <button
              type="button"
              onClick={() => handleDelete(ownReview.id)}
              disabled={deleteMutation.isPending}
              className="btn btn-danger btn-sm w-fit"
            >
              <Trash2 size={14} /> Удалить отзыв
            </button>
          </div>
        ) : hasTicket ? (
          <div className="panel p-5 sm:p-6">
            <h3 className="font-display text-base font-semibold">Поделитесь впечатлением</h3>
            <p className="mt-1 text-xs text-white/40">
              Отзыв могут оставить только зрители с купленным билетом.
            </p>

            <div className="mt-4 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormRating(value)}
                  className="rounded-lg p-1 transition hover:scale-110"
                  aria-label={`Оценка ${value}`}
                >
                  <Star
                    size={26}
                    className={cn(
                      'transition-colors',
                      value <= formRating
                        ? 'fill-amber-300 text-amber-300'
                        : 'text-white/20 hover:text-white/40',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-white/60">{formRating} / 5</span>
            </div>

            <textarea
              className="field mt-4 min-h-[110px] resize-y"
              placeholder="Расскажите, как прошло мероприятие…"
              value={text}
              maxLength={1000}
              onChange={(event) => setText(event.target.value)}
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-white/25">{text.length} / 1000</span>
              <button
                type="button"
                onClick={() => {
                  if (text.trim().length < 3) {
                    setError('Отзыв должен содержать хотя бы 3 символа');
                    return;
                  }
                  setError('');
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
                className="btn btn-primary btn-sm"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Отправляем…
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} /> Оставить отзыв
                  </>
                )}
              </button>
            </div>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm text-white/45">
            {ticketsQuery.isLoading
              ? 'Проверяем наличие билета…'
              : 'Отзывы могут оставлять только зрители, купившие билет на это мероприятие.'}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={22} />}
            title="Отзывов пока нет"
            description="Станьте первым, кто поделится впечатлением об этом событии."
            className="py-10"
          />
        ) : (
          reviews.map((review) => {
            const canDelete = user && (user.id === review.userId || user.role === 'ADMIN');
            const initials = `${review.user.firstName[0] ?? ''}${review.user.lastName[0] ?? ''}`.toUpperCase();

            return (
              <article key={review.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-vibe-gradient text-xs font-bold text-white">
                      {initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{shortName(review.user) || fullName(review.user)}</p>
                      <p className="mt-0.5 text-xs text-white/35">
                        {new Intl.DateTimeFormat('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          timeZone: 'UTC',
                        }).format(new Date(review.date))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.rating} size={13} showCount={false} />
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteMutation.isPending}
                        className="btn btn-ghost h-8 w-8 text-white/35 hover:text-red-300"
                        aria-label="Удалить отзыв"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/65">
                  {review.text}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
