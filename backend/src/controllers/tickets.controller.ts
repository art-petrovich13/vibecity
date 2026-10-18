import crypto from 'crypto';
import type { Request, Response } from 'express';
import type { Promocode } from '@prisma/client';
import { prisma } from '../prisma';
import { HttpError } from '../utils/httpError';
import { startOfTodayUtc } from '../utils/date';
import { parseId, parseQuery } from '../middleware/validate';
import { ticketQuerySchema } from '../validators/schemas';

const ticketInclude = {
  event: {
    include: {
      place: true,
      organizer: true,
      tag: true,
    },
  },
  promo: {
    include: { gift: true },
  },
} as const;

const findPromocode = async (promoId?: number, promoCode?: string): Promise<Promocode | null> => {
  if (promoId) {
    return prisma.promocode.findUnique({ where: { id: promoId } });
  }

  if (promoCode && promoCode.trim().length > 0) {
    return prisma.promocode.findUnique({
      where: { code: promoCode.trim().toUpperCase() },
    });
  }

  return null;
};

export const buyTicket = async (req: Request, res: Response) => {
  const { eventId, seatNumber, promoId, promoCode } = req.body;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { place: true },
  });

  if (!event) {
    throw new HttpError(404, 'Мероприятие не найдено');
  }

  if (event.status !== 'APPROVED') {
    throw new HttpError(400, 'Мероприятие ещё не прошло модерацию');
  }

  if (event.date < startOfTodayUtc()) {
    throw new HttpError(400, 'Мероприятие уже прошло');
  }

  if (seatNumber > event.place.capacity) {
    throw new HttpError(
      400,
      `Вместимость площадки — ${event.place.capacity} мест. Выберите место в этом диапазоне`,
    );
  }

  const seatTaken = await prisma.ticket.findFirst({
    where: { eventId, seatNumber, status: 'ACTIVE' },
    select: { id: true },
  });

  if (seatTaken) {
    throw new HttpError(409, 'Это место уже занято, выберите другое');
  }

  const promo = await findPromocode(promoId, promoCode);
  if (promo && promo.status !== 'ACTIVE') {
    throw new HttpError(400, 'Промокод недействителен или уже использован');
  }

  if (!promo && (promoId || (promoCode && promoCode.trim().length > 0))) {
    throw new HttpError(400, 'Промокод не найден');
  }

  const price = promo
    ? Math.max(0, Math.round(event.price * (1 - promo.discount / 100)))
    : event.price;

  const ticket = await prisma.$transaction(async (tx) => {
    if (promo) {
      const consumed = await tx.promocode.updateMany({
        where: { id: promo.id, status: 'ACTIVE' },
        data: { status: 'USED' },
      });

      if (consumed.count === 0) {
        throw new HttpError(400, 'Промокод уже использован');
      }
    }

    return tx.ticket.create({
      data: {
        userId: req.user!.id,
        eventId,
        promoId: promo ? promo.id : null,
        seatNumber,
        price,
        status: 'ACTIVE',
        qrCode: crypto.randomUUID(),
      },
      include: ticketInclude,
    });
  });

  res.status(201).json({ ticket });
};

export const myTickets = async (req: Request, res: Response) => {
  const query = parseQuery<{ status?: 'ACTIVE' | 'USED' | 'CANCELLED' }>(
    ticketQuerySchema,
    req.query,
  );

  const tickets = await prisma.ticket.findMany({
    where: {
      userId: req.user!.id,
      ...(query.status ? { status: query.status } : {}),
    },
    include: ticketInclude,
    orderBy: [{ event: { date: 'desc' } }, { createdAt: 'desc' }],
  });

  res.json({ items: tickets });
};

/**
 * Проверка промокода до покупки — чтобы показать скидку и итоговую цену.
 */
export const validatePromocode = async (req: Request, res: Response) => {
  const code = String(req.body.code ?? '').trim().toUpperCase();

  const promo = await prisma.promocode.findUnique({
    where: { code },
    include: { gift: true },
  });

  if (!promo) {
    throw new HttpError(404, 'Промокод не найден');
  }

  if (promo.status !== 'ACTIVE') {
    throw new HttpError(400, 'Промокод недействителен или уже использован');
  }

  res.json({
    promocode: {
      code: promo.code,
      discount: promo.discount,
      gift: promo.gift.name,
    },
  });
};

export const getTicket = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new HttpError(404, 'Билет не найден');
  }

  if (ticket.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new HttpError(403, 'Нет доступа к этому билету');
  }

  res.json({ ticket });
};
