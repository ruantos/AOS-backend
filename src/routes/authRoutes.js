import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { signupValidator, loginValidator } from '../validators/authValidator.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.post('/signup', signupValidator, authController.signup);
router.post('/login', loginValidator, authController.login);
router.post('/logout', authenticate, authController.logout);

export default router;
