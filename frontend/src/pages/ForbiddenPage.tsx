import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const ForbiddenPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="page-container flex min-h-[65vh] items-center justify-center py-12">
      <div className="panel relative w-full max-w-xl overflow-hidden p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-pulse-500/15 blur-[80px]" />
        <div className="relative">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
            <ShieldAlert size={26} />
          </span>
          <p className="eyebrow mt-5">Доступ ограничен</p>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Для этого раздела нужна роль организатора
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            {user
              ? 'Ваша текущая роль — «Пользователь». Роль организатора назначает администратор в разделе «Пользователи».'
              : 'Войдите в аккаунт или зарегистрируйтесь. Роль организатора назначает администратор.'}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/" className="btn btn-primary btn-md">
              <ArrowLeft size={16} /> Вернуться в афишу
            </Link>
            {user ? (
              <Link to="/profile" className="btn btn-secondary btn-md">
                <Sparkles size={16} /> Мой профиль
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-md">
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
