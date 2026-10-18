import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { HttpError } from '../utils/httpError';
import { eventInclude, getRating } from '../utils/selects';
import { endOfDayUtc, startOfTodayUtc } from '../utils/date';
import { parseId, parseQuery } from '../middleware/validate';
import { eventsQuerySchema, type EventsQuery } from '../validators/schemas';

const listInclude = {
  ...eventInclude,
  reviews: { select: { rating: true } },
  _count: { select: { tickets: { where: { status: 'ACTIVE' as const } } } },
} satisfies Prisma.EventInclude;

const detailInclude = {
  ...eventInclude,
  reviews: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, patronymic: true } },
    },
    orderBy: { date: 'desc' as const },
  },
  _count: { select: { tickets: { where: { status: 'ACTIVE' as const } } } },
} satisfies Prisma.EventInclude;

type ListEvent = Prisma.EventGetPayload<{ include: typeof listInclude }>;
type DetailEvent = Prisma.EventGetPayload<{ include: typeof detailInclude }>;

const buildSeats = (capacity: number, sold: number) => ({
  capacity,
  sold,
  available: Math.max(capacity - sold, 0),
});

const toListItem = (event: ListEvent) => {
  const { reviews, _count, ...rest } = event;
  const ratingInfo = getRating(reviews.map((review) => review.rating));

  return {
    ...rest,
    rating: ratingInfo.rating,
    reviewsCount: ratingInfo.reviewsCount,
    seats: buildSeats(event.place.capacity, _count.tickets),
  };
};

const toDetailItem = (event: DetailEvent) => {
  const { reviews, _count, ...rest } = event;
  const ratingInfo = getRating(reviews.map((review) => review.rating));

  return {
    ...rest,
    reviews,
    rating: ratingInfo.rating,
    reviewsCount: ratingInfo.reviewsCount,
    seats: buildSeats(event.place.capacity, _count.tickets),
  };
};

const buildDateFilter = (query: EventsQuery): Prisma.DateTimeFilter => {
  const filter: Prisma.DateTimeFilter = {};
  filter.gte = query.dateFrom ?? startOfTodayUtc();

  if (query.dateTo) {
    filter.lte = endOfDayUtc(query.dateTo);
  }

  return filter;
};

const buildOrderBy = (sort: EventsQuery['sort']): Prisma.EventOrderByWithRelationInput[] => {
  switch (sort) {
    case 'date_desc':
      return [{ date: 'desc' }, { time: 'desc' }];
    case 'price_asc':
      return [{ price: 'asc' }, { date: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { date: 'asc' }];
    case 'date_asc':
    default:
      return [{ date: 'asc' }, { time: 'asc' }];
  }
};

export const listEvents = async (req: Request, res: Response) => {
  const query = parseQuery<EventsQuery>(eventsQuerySchema, req.query);

  const where: Prisma.EventWhereInput = {
    status: 'APPROVED',
    date: buildDateFilter(query),
  };

  if (query.category) where.category = query.category;
  if (query.city) where.place = { city: query.city };
  if (query.tagId) where.tagId = query.tagId;

  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { description: { contains: query.search } },
      { organizer: { name: { contains: query.search } } },
      { place: { name: { contains: query.search } } },
    ];
  }

  const page = query.page;
  const limit = query.limit;

  const [total, events] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: listInclude,
      orderBy: buildOrderBy(query.sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    items: events.map(toListItem),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const getEvent = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const event = await prisma.event.findUnique({
    where: { id },
    include: detailInclude,
  });

  if (!event) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  const canPreview =
    req.user && (req.user.role === 'ADMIN' || event.createdById === req.user.id);

  if (event.status !== 'APPROVED' && !canPreview) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  res.json({ event: toDetailItem(event) });
};

