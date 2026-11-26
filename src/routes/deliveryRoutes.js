import { Router } from 'express';
import * as controller from '../controllers/deliveryController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import {
  deliveryIdValidator, deliveryOrderIdValidator, createDeliveryValidator,
  createOrderDeliveryValidator, updateDeliveryValidator, listDeliveryValidator,
} from '../validators/deliveryValidator.js';

const router = Router();

router.use(authenticate, authorize('ATTENDANT', 'COURIER'));
router.get('/', listDeliveryValidator, controller.list);
router.post('/', authorize('ATTENDANT'), createDeliveryValidator, controller.create);
router.use('/:deliveryId', deliveryIdValidator);
router.get('/:deliveryId', controller.get);
router.patch('/:deliveryId', updateDeliveryValidator, controller.update);
router.delete('/:deliveryId', authorize('ATTENDANT'), controller.remove);

export const orderDeliveryRoutes = Router({ mergeParams: true });

orderDeliveryRoutes.use(authenticate, authorize('ATTENDANT', 'COURIER'), deliveryOrderIdValidator);
orderDeliveryRoutes.get('/', controller.get);
orderDeliveryRoutes.post('/', authorize('ATTENDANT'), createOrderDeliveryValidator, controller.create);
orderDeliveryRoutes.patch('/', updateDeliveryValidator, controller.update);
orderDeliveryRoutes.delete('/', authorize('ATTENDANT'), controller.remove);

export default router;
