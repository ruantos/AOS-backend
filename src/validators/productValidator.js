import { body, checkExact } from 'express-validator';
import { requireBody, textField, nullableTextField, validateResource } from './resourceValidator.js';

function productFields(partial) {
  const name = textField('name', 120, 2);
  const price = body('price').custom(value =>
    (typeof value === 'string' || typeof value === 'number')
    && /^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(String(value)))
    .withMessage('Preço deve ser não negativo, com até 10 dígitos inteiros e 2 casas decimais.')
    .bail().customSanitizer(value => String(value));
  return [
    partial ? name.optional() : name,
    partial ? price.optional() : price,
    nullableTextField('description', 1000),
    body('active').optional().custom(value => typeof value === 'boolean').withMessage('Active deve ser booleano.'),
  ];
}

export const createProductValidator = [
  requireBody,
  checkExact(productFields(false), { locations: ['body'], message: 'Campos não permitidos.' }),
  validateResource,
];

export const updateProductValidator = [
  requireBody,
  checkExact(productFields(true), { locations: ['body'], message: 'Campos não permitidos.' }),
  validateResource,
];
