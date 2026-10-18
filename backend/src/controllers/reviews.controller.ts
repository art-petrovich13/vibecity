import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../utils/httpError';
import { authorSelect } from '../utils/selects';
import { parseId } from '../middleware/validate';

export const listReviews = async (req: Request, res: Response) => {
  const eventId = parseId(req.params.id);

  const reviews = await prisma.review.findMany({
    where: { eventId },
    include: { user: { select: authorSelect } },
    orderBy: { date: 'desc' },
  });

  res.json({ items: reviews });
};

export const createReview = async (req: Request, res: Response) => {
  const eventId = parseId(req.params.id);
  const { rating, text } = req.body;

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  const ticket = await prisma.ticket.findFirst({
    where: { eventId, userId: req.user!.id, status: 'ACTIVE' },
    select: { id: true },
  });

  if (!ticket) {
    throw new HttpError(403, 'Оставить отзыв можно только после покупки билета на мероприятие');
  }

  const existing = await prisma.review.findUnique({
    where: { userId_eventId: { userId: req.user!.id, eventId } },
    select: { id: true },
  });

  if (existing) {
    throw new HttpError(409, 'Вы уже оставили отзыв на это мероприятие');
  }

  const review = await prisma.review.create({
    data: {
      userId: req.user!.id,
      eventId,
      rating,
      text,
    },
    include: { user: { select: authorSelect } },
  });

  res.status(201).json({ review });
};

export const deleteReview = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    throw new HttpError(404, 'Отзыв не найден');
  }

  if (review.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new HttpError(403, 'Можно удалять только свои отзывы');
  }

  await prisma.review.delete({ where: { id } });

  res.json({ message: 'Отзыв удалён' });
};
