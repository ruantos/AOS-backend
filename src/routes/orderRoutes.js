import { Router } from 'express';
import * as controller from '../controllers/orderController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import {
  orderIdValidator, itemIdValidator, createOrderValidator, updateOrderValidator,
  listOrderValidator, addItemValidator, updateItemValidator,
} from '../validators/orderValidator.js';

const router = Router();

router.use(authenticate, authorize('ATTENDANT'));
router.post('/', createOrderValidator, controller.create);
router.get('/', listOrderValidator, controller.list);
router.use('/:orderId', orderIdValidator);
router.get('/:orderId', controller.get);
router.patch('/:orderId', updateOrderValidator, controller.update);
router.delete('/:orderId', controller.remove);
router.get('/:orderId/items', controller.listItems);
router.post('/:orderId/items', addItemValidator, controller.addItem);
router.get('/:orderId/items/:itemId', itemIdValidator, controller.getItem);
router.patch('/:orderId/items/:itemId', itemIdValidator, updateItemValidator, controller.updateItem);
router.delete('/:orderId/items/:itemId', itemIdValidator, controller.removeItem);

export default router;

//orderRoutes.js