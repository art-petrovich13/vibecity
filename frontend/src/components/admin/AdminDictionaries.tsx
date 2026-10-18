import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { ErrorBlock, LoadingBlock } from '../Loading';
import { Modal } from '../Modal';
import { StatusBadge } from '../StatusBadge';
import type {
  Gift,
  GiftInput,
  Organizer,
  OrganizerInput,
  Place,
  PlaceInput,
  Promocode,
  PromocodeInput,
  Tag,
  TagInput,
} from '../../types';
import { cn } from '../../lib/cn';

type SectionKey = 'places' | 'organizers' | 'tags' | 'gifts' | 'promocodes';

interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  options?: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface ColumnConfig<T> {
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DictionaryConfig<T extends { id: number }> {
  key: string;
  title: string;
  description: string;
  entityLabel: string;
  fields: FieldConfig[];
  columns: ColumnConfig<T>[];
  initialValues: Record<string, string>;
  getDisplayName: (item: T) => string;
  list: () => Promise<T[]>;
  create: (data: Record<string, unknown>) => Promise<T>;
  update: (id: number, data: Record<string, unknown>) => Promise<T>;
  remove: (id: number) => Promise<void>;
}

function DictionarySection<T extends { id: number }>({
  config,
}: {
  config: DictionaryConfig<T>;
}) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>(config.initialValues);
  const [error, setError] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin-dict', config.key],
    queryFn: config.list,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dict', config.key] });
    queryClient.invalidateQueries({ queryKey: ['catalog'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing ? config.update(editing.id, payload) : config.create(payload),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setError('');
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => config.remove(id),
    onSuccess: () => {
      invalidate();
      setError('');
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(config.initialValues);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (item: T) => {
    const values: Record<string, string> = {};
    for (const field of config.fields) {
      const value = (item as Record<string, unknown>)[field.name];
      values[field.name] = value === null || value === undefined ? '' : String(value);
    }
    setEditing(item);
    setForm(values);
    setError('');
    setModalOpen(true);
  };

  const handleDelete = (item: T) => {
    if (window.confirm(`Удалить «${config.getDisplayName(item)}»?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const payload: Record<string, unknown> = {};

    for (const field of config.fields) {
      const raw = (form[field.name] ?? '').trim();

      if (field.required && raw === '') {
        setError(`Заполните поле «${field.label}»`);
        return;
      }

      if (raw === '') {
        payload[field.name] = undefined;
        continue;
      }

      payload[field.name] = field.type === 'number' ? Number(raw) : raw;
    }

    mutation.mutate(payload);
  };

  const items = listQuery.data ?? [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Справочники</p>
          <h2 className="mt-1 font-display text-xl font-bold">{config.title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/35">
            {config.description}
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn-primary btn-md shrink-0">
          <Plus size={16} /> Добавить
        </button>
      </div>

      {error && !modalOpen ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </span>
          <button type="button" onClick={() => setError('')} className="text-xs text-red-200/60">
            Скрыть
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        {listQuery.isError ? (
          <ErrorBlock message="Не удалось загрузить справочник" onRetry={() => listQuery.refetch()} />
        ) : listQuery.isLoading ? (
          <LoadingBlock label="Загружаем справочник" />
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center">
            <p className="font-display text-base font-semibold">Справочник пуст</p>
            <p className="mt-1 text-sm text-white/35">Добавьте первую запись, чтобы использовать её в мероприятиях.</p>
            <button type="button" onClick={openCreate} className="btn btn-primary btn-sm mt-5">
              <Plus size={14} /> Добавить
            </button>
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-white/30">
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column.label} className={cn('px-4 py-3 font-semibold', column.className)}>
                        {column.label}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {items.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      {config.columns.map((column) => (
                        <td key={column.label} className={cn('px-4 py-3.5', column.className)}>
                          {column.render(item)}
                        </td>
                      ))}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="btn btn-ghost h-8 w-8"
                            title="Редактировать"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deleteMutation.isPending}
                            className="btn btn-ghost h-8 w-8 text-white/40 hover:text-red-300"
                            title="Удалить"
                          >
                            {deleteMutation.isPending && deleteMutation.variables === item.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? 'Редактирование' : 'Новая запись'} · ${config.entityLabel}`}
        description={editing ? 'Изменения сразу применятся к справочнику' : 'Заполните поля справочника'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary btn-md">
              Отмена
            </button>
            <button
              type="submit"
              form={`dict-form-${config.key}`}
              disabled={mutation.isPending}
              className="btn btn-primary btn-md"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Сохраняем…
                </>
              ) : (
                'Сохранить'
              )}
            </button>
          </div>
        }
      >
        <form id={`dict-form-${config.key}`} onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="field-label" htmlFor={`${config.key}-${field.name}`}>
                {field.label}
                {field.required ? ' *' : ''}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={`${config.key}-${field.name}`}
                  className="field min-h-[100px] resize-y"
                  placeholder={field.placeholder}
                  value={form[field.name] ?? ''}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, [field.name]: event.target.value }))
                  }
                />
              ) : field.type === 'select' ? (
                <select
                  id={`${config.key}-${field.name}`}
                  className="field"
                  value={form[field.name] ?? ''}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, [field.name]: event.target.value }))
                  }
                >
                  <option value="">Не выбрано</option>
                  {field.options?.map((option) => (
                    <option key={String(option.value)} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${config.key}-${field.name}`}
                  type={field.type === 'number' ? 'number' : 'text'}
                  className="field"
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={form[field.name] ?? ''}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, [field.name]: event.target.value }))
                  }
                />
              )}

              {field.hint ? <p className="mt-1 text-[11px] text-white/25">{field.hint}</p> : null}
            </div>
          ))}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}

export const AdminDictionaries = () => {
  const [section, setSection] = useState<SectionKey>('places');

  const giftsQuery = useQuery({
    queryKey: ['admin-dict', 'gifts'],
    queryFn: adminApi.gifts.list,
  });

  const giftOptions = (giftsQuery.data ?? []).map((gift) => ({
    value: gift.id,
    label: gift.name,
  }));

  const placesConfig: DictionaryConfig<Place> = {
    key: 'places',
    title: 'Места проведения',
    description: 'Площадки, на которых проходят мероприятия. Вместимость ограничивает количество мест.',
    entityLabel: 'место',
    initialValues: { city: '', name: '', address: '', capacity: '300' },
    getDisplayName: (place) => place.name,
    fields: [
      { name: 'name', label: 'Название', required: true, placeholder: 'Клуб «Re:Public»' },
      { name: 'city', label: 'Город', required: true, placeholder: 'Минск' },
      { name: 'address', label: 'Адрес', required: true, placeholder: 'ул. Октябрьская, 16' },
      {
        name: 'capacity',
        label: 'Вместимость',
        type: 'number',
        required: true,
        min: 1,
        max: 1_000_000,
        hint: 'Максимальное количество мест',
      },
    ],
    columns: [
      {
        label: 'Название',
        render: (place) => <span className="font-medium text-white/90">{place.name}</span>,
      },
      { label: 'Город', render: (place) => <span className="text-white/55">{place.city}</span> },
      {
        label: 'Адрес',
        render: (place) => <span className="text-xs text-white/40">{place.address}</span>,
      },
      {
        label: 'Вместимость',
        render: (place) => <span className="text-white/60">{place.capacity} мест</span>,
      },
      {
        label: 'Событий',
        render: (place) => <span className="text-white/45">{place._count?.events ?? 0}</span>,
      },
    ],
    list: adminApi.places.list,
    create: (data) => adminApi.places.create(data as unknown as PlaceInput),
    update: (id, data) => adminApi.places.update(id, data as Partial<PlaceInput>),
    remove: adminApi.places.remove,
  };

  const organizersConfig: DictionaryConfig<Organizer> = {
    key: 'organizers',
    title: 'Организаторы',
    description: 'Компании и люди, которые создают события. Организатор указывается в карточке мероприятия.',
    entityLabel: 'организатора',
    initialValues: { name: '', contactPerson: '', phone: '' },
    getDisplayName: (organizer) => organizer.name,
    fields: [
      { name: 'name', label: 'Название', required: true, placeholder: 'Vibe Production' },
      { name: 'contactPerson', label: 'Контактное лицо', required: true, placeholder: 'Артём Смирнов' },
      { name: 'phone', label: 'Телефон', required: true, placeholder: '+375 29 111-22-33' },
    ],
    columns: [
      {
        label: 'Название',
        render: (organizer) => <span className="font-medium text-white/90">{organizer.name}</span>,
      },
      {
        label: 'Контактное лицо',
        render: (organizer) => <span className="text-white/55">{organizer.contactPerson}</span>,
      },
      {
        label: 'Телефон',
        render: (organizer) => <span className="text-xs text-white/40">{organizer.phone}</span>,
      },
      {
        label: 'Событий',
        render: (organizer) => <span className="text-white/45">{organizer._count?.events ?? 0}</span>,
      },
    ],
    list: adminApi.organizers.list,
    create: (data) => adminApi.organizers.create(data as unknown as OrganizerInput),
    update: (id, data) => adminApi.organizers.update(id, data as Partial<OrganizerInput>),
    remove: adminApi.organizers.remove,
  };

  const tagsConfig: DictionaryConfig<Tag> = {
    key: 'tags',
    title: 'Теги',
    description: 'Короткие метки для навигации по афише. Тип помогает группировать теги между собой.',
    entityLabel: 'тег',
    initialValues: { name: '', type: '' },
    getDisplayName: (tag) => tag.name,
    fields: [
      { name: 'name', label: 'Название', required: true, placeholder: 'Музыка' },
      { name: 'type', label: 'Тип', required: true, placeholder: 'music' },
    ],
    columns: [
      {
        label: 'Название',
        render: (tag) => <span className="font-medium text-white/90">#{tag.name}</span>,
      },
      {
        label: 'Тип',
        render: (tag) => <span className="chip font-mono">{tag.type}</span>,
      },
      {
        label: 'Событий',
        render: (tag) => <span className="text-white/45">{tag._count?.events ?? 0}</span>,
      },
    ],
    list: adminApi.tags.list,
    create: (data) => adminApi.tags.create(data as unknown as TagInput),
    update: (id, data) => adminApi.tags.update(id, data as Partial<TagInput>),
    remove: adminApi.tags.remove,
  };

  const giftsConfig: DictionaryConfig<Gift> = {
    key: 'gifts',
    title: 'Подарки',
    description: 'Бонусы и подарки, к которым привязываются промокоды. Подарок получает зритель при покупке.',
    entityLabel: 'подарок',
    initialValues: { name: '', description: '', type: '', status: 'AVAILABLE' },
    getDisplayName: (gift) => gift.name,
    fields: [
      { name: 'name', label: 'Название', required: true, placeholder: 'Скидка на мерч' },
      {
        name: 'description',
        label: 'Описание',
        type: 'textarea',
        required: true,
        placeholder: 'Что именно получает зритель',
      },
      { name: 'type', label: 'Тип', required: true, placeholder: 'Скидка' },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: [
          { value: 'AVAILABLE', label: 'Доступен' },
          { value: 'RESERVED', label: 'Зарезервирован' },
          { value: 'GIVEN', label: 'Выдан' },
        ],
      },
    ],
    columns: [
      {
        label: 'Название',
        render: (gift) => (
          <div>
            <p className="font-medium text-white/90">{gift.name}</p>
            <p className="mt-0.5 max-w-[260px] truncate text-[11px] text-white/30">
              {gift.description}
            </p>
          </div>
        ),
      },
      { label: 'Тип', render: (gift) => <span className="text-white/55">{gift.type}</span> },
      {
        label: 'Статус',
        render: (gift) => <StatusBadge status={gift.status} />,
      },
      {
        label: 'Промокодов',
        render: (gift) => <span className="text-white/45">{gift._count?.promocodes ?? 0}</span>,
      },
    ],
    list: adminApi.gifts.list,
    create: (data) => adminApi.gifts.create(data as unknown as GiftInput),
    update: (id, data) => adminApi.gifts.update(id, data as Partial<GiftInput>),
    remove: adminApi.gifts.remove,
  };

  const promocodesConfig: DictionaryConfig<Promocode> = {
    key: 'promocodes',
    title: 'Промокоды',
    description: 'Коды скидок, привязанные к подаркам. Один промокод действует на одну покупку билета.',
    entityLabel: 'промокод',
    initialValues: { giftId: '', code: '', discount: '10', status: 'ACTIVE' },
    getDisplayName: (promocode) => promocode.code,
    fields: [
      {
        name: 'giftId',
        label: 'Подарок',
        type: 'select',
        required: true,
        options: giftOptions,
      },
      {
        name: 'code',
        label: 'Код',
        required: true,
        placeholder: 'VIBE10',
        hint: 'Будет приведён к верхнему регистру',
      },
      {
        name: 'discount',
        label: 'Скидка, %',
        type: 'number',
        required: true,
        min: 0,
        max: 100,
      },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: [
          { value: 'ACTIVE', label: 'Активен' },
          { value: 'USED', label: 'Использован' },
          { value: 'EXPIRED', label: 'Истёк' },
        ],
      },
    ],
    columns: [
      {
        label: 'Код',
        render: (promocode) => (
          <span className="font-mono text-sm font-semibold text-vibe-200">{promocode.code}</span>
        ),
      },
      {
        label: 'Подарок',
        render: (promocode) => (
          <span className="text-white/55">{promocode.gift?.name ?? `#${promocode.giftId}`}</span>
        ),
      },
      {
        label: 'Скидка',
        render: (promocode) => <span className="text-white/70">{promocode.discount}%</span>,
      },
      {
        label: 'Статус',
        render: (promocode) => <StatusBadge status={promocode.status} />,
      },
      {
        label: 'Билетов',
        render: (promocode) => <span className="text-white/45">{promocode._count?.tickets ?? 0}</span>,
      },
    ],
    list: adminApi.promocodes.list,
    create: (data) => adminApi.promocodes.create(data as unknown as PromocodeInput),
    update: (id, data) => adminApi.promocodes.update(id, data as Partial<PromocodeInput>),
    remove: adminApi.promocodes.remove,
  };

  const tabs: Array<{ key: SectionKey; label: string }> = [
    { key: 'places', label: 'Места' },
    { key: 'organizers', label: 'Организаторы' },
    { key: 'tags', label: 'Теги' },
    { key: 'gifts', label: 'Подарки' },
    { key: 'promocodes', label: 'Промокоды' },
  ];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.025] p-1 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSection(tab.key)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition',
              section === tab.key
                ? 'bg-vibe-gradient text-white shadow-glow'
                : 'text-white/45 hover:text-white',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {section === 'places' ? <DictionarySection key="places" config={placesConfig} /> : null}
        {section === 'organizers' ? <DictionarySection key="organizers" config={organizersConfig} /> : null}
        {section === 'tags' ? <DictionarySection key="tags" config={tagsConfig} /> : null}
        {section === 'gifts' ? <DictionarySection key="gifts" config={giftsConfig} /> : null}
        {section === 'promocodes' ? <DictionarySection key="promocodes" config={promocodesConfig} /> : null}
      </div>
    </div>
  );
};
