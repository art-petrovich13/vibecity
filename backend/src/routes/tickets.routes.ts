import { Router } from 'express';
import * as ticketsController from '../controllers/tickets.controller';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { buyTicketSchema } from '../validators/schemas';

const router = Router();

router.post('/buy', authMiddleware, validateBody(buyTicketSchema), asyncHandler(ticketsController.buyTicket));
router.get('/my', authMiddleware, asyncHandler(ticketsController.myTickets));
router.get('/:id', authMiddleware, asyncHandler(ticketsController.getTicket));

export default router;
