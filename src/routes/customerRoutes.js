import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { resourceIdValidator } from '../validators/resourceValidator.js';
import { createCustomerValidator, updateCustomerValidator } from '../validators/customerValidator.js';

const router = Router();

router.use(authenticate, authorize('ATTENDANT'));
router.post('/', createCustomerValidator, customerController.create);
router.get('/', customerController.list);
router.get('/:id', resourceIdValidator, customerController.get);
router.patch('/:id', resourceIdValidator, updateCustomerValidator, customerController.update);
router.delete('/:id', resourceIdValidator, customerController.remove);

export default router;
