import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  LayoutDashboard,
  LibraryBig,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminDictionaries } from '../components/admin/AdminDictionaries';
import { AdminEvents } from '../components/admin/AdminEvents';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminReviews } from '../components/admin/AdminReviews';
import { AdminUsers } from '../components/admin/AdminUsers';
import type { AdminTab } from '../components/admin/types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/cn';

const TABS: Array<{ key: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'overview', label: 'Обзор', icon: LayoutDashboard },
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'events', label: 'Мероприятия', icon: CalendarDays },
  { key: 'reviews', label: 'Отзывы', icon: MessageSquare },
  { key: 'dictionaries', label: 'Справочники', icon: LibraryBig },
];

export const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<AdminTab>('overview');

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-vibe-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-52 w-52 rounded-full bg-pulse-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-vibe-gradient shadow-glow">
                <ShieldCheck size={20} className="text-white" />
              </span>
              <div>
                <p className="eyebrow">Администрирование</p>
                <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
                  Админ-панель VibeCity
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Управляйте пользователями, модерируйте мероприятия, удаляйте отзывы и ведите
              справочники платформы.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status="ADMIN" />
              <span className="text-xs text-white/30">
                {user?.email} · полный доступ
              </span>
            </div>
          </div>

          <Link to="/" className="btn btn-secondary btn-md shrink-0">
            Открыть афишу
          </Link>
        </div>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.025] p-1 no-scrollbar">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-semibold transition sm:text-sm',
              tab === item.key
                ? 'bg-vibe-gradient text-white shadow-glow'
                : 'text-white/45 hover:bg-white/[0.04] hover:text-white',
            )}
          >
            <item.icon size={15} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {tab === 'overview' ? <AdminOverview onNavigate={setTab} /> : null}
        {tab === 'users' ? <AdminUsers /> : null}
        {tab === 'events' ? <AdminEvents /> : null}
        {tab === 'reviews' ? <AdminReviews /> : null}
        {tab === 'dictionaries' ? <AdminDictionaries /> : null}
      </div>
    </div>
  );
};
