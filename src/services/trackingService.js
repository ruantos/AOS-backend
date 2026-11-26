import { prisma } from '../config/database.js';
import { HttpError } from './httpError.js';

export async function getTracking(trackingCode) {
  const delivery = await prisma.delivery.findFirst({
    where: { trackingCode, deletedAt: null, order: { deletedAt: null } },
    select: {
      trackingCode: true,
      status: true,
      createdAt: true,
      deliveredAt: true,
      history: {
        orderBy: [{ changedAt: 'asc' }, { id: 'asc' }],
        select: { deliveryStatus: true, changedAt: true },
      },
    },
  });
  if (!delivery) throw new HttpError(404, 'NOT_FOUND', 'Pacote não encontrado.');
  const history = [];
  for (const event of delivery.history) {
    if (event.deliveryStatus && history.at(-1)?.status !== event.deliveryStatus) {
      history.push({ status: event.deliveryStatus, changedAt: event.changedAt });
    }
  }
  return { trackingCode: delivery.trackingCode, status: delivery.status, createdAt: delivery.createdAt, deliveredAt: delivery.deliveredAt, history };
}
