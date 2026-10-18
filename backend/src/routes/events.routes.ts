import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import * as reviewsController from '../controllers/reviews.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { eventCreateSchema, eventUpdateSchema, reviewCreateSchema } from '../validators/schemas';

const router = Router();

router.get('/', asyncHandler(eventsController.listEvents));
router.get('/mine', authMiddleware, asyncHandler(eventsController.myEvents));
router.post(
  '/',
  authMiddleware,
  validateBody(eventCreateSchema),
  asyncHandler(eventsController.createEvent),
);

router.get('/:id', optionalAuth, asyncHandler(eventsController.getEvent));
router.put(
  '/:id',
  authMiddleware,
  validateBody(eventUpdateSchema),
  asyncHandler(eventsController.updateEvent),
);
router.delete('/:id', authMiddleware, asyncHandler(eventsController.deleteEvent));

router.get('/:id/seats', asyncHandler(eventsController.getEventSeats));

router.get('/:id/reviews', asyncHandler(reviewsController.listReviews));
router.post(
  '/:id/reviews',
  authMiddleware,
  validateBody(reviewCreateSchema),
  asyncHandler(reviewsController.createReview),
);

export default router;
