import { Router } from 'express';
import * as metaController from '../controllers/meta.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/catalog', asyncHandler(metaController.getCatalog));

export default router;
