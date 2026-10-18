import { api } from './client';
import type {
  AdminStats,
  AuthResponse,
  Catalog,
  Event,
  EventStatus,
  Gift,
  GiftInput,
  Organizer,
  OrganizerInput,
  Paginated,
  Place,
  PlaceInput,
  Promocode,
  PromocodeInput,
  Review,
  Role,
  Tag,
  TagInput,
  Ticket,
  TicketSeatsResponse,
  TicketStatus,
  User,
} from '../types';

export interface EventFilters {
  category?: string;
  city?: string;
  tagId?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface EventInput {
  name: string;
  organizerId: number;
  placeId: number;
  tagId: number;
  date: string;
  time: string;
  description: string;
  category: string;
  imageUrl?: string | null;
  price: number;
  status?: EventStatus;
}

export const authApi = {
  register: (data: {
    lastName: string;
    firstName: string;
    patronymic?: string;
    phone: string;
    email: string;
    password: string;
  }) => api.post<AuthResponse>('/auth/register', data).then((response) => response.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((response) => response.data),

  me: () => api.get<{ user: User }>('/auth/me').then((response) => response.data.user),

  updateProfile: (data: {
    lastName?: string;
    firstName?: string;
    patronymic?: string | null;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => api.put<{ user: User }>('/auth/profile', data).then((response) => response.data.user),
};

export const metaApi = {
  catalog: () => api.get<Catalog>('/meta/catalog').then((response) => response.data),
};

export const eventsApi = {
  list: (params: EventFilters = {}) =>
    api.get<Paginated<Event>>('/events', { params }).then((response) => response.data),

  get: (id: number) =>
    api.get<{ event: Event }>(`/events/${id}`).then((response) => response.data.event),

  seats: (id: number) =>
    api.get<TicketSeatsResponse>(`/events/${id}/seats`).then((response) => response.data),

  mine: () => api.get<{ items: Event[] }>('/events/mine').then((response) => response.data.items),

  create: (data: EventInput) =>
    api.post<{ event: Event }>('/events', data).then((response) => response.data.event),

  update: (id: number, data: Partial<EventInput>) =>
    api.put<{ event: Event }>(`/events/${id}`, data).then((response) => response.data.event),

  remove: (id: number) => api.delete(`/events/${id}`).then(() => undefined),

  reviews: (id: number) =>
    api.get<{ items: Review[] }>(`/events/${id}/reviews`).then((response) => response.data.items),

  createReview: (id: number, data: { rating: number; text: string }) =>
    api.post<{ review: Review }>(`/events/${id}/reviews`, data).then((response) => response.data.review),
};

export const ticketsApi = {
  buy: (data: { eventId: number; seatNumber: number; promoCode?: string }) =>
    api.post<{ ticket: Ticket }>('/tickets/buy', data).then((response) => response.data.ticket),

  my: (status?: TicketStatus) =>
    api.get<{ items: Ticket[] }>('/tickets/my', { params: { status } }).then((response) => response.data.items),
};

export const reviewsApi = {
  remove: (id: number) => api.delete(`/reviews/${id}`).then(() => undefined),
};

export const promocodesApi = {
  validate: (code: string) =>
    api
      .post<{ promocode: { code: string; discount: number; gift: string } }>('/promocodes/validate', {
        code,
      })
      .then((response) => response.data.promocode),
};

export interface AdminEventsFilters extends EventFilters {
  status?: EventStatus;
}

export interface AdminUsersFilters {
  search?: string;
  role?: Role;
  page?: number;
  limit?: number;
}

export type AdminReview = Review & {
  user: User;
  event: { id: number; name: string; date: string };
};

const createCrud = <T, TInput>(path: string) => ({
  list: (): Promise<T[]> =>
    api.get<{ items: T[] }>(`/admin/${path}`).then((response) => response.data.items),
  create: (data: TInput): Promise<T> =>
    api.post<{ item: T }>(`/admin/${path}`, data).then((response) => response.data.item),
  update: (id: number, data: Partial<TInput>): Promise<T> =>
    api.put<{ item: T }>(`/admin/${path}/${id}`, data).then((response) => response.data.item),
  remove: (id: number): Promise<void> =>
    api.delete(`/admin/${path}/${id}`).then(() => undefined),
});

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats').then((response) => response.data),

  users: (params: AdminUsersFilters = {}) =>
    api.get<Paginated<User>>('/admin/users', { params }).then((response) => response.data),

  banUser: (id: number, isBanned: boolean) =>
    api.patch<{ user: User }>(`/admin/users/${id}/ban`, { isBanned }).then((response) => response.data.user),

  events: (params: AdminEventsFilters = {}) =>
    api.get<Paginated<Event>>('/admin/events', { params }).then((response) => response.data),

  updateEventStatus: (id: number, status: EventStatus) =>
    api
      .patch<{ event: Event }>(`/admin/events/${id}/status`, { status })
      .then((response) => response.data.event),

  deleteEvent: (id: number) => api.delete(`/admin/events/${id}`).then(() => undefined),

  reviews: () =>
    api.get<{ items: AdminReview[] }>('/admin/reviews').then((response) => response.data.items),

  deleteReview: (id: number) => api.delete(`/admin/reviews/${id}`).then(() => undefined),

  places: createCrud<Place, PlaceInput>('places'),
  organizers: createCrud<Organizer, OrganizerInput>('organizers'),
  tags: createCrud<Tag, TagInput>('tags'),
  gifts: createCrud<Gift, GiftInput>('gifts'),
  promocodes: createCrud<Promocode, PromocodeInput>('promocodes'),
};
