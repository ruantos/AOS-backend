import { checkExact } from 'express-validator';
import { requireBody, textField, nullableTextField, validateResource } from './resourceValidator.js';

function customerFields(partial) {
  const required = [
    textField('name', 120, 2),
    textField('phone', 30),
    textField('street', 200),
    textField('number', 30),
    textField('neighborhood', 120),
    textField('city', 120),
  ];
  return [
    ...required.map(field => partial ? field.optional() : field),
    nullableTextField('complement', 200),
    nullableTextField('reference', 300),
  ];
}

export const createCustomerValidator = [
  requireBody,
  checkExact(customerFields(false), { locations: ['body'], message: 'Campos não permitidos.' }),
  validateResource,
];

export const updateCustomerValidator = [
  requireBody,
  checkExact(customerFields(true), { locations: ['body'], message: 'Campos não permitidos.' }),
  validateResource,
];
