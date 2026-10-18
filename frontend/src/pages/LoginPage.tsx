import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { useAuthStore } from '../stores/authStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ token: authToken, user }) => {
      login(authToken, user);
      navigate(from, { replace: true });
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Заполните email и пароль');
      return;
    }

    mutation.mutate({ email: email.trim(), password });
  };

  const fillDemo = (role: 'admin' | 'user') => {
    setEmail(role === 'admin' ? 'admin@vibecity.by' : 'user@vibecity.by');
    setPassword(role === 'admin' ? 'admin' : 'user123');
    setError('');
  };

  return (
    <AuthShell
      title="С возвращением"
      subtitle="Войдите, чтобы покупать билеты, следить за событиями и управлять афишей."
      footer={
        <>
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-vibe-300 transition hover:text-vibe-200">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="login-email">
            Email
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="field pl-11"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="login-password">
            Пароль
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="field pl-11 pr-11"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white/70"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-lg w-full">
          {mutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Входим…
            </>
          ) : (
            'Войти'
          )}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
          Тестовые аккаунты
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fillDemo('admin')}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-vibe-400/40 hover:bg-vibe-500/10"
          >
            <span className="block text-xs font-semibold text-white">Администратор</span>
            <span className="mt-0.5 block text-[11px] text-white/40">admin@vibecity.by / admin</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemo('user')}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-vibe-400/40 hover:bg-vibe-500/10"
          >
            <span className="block text-xs font-semibold text-white">Пользователь</span>
            <span className="mt-0.5 block text-[11px] text-white/40">user@vibecity.by / user123</span>
          </button>
        </div>
        <p className="mt-2.5 text-[11px] text-white/25">Нажмите, чтобы подставить данные в форму.</p>
      </div>
    </AuthShell>
  );
};
