import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { HttpError } from '../utils/httpError';
import { signToken } from '../utils/jwt';
import { publicUserSelect } from '../utils/selects';

const SALT_ROUNDS = 10;

export const register = async (req: Request, res: Response) => {
  const { lastName, firstName, patronymic, phone, email, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true, phone: true },
  });

  if (existing) {
    throw new HttpError(
      409,
      existing.email === email ? 'Пользователь с таким email уже зарегистрирован' : 'Пользователь с таким телефоном уже зарегистрирован',
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      lastName,
      firstName,
      patronymic: patronymic || null,
      phone,
      email,
      password: hashedPassword,
      role: 'USER',
    },
    select: publicUserSelect,
  });

  const token = signToken({ id: user.id, role: user.role });

  res.status(201).json({ token, user });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const account = await prisma.user.findUnique({ where: { email } });

  if (!account) {
    throw new HttpError(401, 'Неверный email или пароль');
  }

  const passwordMatches = await bcrypt.compare(password, account.password);
  if (!passwordMatches) {
    throw new HttpError(401, 'Неверный email или пароль');
  }

  if (account.isBanned) {
    throw new HttpError(403, 'Аккаунт заблокирован администратором');
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: account.id },
    select: publicUserSelect,
  });

  const token = signToken({ id: user.id, role: user.role });

  res.json({ token, user });
};

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: publicUserSelect,
  });

  if (!user) {
    throw new HttpError(404, 'Пользователь не найден');
  }

  res.json({ user });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { lastName, firstName, patronymic, phone, currentPassword, newPassword } = req.body;

  const account = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!account) {
    throw new HttpError(404, 'Пользователь не найден');
  }

  if (phone && phone !== account.phone) {
    const phoneTaken = await prisma.user.findUnique({ where: { phone } });
    if (phoneTaken) {
      throw new HttpError(409, 'Этот телефон уже привязан к другому аккаунту');
    }
  }

  let password: string | undefined;
  if (newPassword) {
    const currentMatches = await bcrypt.compare(currentPassword, account.password);
    if (!currentMatches) {
      throw new HttpError(400, 'Текущий пароль указан неверно');
    }
    password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  const user = await prisma.user.update({
    where: { id: account.id },
    data: {
      ...(lastName !== undefined ? { lastName } : {}),
      ...(firstName !== undefined ? { firstName } : {}),
      ...(patronymic !== undefined ? { patronymic: patronymic || null } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(password !== undefined ? { password } : {}),
    },
    select: publicUserSelect,
  });

  res.json({ user });
};
