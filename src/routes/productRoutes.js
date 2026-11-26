import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { resourceIdValidator } from '../validators/resourceValidator.js';
import { createProductValidator, updateProductValidator } from '../validators/productValidator.js';

const router = Router();

router.use(authenticate, authorize('ATTENDANT'));
router.post('/', createProductValidator, productController.create);
router.get('/', productController.list);
router.get('/:id', resourceIdValidator, productController.get);
router.patch('/:id', resourceIdValidator, updateProductValidator, productController.update);
router.delete('/:id', resourceIdValidator, productController.remove);

export default router;
