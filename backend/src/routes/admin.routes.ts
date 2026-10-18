import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { deleteEvent } from '../controllers/events.controller';
import { deleteReview } from '../controllers/reviews.controller';
import { adminMiddleware, authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  banUserSchema,
  eventStatusSchema,
  giftCreateSchema,
  giftUpdateSchema,
  organizerCreateSchema,
  organizerUpdateSchema,
  placeCreateSchema,
  placeUpdateSchema,
  promocodeCreateSchema,
  promocodeUpdateSchema,
  tagCreateSchema,
  tagUpdateSchema,
} from '../validators/schemas';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', asyncHandler(adminController.getStats));

// Пользователи
router.get('/users', asyncHandler(adminController.listUsers));
router.patch('/users/:id/ban', validateBody(banUserSchema), asyncHandler(adminController.banUser));

// Мероприятия и модерация
router.get('/events', asyncHandler(adminController.listEvents));
router.patch(
  '/events/:id/status',
  validateBody(eventStatusSchema),
  asyncHandler(adminController.updateEventStatus),
);
router.delete('/events/:id', asyncHandler(deleteEvent));

// Отзывы
router.get('/reviews', asyncHandler(adminController.listReviews));
router.delete('/reviews/:id', asyncHandler(deleteReview));

// Справочник: места
router.get('/places', asyncHandler(adminController.listPlaces));
router.post('/places', validateBody(placeCreateSchema), asyncHandler(adminController.createPlace));
router.put('/places/:id', validateBody(placeUpdateSchema), asyncHandler(adminController.updatePlace));
router.delete('/places/:id', asyncHandler(adminController.deletePlace));

// Справочник: организаторы
router.get('/organizers', asyncHandler(adminController.listOrganizers));
router.post(
  '/organizers',
  validateBody(organizerCreateSchema),
  asyncHandler(adminController.createOrganizer),
);
router.put(
  '/organizers/:id',
  validateBody(organizerUpdateSchema),
  asyncHandler(adminController.updateOrganizer),
);
router.delete('/organizers/:id', asyncHandler(adminController.deleteOrganizer));

// Справочник: теги
router.get('/tags', asyncHandler(adminController.listTags));
router.post('/tags', validateBody(tagCreateSchema), asyncHandler(adminController.createTag));
router.put('/tags/:id', validateBody(tagUpdateSchema), asyncHandler(adminController.updateTag));
router.delete('/tags/:id', asyncHandler(adminController.deleteTag));

// Справочник: подарки
router.get('/gifts', asyncHandler(adminController.listGifts));
router.post('/gifts', validateBody(giftCreateSchema), asyncHandler(adminController.createGift));
router.put('/gifts/:id', validateBody(giftUpdateSchema), asyncHandler(adminController.updateGift));
router.delete('/gifts/:id', asyncHandler(adminController.deleteGift));

// Справочник: промокоды
router.get('/promocodes', asyncHandler(adminController.listPromocodes));
router.post(
  '/promocodes',
  validateBody(promocodeCreateSchema),
  asyncHandler(adminController.createPromocode),
);
router.put(
  '/promocodes/:id',
  validateBody(promocodeUpdateSchema),
  asyncHandler(adminController.updatePromocode),
);
router.delete('/promocodes/:id', asyncHandler(adminController.deletePromocode));

export default router;
