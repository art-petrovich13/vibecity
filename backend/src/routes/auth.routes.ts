import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { loginSchema, profileUpdateSchema, registerSchema } from '../validators/schemas';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));
router.put(
  '/profile',
  authMiddleware,
  validateBody(profileUpdateSchema),
  asyncHandler(authController.updateProfile),
);

export default router;
