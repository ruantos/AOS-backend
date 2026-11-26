import { HttpError } from '../services/httpError.js';

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON inválido.' } });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Corpo da requisição muito grande.' } });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Já existe um registro com esses dados únicos.' } });
  }

  console.error(error);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
}
