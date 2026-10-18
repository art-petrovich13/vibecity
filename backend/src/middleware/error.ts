import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Маршрут ${req.method} ${req.originalUrl} не найден` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Некорректные данные',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? (err.meta?.target as string[]).join(', ') : '';
      res.status(409).json({
        message: target.includes('seatNumber')
          ? 'Это место уже занято, выберите другое'
          : 'Запись с такими данными уже существует',
        ...(target ? { details: { target } } : {}),
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Запись не найдена' });
      return;
    }

    if (err.code === 'P2003') {
      res.status(409).json({ message: 'Нельзя удалить запись: с ней связаны другие данные' });
      return;
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'Некорректный JSON в теле запроса' });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('[vibecity] Unhandled error:', err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
};
