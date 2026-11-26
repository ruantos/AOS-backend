import { Router } from 'express';
import * as controller from '../controllers/trackingController.js';
import { trackingRateLimit } from '../middlewares/trackingRateLimit.js';
import { trackingValidator } from '../validators/trackingValidator.js';

const router = Router();

router.get('/public/tracking/:trackingCode', trackingRateLimit, trackingValidator, controller.get);

export default router;
