import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { eventsApi, type EventInput } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Modal } from './Modal';
import type { Catalog, Event } from '../types';
import { toDateInputValue } from '../lib/format';
import { useAuthStore } from '../stores/authStore';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: Event | null;
  catalog?: Catalog;
  onSaved?: (event: Event) => void;
}

interface FormState {
  name: string;
  category: string;
  tagId: string;
  organizerId: string;
  placeId: string;
  date: string;
  time: string;
  price: string;
  imageUrl: string;
  description: string;
}

const emptyForm = (): FormState => ({
  name: '',
  category: '',
  tagId: '',
  organizerId: '',
  placeId: '',
  date: '',
  time: '19:00',
  price: '50',
  imageUrl: '',
  description: '',
});

export const EventFormModal = ({ open, onClose, event, catalog, onSaved }: EventFormModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (event) {
      setForm({
        name: event.name,
        category: event.category,
        tagId: String(event.tagId),
        organizerId: String(event.organizerId),
        placeId: String(event.placeId),
        date: toDateInputValue(event.date),
        time: event.time,
        price: String(event.price),
        imageUrl: event.imageUrl ?? '',
        description: event.description,
      });
    } else {
      setForm(emptyForm());
    }
    setError('');
  }, [open, event]);

  const mutation = useMutation({
    mutationFn: (payload: EventInput) =>
      event ? eventsApi.update(event.id, payload) : eventsApi.create(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onSaved?.(saved);
      onClose();
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const update = (field: keyof FormState, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const handleSubmit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    setError('');

    if (form.name.trim().length < 3) {
      setError('Название должно содержать минимум 3 символа');
      return;
    }

    if (!form.organizerId || !form.placeId || !form.tagId) {
      setError('Выберите организатора, площадку и тег');
      return;
    }

    if (!form.date || !form.time) {
      setError('Укажите дату и время мероприятия');
      return;
    }

    if (form.description.trim().length < 10) {
      setError('Описание должно содержать минимум 10 символов');
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError('Цена должна быть неотрицательным числом');
      return;
    }

    if (!form.category.trim()) {
      setError('Укажите категорию');
      return;
    }

    mutation.mutate({
      name: form.name.trim(),
      category: form.category.trim(),
      tagId: Number(form.tagId),
      organizerId: Number(form.organizerId),
      placeId: Number(form.placeId),
      date: form.date,
      time: form.time,
      price: Math.round(price),
      imageUrl: form.imageUrl.trim() || null,
      description: form.description.trim(),
    });
  };

  const selectedPlace = catalog?.places.find((place) => place.id === Number(form.placeId));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? 'Редактирование мероприятия' : 'Новое мероприятие'}
      description={
        event
          ? 'Обновите информацию — изменения сразу попадут в афишу после модерации'
          : 'Заполните карточку события. Поля со звёздочкой обязательны'
      }
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-relaxed text-white/30">
            {isAdmin
              ? 'Вы администратор: мероприятие будет опубликовано сразу.'
              : 'После сохранения мероприятие отправится на модерацию администратору.'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Отмена
            </button>
            <button
              type="submit"
              form="event-form"
              disabled={mutation.isPending}
              className="btn btn-primary btn-md"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Сохраняем…
                </>
              ) : (
                <>
                  <Save size={16} /> {event ? 'Сохранить' : 'Создать'}
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="event-name">
            Название *
          </label>
          <input
            id="event-name"
            className="field"
            placeholder="Например, Ночной концерт «Neon Waves»"
            value={form.name}
            onChange={(changeEvent) => update('name', changeEvent.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="event-category">
              Категория *
            </label>
            <input
              id="event-category"
              className="field"
              list="event-categories"
              placeholder="Концерты"
              value={form.category}
              onChange={(changeEvent) => update('category', changeEvent.target.value)}
            />
            <datalist id="event-categories">
              {catalog?.categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="field-label" htmlFor="event-tag">
              Тег *
            </label>
            <select
              id="event-tag"
              className="field"
              value={form.tagId}
              onChange={(changeEvent) => update('tagId', changeEvent.target.value)}
            >
              <option value="">Выберите тег</option>
              {catalog?.tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({tag.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="event-organizer">
              Организатор *
            </label>
            <select
              id="event-organizer"
              className="field"
              value={form.organizerId}
              onChange={(changeEvent) => update('organizerId', changeEvent.target.value)}
            >
              <option value="">Выберите организатора</option>
              {catalog?.organizers.map((organizer) => (
                <option key={organizer.id} value={organizer.id}>
                  {organizer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="event-place">
              Площадка *
            </label>
            <select
              id="event-place"
              className="field"
              value={form.placeId}
              onChange={(changeEvent) => update('placeId', changeEvent.target.value)}
            >
              <option value="">Выберите площадку</option>
              {catalog?.places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.city} — {place.name}
                </option>
              ))}
            </select>
            {selectedPlace ? (
              <p className="mt-1.5 text-[11px] text-white/30">
                Вместимость: {selectedPlace.capacity} мест · {selectedPlace.address}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="event-date">
              Дата *
            </label>
            <input
              id="event-date"
              type="date"
              className="field"
              value={form.date}
              onChange={(changeEvent) => update('date', changeEvent.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="event-time">
              Время *
            </label>
            <input
              id="event-time"
              type="time"
              className="field"
              value={form.time}
              onChange={(changeEvent) => update('time', changeEvent.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="event-price">
              Цена, р. *
            </label>
            <input
              id="event-price"
              type="number"
              min={0}
              step={5}
              className="field"
              value={form.price}
              onChange={(changeEvent) => update('price', changeEvent.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="event-image">
            Ссылка на изображение
          </label>
          <input
            id="event-image"
            className="field"
            placeholder="https://…"
            value={form.imageUrl}
            onChange={(changeEvent) => update('imageUrl', changeEvent.target.value)}
          />
          <p className="mt-1.5 text-[11px] text-white/25">
            Необязательно. Если ссылки нет, покажем стильную заглушку.
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="event-description">
            Описание *
          </label>
          <textarea
            id="event-description"
            className="field min-h-[130px] resize-y"
            placeholder="Расскажите, почему на это событие стоит прийти…"
            value={form.description}
            maxLength={5000}
            onChange={(changeEvent) => update('description', changeEvent.target.value)}
          />
          <p className="mt-1.5 text-right text-[11px] text-white/25">
            {form.description.length} / 5000
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
};
