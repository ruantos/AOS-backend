import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.js';
import { prisma } from '../config/database.js';
import { publicUserFields } from '../services/userService.js';
import { HttpError } from '../services/httpError.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function authenticate(req, res, next) {
  const unauthorized = () => new HttpError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.');
  const match = req.get('authorization')?.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    throw unauthorized();
  }

  let claims;
  try {
    claims = jwt.verify(match[1], authConfig.secret, {
      algorithms: ['HS256'], issuer: authConfig.issuer, audience: authConfig.audience,
    });
  } catch {
    throw unauthorized();
  }

  if (typeof claims !== 'object' || typeof claims.sub !== 'string' || typeof claims.jti !== 'string'
      || !uuid.test(claims.sub) || !uuid.test(claims.jti) || !Number.isInteger(claims.exp)) {
    throw unauthorized();
  }

  const session = await prisma.session.findFirst({
    where: { id: claims.jti, userId: claims.sub, revokedAt: null, expiresAt: { gt: new Date() }, user: { active: true } },
    include: { user: { select: publicUserFields } },
  });
  if (!session) {
    throw unauthorized();
  }

  req.auth = { user: session.user, sessionId: session.id };
  res.set('Cache-Control', 'no-store');
  return next();
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Autenticação obrigatória.');
    }
    if (!roles.includes(req.auth.user.role)) {
      throw new HttpError(403, 'FORBIDDEN', 'Perfil sem permissão para esta operação.');
    }
    return next();
  };
}
