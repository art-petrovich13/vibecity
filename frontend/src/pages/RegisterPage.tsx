import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, Phone, UserRound } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { useAuthStore } from '../stores/authStore';

interface RegisterForm {
  lastName: string;
  firstName: string;
  patronymic: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
}

const INITIAL_FORM: RegisterForm = {
  lastName: '',
  firstName: '',
  patronymic: '',
  phone: '',
  email: '',
  password: '',
  confirm: '',
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { token, login } = useAuthStore();
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ token: authToken, user }) => {
      login(authToken, user);
      navigate('/');
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  if (token) return <Navigate to="/" replace />;

  const update = (field: keyof RegisterForm, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (form.lastName.trim().length < 2 || form.firstName.trim().length < 2) {
      setError('Укажите фамилию и имя (минимум 2 символа)');
      return;
    }

    if (!/^\+?[0-9\s\-()]{10,20}$/.test(form.phone.trim())) {
      setError('Телефон должен содержать 10–20 цифр, можно начать с +');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Введите корректный email');
      return;
    }

    if (form.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Пароли не совпадают');
      return;
    }

    mutation.mutate({
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      patronymic: form.patronymic.trim() || undefined,
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
    });
  };

  return (
    <AuthShell
      title="Создайте аккаунт"
      subtitle="Один аккаунт для покупки билетов, отзывов и публикации собственных мероприятий."
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-vibe-300 transition hover:text-vibe-200">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="register-last-name">
              Фамилия
            </label>
            <div className="relative">
              <UserRound
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="register-last-name"
                className="field pl-11"
                placeholder="Иванов"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) => update('lastName', event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="register-first-name">
              Имя
            </label>
            <div className="relative">
              <UserRound
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="register-first-name"
                className="field pl-11"
                placeholder="Анна"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) => update('firstName', event.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="register-patronymic">
            Отчество <span className="normal-case tracking-normal text-white/25">(необязательно)</span>
          </label>
          <input
            id="register-patronymic"
            className="field"
            placeholder="Сергеевна"
            autoComplete="additional-name"
            value={form.patronymic}
            onChange={(event) => update('patronymic', event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="register-phone">
              Телефон
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="register-phone"
                className="field pl-11"
                placeholder="+375 29 000-00-00"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="register-email">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="register-email"
                type="email"
                className="field pl-11"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="register-password">
              Пароль
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="field pl-11 pr-10"
                placeholder="Минимум 6 символов"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white/70"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="register-confirm">
              Повторите пароль
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                className="field pl-11"
                placeholder="Ещё раз"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(event) => update('confirm', event.target.value)}
              />
            </div>
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
              <Loader2 size={18} className="animate-spin" /> Создаём аккаунт…
            </>
          ) : (
            'Зарегистрироваться'
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-white/25">
          Регистрируясь, вы соглашаетесь с правилами сервиса. Это учебный проект — данные
          используются только для демонстрации.
        </p>
      </form>
    </AuthShell>
  );
};
