import * as customerService from '../services/customerService.js';

export async function create(req, res) {
  const customer = await customerService.createCustomer(req.auth.user.id, req.input);
  res.status(201).json({ customer });
}

export async function list(req, res) {
  const customers = await customerService.listCustomers(req.auth.user.id);
  res.json({ customers });
}

export async function get(req, res) {
  const customer = await customerService.getCustomer(req.auth.user.id, req.params.id);
  res.json({ customer });
}

export async function update(req, res) {
  const customer = await customerService.updateCustomer(req.auth.user.id, req.params.id, req.input);
  res.json({ customer });
}

export async function remove(req, res) {
  await customerService.deleteCustomer(req.auth.user.id, req.params.id);
  res.status(204).end();
}
