import * as deliveryService from '../services/deliveryService.js';

function reference(req) {
  return req.params.orderId ? { orderId: req.params.orderId } : { id: req.params.deliveryId };
}

export async function create(req, res) {
  const input = req.params.orderId ? { ...req.input, orderId: req.params.orderId } : req.input;
  const delivery = await deliveryService.createDelivery(req.auth.user, input);
  res.status(201).json({ delivery });
}

export async function list(req, res) {
  const deliveries = await deliveryService.listDeliveries(req.auth.user, req.query);
  res.json({ deliveries });
}

export async function get(req, res) {
  const delivery = await deliveryService.getDelivery(req.auth.user, reference(req));
  res.json({ delivery });
}

export async function update(req, res) {
  const delivery = await deliveryService.updateDelivery(req.auth.user, reference(req), req.input);
  res.json({ delivery });
}

export async function remove(req, res) {
  await deliveryService.deleteDelivery(req.auth.user, reference(req));
  res.status(204).end();
}
