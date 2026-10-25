export type Role = 'USER' | 'ADMIN';
export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED';
export type PromocodeStatus = 'ACTIVE' | 'USED' | 'EXPIRED';
export type GiftStatus = 'AVAILABLE' | 'RESERVED' | 'GIVEN';

export interface User {
  id: number;
  lastName: string;
  firstName: string;
  patronymic: string | null;
  phone: string;
  email: string;
  role: Role;
  isBanned: boolean;
  createdAt: string;
}

export interface Author {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string | null;
}

export interface Place {
  id: number;
  city: string;
  name: string;
  address: string;
  capacity: number;
  _count?: { events: number };
}

export interface Organizer {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  _count?: { events: number };
}

export interface Tag {
  id: number;
  name: string;
  type: string;
  _count?: { events: number };
}

export interface Gift {
  id: number;
  name: string;
  description: string;
  type: string;
  status: GiftStatus;
  _count?: { promocodes: number };
}

export interface Promocode {
  id: number;
  giftId: number;
  code: string;
  status: PromocodeStatus;
  discount: number;
  gift?: Gift;
  _count?: { tickets: number };
}

export interface Review {
  id: number;
  userId: number;
  eventId: number;
  text: string;
  rating: number;
  date: string;
  user: Author;
}

export interface Seats {
  capacity: number;
  sold: number;
  available: number;
}

export interface Event {
  id: number;
  organizerId: number;
  placeId: number;
  tagId: number;
  createdById: number | null;
  name: string;
  date: string;
  time: string;
  description: string;
  category: string;
  imageUrl: string | null;
  price: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  organizer: Organizer;
  place: Place;
  tag: Tag;
  createdBy?: { id: number; firstName: string; lastName: string; email: string } | null;
  reviews?: Review[];
  rating?: number | null;
  reviewsCount?: number;
  seats?: Seats;
}

export interface TicketBuyer {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  email: string;
  phone: string;
}

export interface Ticket {
  id: number;
  userId: number;
  eventId: number;
  promoId: number | null;
  seatNumber: number;
  price: number;
  status: TicketStatus;
  qrCode: string;
  createdAt: string;
  event: Event;
  promo: Promocode | null;
}

export interface ScannerTicket extends Ticket {
  user: TicketBuyer;
}

export interface Catalog {
  places: Place[];
  organizers: Organizer[];
  tags: Tag[];
  categories: string[];
  cities: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  users: number;
  events: number;
  tickets: number;
  reviews: number;
  pendingEvents: number;
  revenue: number;
  recentEvents: Event[];
}

export interface TicketSeatsResponse {
  seats: Seats;
  takenSeats: number[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PlaceInput {
  city: string;
  name: string;
  address: string;
  capacity: number;
}

export interface OrganizerInput {
  name: string;
  contactPerson: string;
  phone: string;
}

export interface TagInput {
  name: string;
  type: string;
}

export interface GiftInput {
  name: string;
  description: string;
  type: string;
  status?: GiftStatus;
}

export interface PromocodeInput {
  giftId: number;
  code: string;
  status?: PromocodeStatus;
  discount: number;
}
