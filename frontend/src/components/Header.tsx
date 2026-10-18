import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, Ticket, UserRound, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/cn';
import { Logo } from './Logo';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white',
  );

export const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="page-container flex h-16 items-center justify-between gap-3 sm:h-[72px]">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink to="/" end className={navLinkClass}>
              Афиша
            </NavLink>
            {user ? (
              <NavLink to="/profile" className={navLinkClass}>
                Мои билеты
              </NavLink>
            ) : null}
            <NavLink to="/organizer" className={navLinkClass}>
              Организаторам
            </NavLink>
            {isAdmin ? (
              <NavLink to="/admin" className={navLinkClass}>
                Админка
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-4 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-vibe-gradient text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium text-white/80">
                  {user.firstName}
                </span>
                {isAdmin ? <ShieldCheck size={14} className="text-acid" /> : null}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost h-10 w-10"
                title="Выйти"
                aria-label="Выйти из аккаунта"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-md">
                Войти
              </Link>
              <Link to="/register" className="btn btn-primary btn-md">
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="btn btn-secondary h-10 w-10 md:hidden"
          aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/[0.06] bg-ink-950/95 px-4 pb-5 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Афиша
            </NavLink>
            <NavLink to="/organizer" className={navLinkClass}>
              Организаторам
            </NavLink>
            {user ? (
              <NavLink to="/profile" className={navLinkClass}>
                Мои билеты
              </NavLink>
            ) : null}
            {isAdmin ? (
              <NavLink to="/admin" className={navLinkClass}>
                Админка
              </NavLink>
            ) : null}
          </nav>

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <Link to="/profile" className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vibe-gradient text-xs font-bold">
                    {initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="block truncate text-xs text-white/40">{user.email}</span>
                  </span>
                </Link>
                <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">
                  <LogOut size={14} /> Выйти
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn btn-secondary btn-md">
                  <UserRound size={16} /> Войти
                </Link>
                <Link to="/register" className="btn btn-primary btn-md">
                  <Ticket size={16} /> Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};
