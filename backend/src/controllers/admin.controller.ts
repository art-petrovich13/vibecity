import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { HttpError } from '../utils/httpError';
import { eventInclude, getRating, publicUserSelect } from '../utils/selects';
import { parseId, parseQuery } from '../middleware/validate';
import {
  adminEventsQuerySchema,
  adminUsersQuerySchema,
  type AdminEventsQuery,
  type AdminUsersQuery,
} from '../validators/schemas';
import { endOfDayUtc } from '../utils/date';

// ---------- Обзор ----------

export const getStats = async (_req: Request, res: Response) => {
  const [users, events, tickets, reviews, pendingEvents, revenue, recentEvents] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.event.count(),
      prisma.ticket.count({ where: { status: 'ACTIVE' } }),
      prisma.review.count(),
      prisma.event.count({ where: { status: 'PENDING' } }),
      prisma.ticket.aggregate({ where: { status: 'ACTIVE' }, _sum: { price: true } }),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { place: true, organizer: true },
      }),
    ]);

  res.json({
    users,
    events,
    tickets,
    reviews,
    pendingEvents,
    revenue: revenue._sum.price ?? 0,
    recentEvents,
  });
};

// ---------- Пользователи ----------

export const listUsers = async (req: Request, res: Response) => {
  const query = parseQuery<AdminUsersQuery>(adminUsersQuerySchema, req.query);

  const where: Prisma.UserWhereInput = {};

  if (query.role) where.role = query.role;
  if (query.search) {
    where.OR = [
      { lastName: { contains: query.search } },
      { firstName: { contains: query.search } },
      { email: { contains: query.search } },
      { phone: { contains: query.search } },
    ];
  }

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  res.json({
    items: users,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  });
};

export const updateUserRole = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { role } = req.body;

  if (id === req.user!.id) {
    throw new HttpError(400, 'Нельзя изменить роль собственного аккаунта');
  }

  const account = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!account) {
    throw new HttpError(404, 'Пользователь не найден');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: publicUserSelect,
  });

  res.json({ user });
};

export const banUser = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { isBanned } = req.body;

  if (id === req.user!.id) {
    throw new HttpError(400, 'Нельзя заблокировать собственный аккаунт');
  }

  const account = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!account) {
    throw new HttpError(404, 'Пользователь не найден');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isBanned },
    select: publicUserSelect,
  });

  res.json({ user });
};

// ---------- Мероприятия ----------

const adminEventInclude = {
  ...eventInclude,
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  reviews: { select: { rating: true } },
  _count: { select: { tickets: { where: { status: 'ACTIVE' as const } } } },
} satisfies Prisma.EventInclude;

const toAdminEvent = (event: Prisma.EventGetPayload<{ include: typeof adminEventInclude }>) => {
  const { reviews, _count, ...rest } = event;
  const ratingInfo = getRating(reviews.map((review) => review.rating));

  return {
    ...rest,
    rating: ratingInfo.rating,
    reviewsCount: ratingInfo.reviewsCount,
    seats: {
      capacity: event.place.capacity,
      sold: _count.tickets,
      available: Math.max(event.place.capacity - _count.tickets, 0),
    },
  };
};

export const listEvents = async (req: Request, res: Response) => {
  const query = parseQuery<AdminEventsQuery>(adminEventsQuerySchema, req.query);

  const where: Prisma.EventWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;
  if (query.city) where.place = { city: query.city };
  if (query.tagId) where.tagId = query.tagId;

  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { organizer: { name: { contains: query.search } } },
      { place: { name: { contains: query.search } } },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    where.date = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: endOfDayUtc(query.dateTo) } : {}),
    };
  }

  const orderBy: Prisma.EventOrderByWithRelationInput[] =
    query.sort === 'date_desc'
      ? [{ date: 'desc' }, { time: 'desc' }]
      : [{ date: 'asc' }, { time: 'asc' }];

  const [total, events] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: adminEventInclude,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  res.json({
    items: events.map(toAdminEvent),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  });
};

