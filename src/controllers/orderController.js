import * as orderService from '../services/orderService.js';

export async function create(req, res) {
  const order = await orderService.createOrder(req.auth.user.id, req.input);
  res.status(201).json({ order });
}

export async function createForCustomer(req, res) {
  const order = await orderService.createOrder(req.auth.user.id, { ...req.input, customerId: req.params.customerId });
  res.status(201).json({ order });
}

export async function list(req, res) {
  const orders = await orderService.listOrders(req.auth.user.id, req.query, req.params.customerId);
  res.json({ orders });
}

export async function get(req, res) {
  const order = await orderService.getOrder(req.auth.user.id, req.params.orderId);
  res.json({ order });
}

export async function update(req, res) {
  const order = await orderService.updateOrder(req.auth.user.id, req.params.orderId, req.input);
  res.json({ order });
}

export async function remove(req, res) {
  await orderService.deleteOrder(req.auth.user.id, req.params.orderId);
  res.status(204).end();
}

export async function listItems(req, res) {
  const items = await orderService.listItems(req.auth.user.id, req.params.orderId);
  res.json({ items });
}

export async function getItem(req, res) {
  const item = await orderService.getItem(req.auth.user.id, req.params.orderId, req.params.itemId);
  res.json({ item });
}

export async function addItem(req, res) {
  const result = await orderService.addItem(req.auth.user.id, req.params.orderId, req.input);
  res.status(201).json(result);
}

export async function updateItem(req, res) {
  const result = await orderService.updateItem(req.auth.user.id, req.params.orderId, req.params.itemId, req.input);
  res.json(result);
}

export async function removeItem(req, res) {
  await orderService.deleteItem(req.auth.user.id, req.params.orderId, req.params.itemId);
  res.status(204).end();
}

//orderController.js