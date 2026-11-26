import { body, param, matchedData, validationResult } from 'express-validator';

export function requireBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Informe um objeto JSON com pelo menos um campo.' } });
  }
  return next();
}

export function textField(field, max, min = 1) {
  return body(field).isString().withMessage('Campo deve ser texto.').bail().trim()
    .isLength({ min, max }).withMessage(`Campo deve ter entre ${min} e ${max} caracteres.`);
}

export function nullableTextField(field, max) {
  return body(field).optional()
    .custom(value => value === null || (typeof value === 'string' && [...value.trim()].length <= max))
    .withMessage(`Campo deve ser texto de até ${max} caracteres ou null.`)
    .customSanitizer(value => typeof value === 'string' ? value.trim() : value);
}

export function validateResource(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ error: {
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos.',
      details: result.array({ onlyFirstError: true }).map(error => ({ field: error.path ?? 'body', message: error.msg })),
    } });
  }
  req.input = matchedData(req, { locations: ['body'] });
  return next();
}

export const resourceIdValidator = [
  param('id').isUUID().withMessage('ID deve ser um UUID válido.'),
  validateResource,
];
