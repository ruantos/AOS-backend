import { body, param, query, checkExact } from 'express-validator';
import { requireBody, nullableTextField, validateResource } from './resourceValidator.js';

export const orderStatuses = ['RECEIVED', 'PREPARING', 'READY', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED'];

const quantity = field => body(field).custom(value => Number.isInteger(value) && value >= 1 && value <= 10000).withMessage('Quantidade deve ser um inteiro entre 1 e 10000.');
const productId = field => body(field).isString().bail().isUUID().withMessage('Produto deve ser um UUID válido.').bail().toLowerCase();

export const orderIdValidator = [param('orderId').isUUID().withMessage('Pedido deve ser um UUID válido.'), validateResource];
export const itemIdValidator = [param('itemId').isUUID().withMessage('Item deve ser um UUID válido.'), validateResource];
export const customerOrderIdValidator = [param('customerId').isUUID().withMessage('Contato deve ser um UUID válido.'), validateResource];

function createFields(nested) {
  return [
    ...(!nested ? [body('customerId').isString().bail().isUUID().withMessage('Contato deve ser um UUID válido.')] : []),
    nullableTextField('notes', 1000),
    body('items').isArray({ min: 1, max: 100 }).withMessage('Informe entre 1 e 100 itens.').bail()
      .custom(items => items.every(item => item && typeof item === 'object' && !Array.isArray(item)))
      .withMessage('Cada item deve ser um objeto.').bail()
      .custom(items => items.every(item => Object.keys(item).every(key => ['productId', 'quantity'].includes(key))))
      .withMessage('Itens aceitam somente productId e quantity.').bail()
      .custom(items => new Set(items.map(item => typeof item.productId === 'string' ? item.productId.toLowerCase() : item.productId)).size === items.length)
      .withMessage('Produtos não podem ser repetidos.'),
    productId('items.*.productId'),
    quantity('items.*.quantity'),
  ];
}

export const createOrderValidator = [requireBody, checkExact(createFields(false), { locations: ['body'], message: 'Campos não permitidos.' }), validateResource];
export const createCustomerOrderValidator = [requireBody, checkExact(createFields(true), { locations: ['body'], message: 'Campos não permitidos.' }), validateResource];
export const updateOrderValidator = [
  requireBody,
  checkExact([
    nullableTextField('notes', 1000),
    body('status').optional().isString().bail().isIn(orderStatuses).withMessage('Situação inválida.'),
  ], { locations: ['body'], message: 'Somente notes e status podem ser alterados.' }),
  validateResource,
];
export const addItemValidator = [requireBody, checkExact([productId('productId'), quantity('quantity')], { locations: ['body'], message: 'Somente productId e quantity são permitidos.' }), validateResource];
export const updateItemValidator = [requireBody, checkExact([quantity('quantity')], { locations: ['body'], message: 'Somente quantity pode ser alterado.' }), validateResource];

export const listOrderValidator = [
  query('status').optional().isString().bail().isIn(orderStatuses).withMessage('Situação inválida.'),
  query('from').optional().isString().bail().isISO8601({ strict: true }).withMessage('Data inicial inválida.').bail()
    .custom(value => /T.*(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))).withMessage('Informe data e hora com fuso.'),
  query('to').optional().isString().bail().isISO8601({ strict: true }).withMessage('Data final inválida.').bail()
    .custom(value => /T.*(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))).withMessage('Informe data e hora com fuso.')
    .bail().custom((value, { req }) => !req.query.from || Date.parse(value) >= Date.parse(req.query.from)).withMessage('Data final deve ser posterior à inicial.'),
  validateResource,
];

//orderValidator.js