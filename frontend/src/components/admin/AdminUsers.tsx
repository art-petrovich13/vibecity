import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Loader2, RotateCcw, Search, ShieldCheck, Users } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { EmptyState } from '../EmptyState';
import { ErrorBlock, LoadingBlock } from '../Loading';
import { Pagination } from '../Pagination';
import { StatusBadge } from '../StatusBadge';
import { useAuthStore } from '../../stores/authStore';
import type { Role, User } from '../../types';
import { fullName } from '../../lib/format';
import { cn } from '../../lib/cn';

const PAGE_SIZE = 12;

export const AdminUsers = () => {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ['admin-users', { search, role, page }],
    queryFn: () =>
      adminApi.users({
        search: search || undefined,
        role: role || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, isBanned }: { id: number; isBanned: boolean }) =>
      adminApi.banUser(id, isBanned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setError('');
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const handleToggleBan = (user: User) => {
    const action = user.isBanned ? 'разблокировать' : 'заблокировать';
    if (!window.confirm(`Точно ${action} пользователя ${fullName(user)}?`)) return;
    banMutation.mutate({ id: user.id, isBanned: !user.isBanned });
  };

  const users = usersQuery.data?.items ?? [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Пользователи</p>
          <h2 className="mt-1 font-display text-xl font-bold">Управление доступами</h2>
          <p className="mt-1 text-xs text-white/35">
            Блокировка запрещает вход и покупку билетов, но не удаляет историю.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              className="field h-10 w-full py-0 pl-9 pr-3 text-xs sm:w-64"
              placeholder="Имя, email или телефон"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <select
            className="field h-10 w-full cursor-pointer py-0 text-xs sm:w-40"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role | '');
              setPage(1);
            }}
          >
            <option value="">Все роли</option>
            <option value="USER">Пользователи</option>
            <option value="ADMIN">Администраторы</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-5">
        {usersQuery.isError ? (
          <ErrorBlock message="Не удалось загрузить пользователей" onRetry={() => usersQuery.refetch()} />
        ) : usersQuery.isLoading ? (
          <LoadingBlock label="Загружаем пользователей" />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Пользователи не найдены"
            description="Попробуйте изменить поисковый запрос или фильтр по роли."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setRole('');
                }}
                className="btn btn-secondary btn-md"
              >
                <RotateCcw size={15} /> Сбросить фильтры
              </button>
            }
          />
        ) : (
          <>
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-white/30">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Пользователь</th>
                      <th className="px-4 py-3 font-semibold">Контакты</th>
                      <th className="px-4 py-3 font-semibold">Роль</th>
                      <th className="px-4 py-3 font-semibold">Статус</th>
                      <th className="px-4 py-3 font-semibold">Регистрация</th>
                      <th className="px-5 py-3 text-right font-semibold">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {users.map((user) => {
                      const isSelf = currentUser?.id === user.id;
                      const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

                      return (
                        <tr key={user.id} className="table-row-hover">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vibe-gradient text-[11px] font-bold">
                                {initials}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-white/90">
                                  {fullName(user)}
                                  {isSelf ? <span className="ml-2 text-[11px] text-vibe-300">это вы</span> : null}
                                </p>
                                <p className="text-[11px] text-white/30">ID {user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-white/55">
                            <span className="block">{user.email}</span>
                            <span className="block text-white/30">{user.phone}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={user.role} />
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                user.isBanned
                                  ? 'border-red-400/25 bg-red-400/10 text-red-300'
                                  : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
                              )}
                            >
                              {user.isBanned ? 'Заблокирован' : 'Активен'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-white/45">
                            {new Intl.DateTimeFormat('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              timeZone: 'UTC',
                            }).format(new Date(user.createdAt))}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isSelf ? (
                              <span className="text-[11px] text-white/25">Текущий аккаунт</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleBan(user)}
                                disabled={banMutation.isPending}
                                className={
                                  user.isBanned
                                    ? 'btn btn-secondary btn-sm'
                                    : 'btn btn-danger btn-sm'
                                }
                              >
                                {banMutation.isPending && banMutation.variables?.id === user.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : user.isBanned ? (
                                  <ShieldCheck size={13} />
                                ) : (
                                  <Ban size={13} />
                                )}
                                {user.isBanned ? 'Разблокировать' : 'Заблокировать'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={usersQuery.data?.totalPages ?? 1}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
