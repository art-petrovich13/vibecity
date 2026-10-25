import { z } from 'zod';
import { EventStatus, GiftStatus, PromocodeStatus } from '@prisma/client';

const idSchema = z.coerce.number().int().positive('Идентификатор должен быть положительным числом');

const requiredText = (label: string, min = 1, max = 255) =>
  z
    .string({ required_error: `${label}: обязательное поле` })
    .trim()
    .min(min, `${label}: минимум ${min} символов`)
    .max(max, `${label}: максимум ${max} символов`);

const optionalText = (max = 255) => z.string().trim().max(max).optional();

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{10,20}$/, 'Телефон должен содержать 10–20 цифр, может начинаться с +');

const emailSchema = z.string().trim().toLowerCase().email('Некорректный email');

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате ГГГГ-ММ-ДД')
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Время должно быть в формате ЧЧ:ММ');

const startOfTodayUtc = (): Date => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

// ---------- Auth ----------

export const registerSchema = z.object({
  lastName: requiredText('Фамилия', 2, 100),
  firstName: requiredText('Имя', 2, 100),
  patronymic: optionalText(100),
  phone: phoneSchema,
  email: emailSchema,
  password: z
    .string()
    .min(6, 'Пароль: минимум 6 символов')
    .max(72, 'Пароль: максимум 72 символа'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль').max(72),
});

export const profileUpdateSchema = z.object({
  lastName: requiredText('Фамилия', 2, 100).optional(),
  firstName: requiredText('Имя', 2, 100).optional(),
  patronymic: z.string().trim().max(100).nullable().optional(),
  phone: phoneSchema.optional(),
  currentPassword: z.string().max(72).optional(),
  newPassword: z.string().min(6, 'Новый пароль: минимум 6 символов').max(72).optional(),
}).superRefine((data, ctx) => {
  if (data.newPassword && !data.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentPassword'],
      message: 'Для смены пароля укажите текущий пароль',
    });
  }
});

// ---------- Events ----------

const eventBaseSchema = z.object({
  name: requiredText('Название', 3, 200),
  organizerId: idSchema,
  placeId: idSchema,
  tagId: idSchema,
  date: dateSchema,
  time: timeSchema,
  description: requiredText('Описание', 10, 5000),
  category: requiredText('Категория', 2, 100),
  imageUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
  price: z.coerce
    .number()
    .int('Цена должна быть целым числом')
    .min(0, 'Цена не может быть отрицательной')
    .max(1_000_000, 'Слишком большая цена'),
  status: z.nativeEnum(EventStatus).optional(),
});

export const eventCreateSchema = eventBaseSchema.superRefine((data, ctx) => {
  if (data.date < startOfTodayUtc()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['date'],
      message: 'Дата мероприятия не может быть в прошлом',
    });
  }
});

export const eventUpdateSchema = eventBaseSchema.partial();

export const eventsQuerySchema = z.object({
  category: optionalText(100),
  city: optionalText(100),
  tagId: idSchema.optional(),
  search: optionalText(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  sort: z.enum(['date_asc', 'date_desc', 'price_asc', 'price_desc']).default('date_asc'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type EventsQuery = z.infer<typeof eventsQuerySchema>;

export const adminEventsQuerySchema = eventsQuerySchema.extend({
  status: z.nativeEnum(EventStatus).optional(),
});

export type AdminEventsQuery = z.infer<typeof adminEventsQuerySchema>;

export const eventStatusSchema = z.object({
  status: z.nativeEnum(EventStatus),
});

// ---------- Tickets ----------

export const buyTicketSchema = z.object({
  eventId: idSchema,
  seatNumber: z.coerce.number().int().min(1, 'Некорректный номер места').max(100_000),
  promoId: idSchema.optional(),
  promoCode: z.string().trim().max(50).optional(),
});

export const ticketQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'USED', 'CANCELLED']).optional(),
});

export const promocodeValidateSchema = z.object({
  code: z.string().trim().min(1, 'Введите промокод').max(50),
});

// ---------- Reviews ----------

export const reviewCreateSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Оценка от 1 до 5').max(5, 'Оценка от 1 до 5'),
  text: requiredText('Текст отзыва', 3, 1000),
});

// ---------- Admin dictionaries ----------

export const placeCreateSchema = z.object({
  city: requiredText('Город', 2, 100),
  name: requiredText('Название места', 2, 150),
  address: requiredText('Адрес', 3, 255),
  capacity: z.coerce.number().int().min(1, 'Вместимость должна быть больше нуля').max(1_000_000),
});

export const placeUpdateSchema = placeCreateSchema.partial();

export const organizerCreateSchema = z.object({
  name: requiredText('Название организатора', 2, 150),
  contactPerson: requiredText('Контактное лицо', 2, 150),
  phone: phoneSchema,
});

export const organizerUpdateSchema = organizerCreateSchema.partial();

export const tagCreateSchema = z.object({
  name: requiredText('Название тега', 2, 100),
  type: requiredText('Тип тега', 2, 100),
});

export const tagUpdateSchema = tagCreateSchema.partial();

export const giftCreateSchema = z.object({
  name: requiredText('Название подарка', 2, 150),
  description: requiredText('Описание', 3, 2000),
  type: requiredText('Тип подарка', 2, 100),
  status: z.nativeEnum(GiftStatus).optional(),
});

export const giftUpdateSchema = giftCreateSchema.partial();

export const promocodeCreateSchema = z.object({
  giftId: idSchema,
  code: requiredText('Промокод', 3, 50).transform((value) => value.toUpperCase()),
  status: z.nativeEnum(PromocodeStatus).optional(),
  discount: z.coerce.number().int().min(0).max(100).default(0),
});

export const promocodeUpdateSchema = z.object({
  giftId: idSchema.optional(),
  code: z.string().trim().min(3).max(50).transform((value) => value.toUpperCase()).optional(),
  status: z.nativeEnum(PromocodeStatus).optional(),
  discount: z.coerce.number().int().min(0).max(100).optional(),
});

// ---------- Admin users ----------

export const adminUsersQuerySchema = z.object({
  search: optionalText(200),
  role: z.enum(['USER', 'ORGANIZER', 'ADMIN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export const banUserSchema = z.object({
  isBanned: z.boolean(),
});

export const userRoleSchema = z.object({
  role: z.enum(['USER', 'ORGANIZER', 'ADMIN']),
});
