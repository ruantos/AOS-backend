import { body, checkExact, matchedData, validationResult } from 'express-validator';

const name = () => body('name').isString().withMessage('Nome deve ser texto.').bail().trim().isLength({ min: 2, max: 120 }).withMessage('Nome deve ter entre 2 e 120 caracteres.');
const email = () => body('email').isString().withMessage('E-mail deve ser texto.').bail().trim().isLength({ max: 254 }).isEmail().withMessage('E-mail inválido.').bail().toLowerCase();
const password = () => body('password').isString().withMessage('Senha deve ser texto.').bail().isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres.').bail().custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Senha deve ter no máximo 72 bytes em UTF-8.');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: {
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos.',
      details: errors.array({ onlyFirstError: true }).map(error => ({ field: error.path ?? 'body', message: error.msg })),
    } });
  }
  req.input = matchedData(req, { locations: ['body'] });
  return next();
}

export const signupValidator = [
  checkExact([name(), email(), password(), body('role').isString().withMessage('Perfil deve ser texto.').bail().isIn(['ATTENDANT', 'COURIER']).withMessage('Perfil deve ser ATTENDANT ou COURIER.')], { locations: ['body'], message: 'Campos não permitidos.' }),
  validate,
];

export const loginValidator = [
  checkExact([email(), password()], { locations: ['body'], message: 'Campos não permitidos.' }),
  validate,
];

export const updateUserValidator = [
  (req, res, next) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Informe pelo menos um campo para atualizar.' } });
    }
    return next();
  },
  checkExact([name().optional(), email().optional(), password().optional()], { locations: ['body'], message: 'Somente nome, e-mail e senha podem ser alterados.' }),
  validate,
];
