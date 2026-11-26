import { param } from 'express-validator';
import { validateResource } from './resourceValidator.js';

export const trackingValidator = [
  param('trackingCode').isUUID('4').withMessage('Informe um código de rastreamento válido.'),
  validateResource,
];
