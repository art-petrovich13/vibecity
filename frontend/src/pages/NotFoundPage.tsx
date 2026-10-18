import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Sparkles } from 'lucide-react';

export const NotFoundPage = () => (
  <div className="relative overflow-hidden">
    <div className="pointer-events-none absolute inset-0 bg-vibe-glow" />
    <div className="page-container relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="relative grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <Compass size={34} className="text-vibe-300" />
        <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-vibe-gradient">
          <Sparkles size={13} className="text-white" />
        </span>
      </span>

      <p className="mt-8 font-display text-7xl font-bold tracking-tight sm:text-8xl">
        <span className="gradient-text">404</span>
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Такой страницы нет</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
        Возможно, событие уже прошло, ссылка устарела или в адресе опечатка. Загляните в афишу — там
        точно что-то происходит.
      </p>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Link to="/" className="btn btn-primary btn-md">
          <ArrowLeft size={16} /> Вернуться в афишу
        </Link>
        <Link to="/profile" className="btn btn-secondary btn-md">
          Мои билеты
        </Link>
      </div>
    </div>
  </div>
);
