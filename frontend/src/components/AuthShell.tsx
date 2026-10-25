import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Quote, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => (
  <div className="relative overflow-hidden">
    <div className="pointer-events-none absolute inset-0 bg-vibe-glow" />
    <div className="page-container relative grid min-h-[calc(100vh-72px)] items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:py-16">
      <div className="mx-auto w-full max-w-md animate-fade-up">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={15} /> На главную
        </Link>

        <div className="mt-8 lg:hidden">
          <Logo />
        </div>

        <p className="eyebrow mt-8 lg:mt-10">VibeCity</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-white/45">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <div className="mt-6 text-sm text-white/40">{footer}</div>
      </div>

      <div className="on-media relative hidden h-[620px] lg:block" aria-hidden="true">
        <div className="absolute inset-0 overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-vibe-600/35 via-ink-900 to-pulse-500/25">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pulse-500/25 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-vibe-500/25 blur-[100px]" />

          <div className="absolute right-8 top-16 h-64 w-48 rotate-[8deg] overflow-hidden rounded-3xl border border-white/10 shadow-card">
            <img
              src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80"
              alt=""
              className="h-full w-full object-cover opacity-80"
            />
          </div>
          <div className="absolute right-32 top-32 h-64 w-48 -rotate-[6deg] overflow-hidden rounded-3xl border border-white/10 shadow-card">
            <img
              src="https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=700&q=80"
              alt=""
              className="h-full w-full object-cover opacity-80"
            />
          </div>

          <div className="absolute inset-x-8 bottom-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur">
              <Sparkles size={12} /> 14 событий каждую неделю
            </span>
            <Quote className="mt-5 h-7 w-7 text-white/25" />
            <p className="mt-2 font-display text-2xl font-semibold leading-snug text-white/90">
              «Хороший вечер начинается с правильного билета»
            </p>
            <p className="mt-3 text-sm text-white/45">VibeCity — афиша, которая чувствует город</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
