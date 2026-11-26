import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { authConfig } from '../config/auth.js';
import { HttpError } from './httpError.js';
import { lockUser, publicUserFields } from './userService.js';

export async function signup({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { name, email, passwordHash, role }, select: publicUserFields });
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
  }

  return prisma.$transaction(async tx => {
    await lockUser(tx, user.id);
    const current = await tx.user.findUnique({ where: { id: user.id } });
    if (!current?.active || current.passwordHash !== user.passwordHash) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }
    const sessionId = randomUUID();
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + authConfig.ttlSeconds;
    const accessToken = jwt.sign({ exp: expiresAtSeconds }, authConfig.secret, {
      algorithm: 'HS256', subject: user.id, jwtid: sessionId,
      issuer: authConfig.issuer, audience: authConfig.audience,
    });
    await tx.session.create({ data: { id: sessionId, userId: user.id, expiresAt: new Date(expiresAtSeconds * 1000) } });
    const safeUser = Object.fromEntries(Object.keys(publicUserFields).map(key => [key, current[key]]));
    return { accessToken, tokenType: 'Bearer', expiresAt: new Date(expiresAtSeconds * 1000), user: safeUser };
  });
}

export async function logout(userId, sessionId) {
  await prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
}
