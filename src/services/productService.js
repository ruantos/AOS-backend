import { prisma } from '../config/database.js';
import { HttpError } from './httpError.js';

function serializeProduct(product) {
  return { ...product, price: product.price.toFixed(2) };
}

export async function createProduct(userId, input) {
  const product = await prisma.product.create({ data: { ...input, createdById: userId } });
  return serializeProduct(product);
}

export async function listProducts(userId) {
  const products = await prisma.product.findMany({ where: { createdById: userId, deletedAt: null }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] });
  return products.map(serializeProduct);
}

export async function getProduct(userId, id) {
  const product = await prisma.product.findFirst({ where: { id, createdById: userId, deletedAt: null } });
  if (!product) {
    throw new HttpError(404, 'NOT_FOUND', 'Produto não encontrado.');
  }
  return serializeProduct(product);
}

export async function updateProduct(userId, id, input) {
  const product = await prisma.product.update({ where: { id, createdById: userId, deletedAt: null }, data: input });
  return serializeProduct(product);
}

export async function deleteProduct(userId, id) {
  await prisma.product.update({ where: { id, createdById: userId, deletedAt: null }, data: { active: false, deletedAt: new Date() } });
}
