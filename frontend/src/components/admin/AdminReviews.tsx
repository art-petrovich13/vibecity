import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, Search, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { EmptyState } from '../EmptyState';
import { ErrorBlock, LoadingBlock } from '../Loading';
import { RatingStars } from '../RatingStars';
import { formatDateWithYear, fullName } from '../../lib/format';

export const AdminReviews = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: adminApi.reviews,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      setError('');
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const reviews = useMemo(() => {
    const items = reviewsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter(
      (review) =>
        review.text.toLowerCase().includes(term) ||
        review.event.name.toLowerCase().includes(term) ||
        fullName(review.user).toLowerCase().includes(term),
    );
  }, [reviewsQuery.data, search]);

  const handleDelete = (id: number) => {
    if (window.confirm('Удалить отзыв? Это действие необратимо.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Модерация</p>
          <h2 className="mt-1 font-display text-xl font-bold">Отзывы</h2>
          <p className="mt-1 text-xs text-white/35">
            Удаляйте спам и некорректные отзывы. Оценка влияет на рейтинг мероприятия.
          </p>
        </div>

        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            className="field h-10 w-full py-0 pl-9 pr-3 text-xs sm:w-72"
            placeholder="Поиск по тексту, событию или автору"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5">
        {reviewsQuery.isError ? (
          <ErrorBlock message="Не удалось загрузить отзывы" onRetry={() => reviewsQuery.refetch()} />
        ) : reviewsQuery.isLoading ? (
          <LoadingBlock label="Загружаем отзывы" />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={22} />}
            title={search ? 'Отзывы не найдены' : 'Отзывов пока нет'}
            description={
              search
                ? 'Попробуйте изменить поисковый запрос.'
                : 'Как только зрители купят билеты и поделятся впечатлениями, отзывы появятся здесь.'
            }
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="panel p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vibe-gradient text-[11px] font-bold">
                      {`${review.user.firstName[0] ?? ''}${review.user.lastName[0] ?? ''}`.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/90">
                        {fullName(review.user)}
                        <span className="ml-2 text-[11px] font-normal text-white/30">
                          {review.user.email}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/35">
                        <Link
                          to={`/events/${review.event.id}`}
                          className="text-vibe-300 transition hover:text-vibe-200"
                        >
                          {review.event.name}
                        </Link>{' '}
                        · {formatDateWithYear(review.event.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <RatingStars rating={review.rating} size={13} />
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={deleteMutation.isPending}
                      className="btn btn-danger btn-sm"
                    >
                      {deleteMutation.isPending && deleteMutation.variables === review.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      Удалить
                    </button>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/60">
                  {review.text}
                </p>

                <p className="mt-2 text-[11px] text-white/25">
                  Опубликован{' '}
                  {new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(review.date))}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
