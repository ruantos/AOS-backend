import { body, param, query, checkExact } from 'express-validator';
import { requireBody, textField, validateResource } from './resourceValidator.js';

const statuses = ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
const courierId = () => body('courierId').isString().bail().isUUID().withMessage('Entregador deve ser um UUID válido.').bail().toLowerCase();

export const deliveryIdValidator = [param('deliveryId').isUUID().withMessage('Entrega deve ser um UUID válido.'), validateResource];
export const deliveryOrderIdValidator = [param('orderId').isUUID().withMessage('Pedido deve ser um UUID válido.'), validateResource];

function createFields(nested) {
  return [
    ...(!nested ? [body('orderId').isString().bail().isUUID().withMessage('Pedido deve ser um UUID válido.')] : []),
    courierId(),
  ];
}

export const createDeliveryValidator = [requireBody, checkExact(createFields(false), { locations: ['body'], message: 'Campos não permitidos.' }), validateResource];
export const createOrderDeliveryValidator = [requireBody, checkExact(createFields(true), { locations: ['body'], message: 'Informe somente courierId.' }), validateResource];
export const updateDeliveryValidator = [
  requireBody,
  checkExact([
    courierId().optional(),
    body('status').optional().isString().bail().isIn(statuses).withMessage('Situação inválida.'),
    textField('failureNote', 1000).optional(),
  ], { locations: ['body'], message: 'Somente courierId, status e failureNote são permitidos.' }),
  validateResource,
  (req, res, next) => {
    const { courierId, status, failureNote } = req.input;
    if ((courierId === undefined && status === undefined)
        || (courierId !== undefined && status !== undefined)
        || (status === 'FAILED' ? !failureNote : failureNote !== undefined)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Altere atribuição ou situação por vez; failureNote é obrigatório e exclusivo de FAILED.' } });
    }
    return next();
  },
];
export const listDeliveryValidator = [
  query('status').optional().isString().bail().isIn(statuses).withMessage('Situação inválida.'),
  query('courierId').optional().isString().bail().isUUID().withMessage('Entregador deve ser um UUID válido.'),
  validateResource,
];
