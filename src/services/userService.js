import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { HttpError } from './httpError.js';

export const publicUserFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

export async function lockUser(tx, id) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id}::uuid FOR UPDATE`;
}

async function requireSession(tx, userId, sessionId) {
  const session = await tx.session.findFirst({ where: {
    id: sessionId, userId, revokedAt: null, expiresAt: { gt: new Date() }, user: { active: true },
  } });
  if (!session) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.');
  }
}

export async function getCurrentUser(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserFields });
  if (!user || !user.active) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.');
  }
  return user;
}

export async function updateCurrentUser(userId, sessionId, input) {
  const { password, ...data } = input;
  if (password !== undefined) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }
  return prisma.$transaction(async tx => {
    await lockUser(tx, userId);
    await requireSession(tx, userId, sessionId);
    const user = await tx.user.update({ where: { id: userId }, data, select: publicUserFields });
    if (password !== undefined) {
      await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    return user;
  });
}

export async function deactivateCurrentUser(userId, sessionId) {
  await prisma.$transaction(async tx => {
    await lockUser(tx, userId);
    await requireSession(tx, userId, sessionId);
    await tx.user.update({ where: { id: userId }, data: { active: false } });
    await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  });
}
