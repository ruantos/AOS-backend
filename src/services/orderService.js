import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { HttpError } from './httpError.js';

const includeOrder = {
  items: { orderBy: { id: 'asc' } },
  history: { orderBy: [{ changedAt: 'asc' }, { id: 'asc' }] },
  delivery: { select: { id: true, status: true, deletedAt: true } },
};
const editableStatuses = ['RECEIVED', 'PREPARING'];
const transitions = {
  RECEIVED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['CANCELLED'],
  IN_DELIVERY: [],
  COMPLETED: [],
  CANCELLED: [],
};

export function serializeItem(item) {
  return { ...item, unitPrice: item.unitPrice.toFixed(2), subtotal: item.unitPrice.mul(item.quantity).toFixed(2) };
}

function serializeOrder(order) {
  const { delivery, ...data } = order;
  const total = order.items.reduce((sum, item) => sum.plus(item.unitPrice.mul(item.quantity)), new Prisma.Decimal(0));
  return { ...data, items: order.items.map(serializeItem), total: total.toFixed(2) };
}

async function ownedOrder(db, userId, id, lock = false) {
  if (lock) {
    await db.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${id}::uuid AND "createdById" = ${userId}::uuid AND "deletedAt" IS NULL FOR UPDATE`;
  }
  const order = await db.order.findFirst({ where: { id, createdById: userId, deletedAt: null }, include: includeOrder });
  if (!order) throw new HttpError(404, 'NOT_FOUND', 'Pedido não encontrado.');
  return order;
}

async function ownedCustomer(db, userId, id, lock = false) {
  if (lock) await db.$queryRaw`SELECT "id" FROM "Customer" WHERE "id" = ${id}::uuid FOR SHARE`;
  const customer = await db.customer.findFirst({ where: { id, createdById: userId, deletedAt: null } });
  if (!customer) throw new HttpError(404, 'NOT_FOUND', 'Contato não encontrado.');
  return customer;
}

async function availableProducts(db, userId, ids) {
  const values = ids.map(id => Prisma.sql`${id}::uuid`);
  await db.$queryRaw(Prisma.sql`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(values)}) ORDER BY "id" FOR SHARE`);
  const products = await db.product.findMany({ where: { id: { in: ids }, createdById: userId, deletedAt: null } });
  if (products.length !== ids.length) throw new HttpError(404, 'NOT_FOUND', 'Produto não encontrado.');
  if (products.some(product => !product.active)) throw new HttpError(409, 'INACTIVE_PRODUCT', 'Produto inativo não pode ser incluído ou ter quantidade alterada.');
  return new Map(products.map(product => [product.id, product]));
}

function requireEditable(order) {
  if (!editableStatuses.includes(order.status)) throw new HttpError(409, 'ORDER_NOT_EDITABLE', 'Pedido não permite edição nesta situação.');
}

export async function createOrder(userId, input) {
  return prisma.$transaction(async tx => {
    await ownedCustomer(tx, userId, input.customerId, true);
    const products = await availableProducts(tx, userId, input.items.map(item => item.productId));
    const order = await tx.order.create({ data: {
      customerId: input.customerId, createdById: userId, notes: input.notes,
      items: { create: input.items.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: products.get(item.productId).price })) },
      history: { create: { changedById: userId, orderStatus: 'RECEIVED' } },
    }, include: includeOrder });
    return serializeOrder(order);
  });
}

export async function listOrders(userId, filters, customerId) {
  if (customerId) await ownedCustomer(prisma, userId, customerId);
  const orders = await prisma.order.findMany({ where: {
    createdById: userId, deletedAt: null, customerId, status: filters.status,
    createdAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) },
  }, include: includeOrder, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] });
  return orders.map(serializeOrder);
}

export async function getOrder(userId, id) {
  return serializeOrder(await ownedOrder(prisma, userId, id));
}

export async function updateOrder(userId, id, input) {
  return prisma.$transaction(async tx => {
    const order = await ownedOrder(tx, userId, id, true);
    if (input.notes !== undefined) requireEditable(order);
    if (input.status && input.status !== order.status) {
      if (!transitions[order.status].includes(input.status)) throw new HttpError(409, 'INVALID_TRANSITION', 'Transição de pedido não permitida; entrega e conclusão são controladas pelo fluxo de entregas.');
      if (input.status === 'CANCELLED' && order.delivery && !order.delivery.deletedAt) throw new HttpError(409, 'DELIVERY_EXISTS', 'Pedido com entrega vinculada deve ser tratado pelo fluxo de entregas.');
      await tx.statusHistory.create({ data: { orderId: id, changedById: userId, orderStatus: input.status } });
    }
    return serializeOrder(await tx.order.update({ where: { id }, data: input, include: includeOrder }));
  });
}

export async function deleteOrder(userId, id) {
  await prisma.$transaction(async tx => {
    const order = await ownedOrder(tx, userId, id, true);
    if (order.status === 'IN_DELIVERY' || (order.delivery && !order.delivery.deletedAt)) throw new HttpError(409, 'DELIVERY_EXISTS', 'Pedido com entrega em acompanhamento não pode ser excluído.');
    const status = order.status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED';
    if (status !== order.status) await tx.statusHistory.create({ data: { orderId: id, changedById: userId, orderStatus: status } });
    await tx.order.update({ where: { id }, data: { deletedAt: new Date(), status } });
  });
}

export async function listItems(userId, orderId) {
  return (await getOrder(userId, orderId)).items;
}

export async function getItem(userId, orderId, itemId) {
  const item = (await listItems(userId, orderId)).find(item => item.id === itemId);
  if (!item) throw new HttpError(404, 'NOT_FOUND', 'Item não encontrado neste pedido.');
  return item;
}

export async function addItem(userId, orderId, input) {
  return prisma.$transaction(async tx => {
    const order = await ownedOrder(tx, userId, orderId, true);
    requireEditable(order);
    if (order.items.length >= 100) throw new HttpError(409, 'ITEM_LIMIT', 'Pedido permite até 100 itens.');
    if (order.items.some(item => item.productId === input.productId)) throw new HttpError(409, 'DUPLICATE_ITEM', 'Produto já incluído no pedido.');
    const products = await availableProducts(tx, userId, [input.productId]);
    const item = await tx.orderItem.create({ data: { orderId, productId: input.productId, quantity: input.quantity, unitPrice: products.get(input.productId).price } });
    return { item: serializeItem(item), total: (await getOrderInTransaction(tx, userId, orderId)).total };
  });
}

async function getOrderInTransaction(tx, userId, orderId) {
  return serializeOrder(await ownedOrder(tx, userId, orderId));
}

export async function updateItem(userId, orderId, itemId, input) {
  return prisma.$transaction(async tx => {
    const order = await ownedOrder(tx, userId, orderId, true);
    const existing = order.items.find(item => item.id === itemId);
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Item não encontrado neste pedido.');
    requireEditable(order);
    await availableProducts(tx, userId, [existing.productId]);
    const item = await tx.orderItem.update({ where: { id: itemId }, data: { quantity: input.quantity } });
    return { item: serializeItem(item), total: (await getOrderInTransaction(tx, userId, orderId)).total };
  });
}

export async function deleteItem(userId, orderId, itemId) {
  await prisma.$transaction(async tx => {
    const order = await ownedOrder(tx, userId, orderId, true);
    if (!order.items.some(item => item.id === itemId)) throw new HttpError(404, 'NOT_FOUND', 'Item não encontrado neste pedido.');
    requireEditable(order);
    if (order.items.length === 1) throw new HttpError(409, 'LAST_ITEM', 'Pedido deve manter pelo menos um item.');
    await tx.orderItem.delete({ where: { id: itemId } });
  });
}
