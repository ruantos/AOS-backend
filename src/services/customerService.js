import { prisma } from '../config/database.js';
import { HttpError } from './httpError.js';

export async function createCustomer(userId, input) {
  return prisma.customer.create({ data: { ...input, createdById: userId } });
}

export async function listCustomers(userId) {
  return prisma.customer.findMany({ where: { createdById: userId, deletedAt: null }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] });
}

export async function getCustomer(userId, id) {
  const customer = await prisma.customer.findFirst({ where: { id, createdById: userId, deletedAt: null } });
  if (!customer) {
    throw new HttpError(404, 'NOT_FOUND', 'Contato não encontrado.');
  }
  return customer;
}

export async function updateCustomer(userId, id, input) {
  return prisma.customer.update({ where: { id, createdById: userId, deletedAt: null }, data: input });
}

export async function deleteCustomer(userId, id) {
  await prisma.customer.update({ where: { id, createdById: userId, deletedAt: null }, data: { deletedAt: new Date() } });
}