export const updateEventStatus = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { status } = req.body;

  const existing = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  const event = await prisma.event.update({
    where: { id },
    data: { status },
    include: adminEventInclude,
  });

  res.json({ event: toAdminEvent(event) });
};

export const listReviews = async (_req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: publicUserSelect },
      event: { select: { id: true, name: true, date: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json({ items: reviews });
};

// ---------- Справочники ----------

export const listPlaces = async (_req: Request, res: Response) => {
  const places = await prisma.place.findMany({
    include: { _count: { select: { events: true } } },
    orderBy: [{ city: 'asc' }, { name: 'asc' }],
  });
  res.json({ items: places });
};

export const createPlace = async (req: Request, res: Response) => {
  const place = await prisma.place.create({ data: req.body });
  res.status(201).json({ item: place });
};

export const updatePlace = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const place = await prisma.place.update({ where: { id }, data: req.body });
  res.json({ item: place });
};

export const deletePlace = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await prisma.place.delete({ where: { id } });
  res.json({ message: 'Место удалено' });
};

export const listOrganizers = async (_req: Request, res: Response) => {
  const organizers = await prisma.organizer.findMany({
    include: { _count: { select: { events: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ items: organizers });
};

export const createOrganizer = async (req: Request, res: Response) => {
  const organizer = await prisma.organizer.create({ data: req.body });
  res.status(201).json({ item: organizer });
};

export const updateOrganizer = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const organizer = await prisma.organizer.update({ where: { id }, data: req.body });
  res.json({ item: organizer });
};

export const deleteOrganizer = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await prisma.organizer.delete({ where: { id } });
  res.json({ message: 'Организатор удалён' });
};

export const listTags = async (_req: Request, res: Response) => {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { events: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ items: tags });
};

export const createTag = async (req: Request, res: Response) => {
  const tag = await prisma.tag.create({ data: req.body });
  res.status(201).json({ item: tag });
};

export const updateTag = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const tag = await prisma.tag.update({ where: { id }, data: req.body });
  res.json({ item: tag });
};

export const deleteTag = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await prisma.tag.delete({ where: { id } });
  res.json({ message: 'Тег удалён' });
};

export const listGifts = async (_req: Request, res: Response) => {
  const gifts = await prisma.gift.findMany({
    include: { _count: { select: { promocodes: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ items: gifts });
};

export const createGift = async (req: Request, res: Response) => {
  const gift = await prisma.gift.create({ data: req.body });
  res.status(201).json({ item: gift });
};

export const updateGift = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const gift = await prisma.gift.update({ where: { id }, data: req.body });
  res.json({ item: gift });
};

export const deleteGift = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await prisma.gift.delete({ where: { id } });
  res.json({ message: 'Подарок удалён' });
};

export const listPromocodes = async (_req: Request, res: Response) => {
  const promocodes = await prisma.promocode.findMany({
    include: { gift: true, _count: { select: { tickets: true } } },
    orderBy: { id: 'desc' },
  });
  res.json({ items: promocodes });
};

export const createPromocode = async (req: Request, res: Response) => {
  const { giftId } = req.body;
  const gift = await prisma.gift.findUnique({ where: { id: giftId }, select: { id: true } });
  if (!gift) {
    throw new HttpError(400, 'Подарок не найден');
  }

  const promocode = await prisma.promocode.create({ data: req.body, include: { gift: true } });
  res.status(201).json({ item: promocode });
};

export const updatePromocode = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  if (req.body.giftId) {
    const gift = await prisma.gift.findUnique({
      where: { id: req.body.giftId },
      select: { id: true },
    });
    if (!gift) {
      throw new HttpError(400, 'Подарок не найден');
    }
  }

  const promocode = await prisma.promocode.update({
    where: { id },
    data: req.body,
    include: { gift: true },
  });
  res.json({ item: promocode });
};

export const deletePromocode = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  await prisma.promocode.delete({ where: { id } });
  res.json({ message: 'Промокод удалён' });
};
