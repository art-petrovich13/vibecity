import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.delete('/:id', authMiddleware, asyncHandler(reviewsController.deleteReview));

export default router;
