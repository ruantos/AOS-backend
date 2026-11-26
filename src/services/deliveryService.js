import { prisma } from '../config/database.js';
import { HttpError } from './httpError.js';

const includeDelivery = {
  order: { select: { id: true, createdById: true, status: true, deletedAt: true } },
  history: { orderBy: [{ changedAt: 'asc' }, { id: 'asc' }] },
};

function scope(user) {
  return user.role === 'ATTENDANT' ? { order: { createdById: user.id, deletedAt: null } } : { courierId: user.id, order: { deletedAt: null } };
}

function serializeDelivery(delivery) {
  const { order, ...data } = delivery;
  return { ...data, orderStatus: order.status };
}

async function lockOrder(tx, orderId) {
  await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId}::uuid FOR UPDATE`;
}

async function accessibleDelivery(db, user, reference, lock = false) {
  const where = { ...reference, ...scope(user), deletedAt: null };
  let delivery = await db.delivery.findFirst({ where, include: includeDelivery });
  if (!delivery) throw new HttpError(404, 'NOT_FOUND', 'Entrega não encontrada.');
  if (lock) {
    await lockOrder(db, delivery.orderId);
    delivery = await db.delivery.findFirst({ where, include: includeDelivery });
    if (!delivery) throw new HttpError(404, 'NOT_FOUND', 'Entrega não encontrada.');
  }
  return delivery;
}

async function requireCourier(tx, courierId) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${courierId}::uuid FOR SHARE`;
  const courier = await tx.user.findFirst({ where: { id: courierId, role: 'COURIER', active: true }, select: { id: true } });
  if (!courier) throw new HttpError(409, 'INVALID_COURIER', 'Atribuição exige um entregador ativo.');
}

async function deliveryEvent(tx, delivery, userId, status, note) {
  await tx.statusHistory.create({ data: { orderId: delivery.orderId, deliveryId: delivery.id, changedById: userId, deliveryStatus: status, note } });
}

async function orderEvent(tx, orderId, userId, status) {
  await tx.order.update({ where: { id: orderId }, data: { status } });
  await tx.statusHistory.create({ data: { orderId, changedById: userId, orderStatus: status } });
}

function requireAttendant(user) {
  if (user.role !== 'ATTENDANT') throw new HttpError(403, 'FORBIDDEN', 'Operação exclusiva de atendentes.');
}

export async function createDelivery(user, input) {
  requireAttendant(user);
  return prisma.$transaction(async tx => {
    await lockOrder(tx, input.orderId);
    const order = await tx.order.findFirst({ where: { id: input.orderId, createdById: user.id, deletedAt: null }, include: { delivery: true, customer: true } });
    if (!order) throw new HttpError(404, 'NOT_FOUND', 'Pedido não encontrado.');
    if (order.delivery) throw new HttpError(409, 'DELIVERY_EXISTS', 'Pedido já possui uma entrega, inclusive quando excluída.');
    if (order.status !== 'READY') throw new HttpError(409, 'ORDER_NOT_READY', 'Pedido deve estar pronto para receber uma entrega.');
    await requireCourier(tx, input.courierId);
    await tx.$queryRaw`SELECT "id" FROM "Customer" WHERE "id" = ${order.customerId}::uuid FOR SHARE`;
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: order.customerId } });
    const { street, number, complement, neighborhood, city, reference } = customer;
    const delivery = await tx.delivery.create({ data: {
      orderId: order.id, courierId: input.courierId, assignedAt: new Date(),
      addressSnapshot: { street, number, complement, neighborhood, city, reference },
    } });
    await deliveryEvent(tx, delivery, user.id, 'ASSIGNED');
    return serializeDelivery(await accessibleDelivery(tx, user, { id: delivery.id }));
  });
}

