import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export const publicUserSelect = {
  id: true,
  lastName: true,
  firstName: true,
  patronymic: true,
  phone: true,
  email: true,
  role: true,
  isBanned: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  patronymic: true,
};

export const eventInclude = {
  organizer: true,
  place: true,
  tag: true,
} satisfies Prisma.EventInclude;

export type EventWithRelations = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

export interface SeatsInfo {
  capacity: number;
  sold: number;
  available: number;
}

export const getSeatsInfo = async (eventId: number): Promise<SeatsInfo> => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      place: { select: { capacity: true } },
      _count: { select: { tickets: { where: { status: 'ACTIVE' } } } },
    },
  });

  if (!event) {
    return { capacity: 0, sold: 0, available: 0 };
  }

  const capacity = event.place.capacity;
  const sold = event._count.tickets;

  return { capacity, sold, available: Math.max(capacity - sold, 0) };
};

export const getRating = (ratings: number[]): { rating: number | null; reviewsCount: number } => {
  if (ratings.length === 0) return { rating: null, reviewsCount: 0 };
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  return {
    rating: Math.round((sum / ratings.length) * 10) / 10,
    reviewsCount: ratings.length,
  };
};