const assertRelationsExist = async (data: {
  organizerId?: number;
  placeId?: number;
  tagId?: number;
}) => {
  const [organizer, place, tag] = await Promise.all([
    data.organizerId ? prisma.organizer.findUnique({ where: { id: data.organizerId } }) : null,
    data.placeId ? prisma.place.findUnique({ where: { id: data.placeId } }) : null,
    data.tagId ? prisma.tag.findUnique({ where: { id: data.tagId } }) : null,
  ]);

  if (data.organizerId && !organizer) throw new HttpError(400, 'Организатор не найден');
  if (data.placeId && !place) throw new HttpError(400, 'Место проведения не найдено');
  if (data.tagId && !tag) throw new HttpError(400, 'Тег не найден');
};

export const createEvent = async (req: Request, res: Response) => {
  const body = req.body;
  await assertRelationsExist(body);

  const isAdmin = req.user!.role === 'ADMIN';

  const event = await prisma.event.create({
    data: {
      name: body.name,
      organizerId: body.organizerId,
      placeId: body.placeId,
      tagId: body.tagId,
      date: body.date,
      time: body.time,
      description: body.description,
      category: body.category,
      imageUrl: body.imageUrl ?? null,
      price: body.price,
      status: isAdmin ? (body.status ?? 'APPROVED') : 'PENDING',
      createdById: req.user!.id,
    },
    include: {
      ...eventInclude,
      reviews: { select: { rating: true } },
      _count: { select: { tickets: { where: { status: 'ACTIVE' as const } } } },
    },
  });

  res.status(201).json({ event: toListItem(event as ListEvent) });
};

export const updateEvent = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const body = req.body;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  const isAdmin = req.user!.role === 'ADMIN';
  if (!isAdmin && existing.createdById !== req.user!.id) {
    throw new HttpError(403, 'Можно редактировать только свои мероприятия');
  }

  await assertRelationsExist(body);

  const data: Prisma.EventUpdateInput = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.date !== undefined ? { date: body.date } : {}),
    ...(body.time !== undefined ? { time: body.time } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
    ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
    ...(body.price !== undefined ? { price: body.price } : {}),
    ...(body.organizerId !== undefined ? { organizer: { connect: { id: body.organizerId } } } : {}),
    ...(body.placeId !== undefined ? { place: { connect: { id: body.placeId } } } : {}),
    ...(body.tagId !== undefined ? { tag: { connect: { id: body.tagId } } } : {}),
  };

  if (isAdmin && body.status !== undefined) {
    data.status = body.status;
  }

  // Любые правки пользователя требуют повторной модерации.
  if (!isAdmin) {
    data.status = 'PENDING';
  }

  const event = await prisma.event.update({
    where: { id },
    data,
    include: {
      ...eventInclude,
      reviews: { select: { rating: true } },
      _count: { select: { tickets: { where: { status: 'ACTIVE' as const } } } },
    },
  });

  res.json({ event: toListItem(event as ListEvent) });
};

export const deleteEvent = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  if (req.user!.role !== 'ADMIN' && existing.createdById !== req.user!.id) {
    throw new HttpError(403, 'Можно удалять только свои мероприятия');
  }

  await prisma.event.delete({ where: { id } });
  res.json({ message: 'Мероприятие удалено' });
};

export const myEvents = async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: { createdById: req.user!.id },
    include: {
      ...eventInclude,
      reviews: { select: { rating: true } },
      _count: { select: { tickets: { where: { status: 'ACTIVE' as const } } } },
    },
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
  });

  res.json({ items: events.map((event) => toListItem(event as ListEvent)) });
};

export const getEventSeats = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      place: { select: { capacity: true } },
      tickets: { where: { status: 'ACTIVE' }, select: { seatNumber: true } },
    },
  });

  if (!event) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  const takenSeats = event.tickets.map((ticket) => ticket.seatNumber).sort((a, b) => a - b);

  res.json({
    seats: buildSeats(event.place.capacity, takenSeats.length),
    takenSeats,
  });
};
