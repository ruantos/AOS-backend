import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { updateUserValidator } from '../validators/authValidator.js';

const router = Router();

router.use(authenticate, authorize('ATTENDANT', 'COURIER'));
router.get('/me', userController.getMe);
router.patch('/me', updateUserValidator, userController.updateMe);
router.delete('/me', userController.deactivateMe);

export default router;
