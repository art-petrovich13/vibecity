const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const toDate = (value: string | Date): Date => (value instanceof Date ? value : new Date(value));

export const formatDate = (value: string | Date): string => {
  const date = toDate(value);
  return `${date.getUTCDate()} ${MONTHS_GENITIVE[date.getUTCMonth()]}`;
};

export const formatDateWithYear = (value: string | Date): string => {
  const date = toDate(value);
  return `${date.getUTCDate()} ${MONTHS_GENITIVE[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export const formatDateShort = (value: string | Date): string => {
  const date = toDate(value);
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]}`;
};

export const formatWeekday = (value: string | Date): string => {
  const date = toDate(value);
  return WEEKDAYS_SHORT[date.getUTCDay()];
};

export const formatEventDateTime = (date: string | Date, time: string): string =>
  `${formatDate(date)}, ${formatWeekday(date)} · ${time}`;

export const formatPrice = (price: number): string => {
  if (price <= 0) return 'Бесплатно';
  return `${new Intl.NumberFormat('ru-RU').format(price)} ₽`;
};

export const formatDateTime = (value: string | Date): string => {
  const date = toDate(value);
  return `${formatDateWithYear(date)}, ${String(date.getUTCHours()).padStart(2, '0')}:${String(
    date.getUTCMinutes(),
  ).padStart(2, '0')}`;
};

export const pluralize = (count: number, one: string, few: string, many: string): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};

export const fullName = (person?: {
  lastName?: string | null;
  firstName?: string | null;
  patronymic?: string | null;
} | null): string => {
  if (!person) return '';
  return [person.lastName, person.firstName, person.patronymic].filter(Boolean).join(' ');
};

export const shortName = (person?: {
  lastName?: string | null;
  firstName?: string | null;
  patronymic?: string | null;
} | null): string => {
  if (!person) return '';
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
};

export const toDateInputValue = (value: string | Date): string => {
  const date = toDate(value);
  return date.toISOString().slice(0, 10);
};
