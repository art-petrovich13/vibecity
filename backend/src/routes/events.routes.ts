import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import * as reviewsController from '../controllers/reviews.controller';
import { authMiddleware, optionalAuth, organizerMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { eventCreateSchema, eventUpdateSchema, reviewCreateSchema } from '../validators/schemas';

const router = Router();

router.get('/', asyncHandler(eventsController.listEvents));
router.get('/mine', authMiddleware, organizerMiddleware, asyncHandler(eventsController.myEvents));
router.post(
  '/',
  authMiddleware,
  organizerMiddleware,
  validateBody(eventCreateSchema),
  asyncHandler(eventsController.createEvent),
);

router.get('/:id', optionalAuth, asyncHandler(eventsController.getEvent));
router.put(
  '/:id',
  authMiddleware,
  organizerMiddleware,
  validateBody(eventUpdateSchema),
  asyncHandler(eventsController.updateEvent),
);
router.delete('/:id', authMiddleware, organizerMiddleware, asyncHandler(eventsController.deleteEvent));

router.get('/:id/seats', asyncHandler(eventsController.getEventSeats));

router.get('/:id/reviews', asyncHandler(reviewsController.listReviews));
router.post(
  '/:id/reviews',
  authMiddleware,
  validateBody(reviewCreateSchema),
  asyncHandler(reviewsController.createReview),
);

export default router;
