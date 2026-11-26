import * as productService from '../services/productService.js';

export async function create(req, res) {
  const product = await productService.createProduct(req.auth.user.id, req.input);
  res.status(201).json({ product });
}

export async function list(req, res) {
  const products = await productService.listProducts(req.auth.user.id);
  res.json({ products });
}

export async function get(req, res) {
  const product = await productService.getProduct(req.auth.user.id, req.params.id);
  res.json({ product });
}

export async function update(req, res) {
  const product = await productService.updateProduct(req.auth.user.id, req.params.id, req.input);
  res.json({ product });
}

export async function remove(req, res) {
  await productService.deleteProduct(req.auth.user.id, req.params.id);
  res.status(204).end();
}