export async function listDeliveries(user, filters) {
  const deliveries = await prisma.delivery.findMany({ where: {
    AND: [scope(user), { deletedAt: null, status: filters.status, courierId: filters.courierId }],
  }, include: includeDelivery, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] });
  return deliveries.map(serializeDelivery);
}

export async function getDelivery(user, reference) {
  return serializeDelivery(await accessibleDelivery(prisma, user, reference));
}

export async function updateDelivery(user, reference, input) {
  return prisma.$transaction(async tx => {
    const delivery = await accessibleDelivery(tx, user, reference, true);
    if (input.courierId !== undefined) {
      requireAttendant(user);
      if (delivery.status !== 'ASSIGNED' || delivery.order.status !== 'READY') throw new HttpError(409, 'DELIVERY_NOT_ASSIGNABLE', 'Entregador só pode ser alterado antes da saída.');
      await requireCourier(tx, input.courierId);
      if (input.courierId !== delivery.courierId) {
        await tx.delivery.update({ where: { id: delivery.id }, data: { courierId: input.courierId, assignedAt: new Date() } });
        await deliveryEvent(tx, delivery, user.id, 'ASSIGNED', 'Entregador responsável atualizado.');
      }
    } else if (input.status !== undefined) {
      if (input.status === delivery.status) {
        if (input.failureNote !== undefined && input.failureNote !== delivery.failureNote) throw new HttpError(409, 'DELIVERY_FINISHED', 'Observação de falha já registrada não pode ser alterada.');
        return serializeDelivery(delivery);
      }
      const allowed = { ASSIGNED: ['OUT_FOR_DELIVERY', 'FAILED'], OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'], DELIVERED: [], FAILED: [] };
      if (!allowed[delivery.status].includes(input.status)) throw new HttpError(409, 'INVALID_TRANSITION', 'Transição de entrega não permitida.');
      const expectedOrderStatus = delivery.status === 'ASSIGNED' ? 'READY' : 'IN_DELIVERY';
      if (delivery.order.status !== expectedOrderStatus) throw new HttpError(409, 'INVALID_ORDER_STATUS', 'Pedido não está em situação compatível com a entrega.');
      if (input.status === 'OUT_FOR_DELIVERY') {
        if (!delivery.courierId) throw new HttpError(409, 'INVALID_COURIER', 'Entrega precisa de entregador ativo.');
        await requireCourier(tx, delivery.courierId);
      }
      await tx.delivery.update({ where: { id: delivery.id }, data: {
        status: input.status,
        ...(input.status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        ...(input.status === 'FAILED' ? { failureNote: input.failureNote } : {}),
      } });
      await deliveryEvent(tx, delivery, user.id, input.status, input.failureNote);
      const orderStatus = { OUT_FOR_DELIVERY: 'IN_DELIVERY', DELIVERED: 'COMPLETED', FAILED: 'CANCELLED' }[input.status];
      await orderEvent(tx, delivery.orderId, user.id, orderStatus);
    }
    return serializeDelivery(await accessibleDelivery(tx, user, { id: delivery.id }));
  });
}

export async function deleteDelivery(user, reference) {
  requireAttendant(user);
  await prisma.$transaction(async tx => {
    const delivery = await accessibleDelivery(tx, user, reference, true);
    if (delivery.status === 'OUT_FOR_DELIVERY') throw new HttpError(409, 'DELIVERY_IN_PROGRESS', 'Entrega em andamento não pode ser excluída.');
    if (delivery.status === 'ASSIGNED') {
      const failureNote = 'Entrega cancelada pelo atendente antes da saída.';
      await tx.delivery.update({ where: { id: delivery.id }, data: { status: 'FAILED', failureNote, deletedAt: new Date() } });
      await deliveryEvent(tx, delivery, user.id, 'FAILED', failureNote);
      await orderEvent(tx, delivery.orderId, user.id, 'CANCELLED');
    } else {
      await tx.delivery.update({ where: { id: delivery.id }, data: { deletedAt: new Date() } });
    }
  });
}
