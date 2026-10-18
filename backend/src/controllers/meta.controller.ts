import type { Request, Response } from 'express';
import { prisma } from '../prisma';

/**
 * Публичный справочник: используется фильтрами на главной странице
 * и выпадающими списками в кабинете организатора.
 */
export const getCatalog = async (_req: Request, res: Response) => {
  const [places, organizers, tags, categories, cities] = await Promise.all([
    prisma.place.findMany({ orderBy: [{ city: 'asc' }, { name: 'asc' }] }),
    prisma.organizer.findMany({ orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    prisma.event.findMany({
      where: { status: 'APPROVED' },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    }),
    prisma.place.findMany({
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
    }),
  ]);

  res.json({
    places,
    organizers,
    tags,
    categories: categories.map((item) => item.category),
    cities: cities.map((item) => item.city),
  });
};
