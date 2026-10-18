import { Router } from 'express';
import { validatePromocode } from '../controllers/tickets.controller';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { promocodeValidateSchema } from '../validators/schemas';

const router = Router();

router.post('/validate', validateBody(promocodeValidateSchema), asyncHandler(validatePromocode));

export default router;
