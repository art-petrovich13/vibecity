import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from '../utils/httpError';

export const validateBody = (schema: ZodTypeAny): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new HttpError(400, 'Некорректные данные', result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
};

export const parseQuery = <T>(schema: ZodTypeAny, query: unknown): T => {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new HttpError(400, 'Некорректные параметры запроса', result.error.flatten());
  }
  return result.data as T;
};

export const parseId = (value: string | undefined): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Некорректный идентификатор');
  }
  return id;
};
