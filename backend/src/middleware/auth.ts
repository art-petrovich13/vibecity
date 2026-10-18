import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../utils/httpError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyToken } from '../utils/jwt';

export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  let payload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    throw new HttpError(401, 'Недействительный или истёкший токен');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, isBanned: true },
  });

  if (!user) {
    throw new HttpError(401, 'Пользователь не найден');
  }

  if (user.isBanned) {
    throw new HttpError(403, 'Аккаунт заблокирован администратором');
  }

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
});

/**
 * Пытается авторизовать пользователя, но не требует токен.
 * Нужен для публичных страниц, которые показывают чуть больше данным автору
 * (например, превью своего мероприятия на модерации).
 */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, isBanned: true },
    });

    if (user && !user.isBanned) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
  } catch {
    // Молча продолжаем как неавторизованный пользователь.
  }

  next();
});

export const adminMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new HttpError(401, 'Требуется авторизация'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new HttpError(403, 'Недостаточно прав'));
  }

  next();
};
