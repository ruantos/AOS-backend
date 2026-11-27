import { beforeEach, describe, expect, it, vi } from 'vitest';

const productServiceMock = vi.hoisted(() => ({
  createProduct: vi.fn(),
  listProducts: vi.fn(),
  getProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock('../../src/services/productService.js', () => productServiceMock);

import * as productController from '../../src/controllers/productController.js';

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
}

describe('productController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria produto com 201 usando o usuário autenticado', async () => {
    const req = { auth: { user: { id: 'user-1' } }, input: { name: 'Café' } };
    const res = createResponse();
    const next = vi.fn();
    productServiceMock.createProduct.mockResolvedValue({ id: 'product-1', name: 'Café' });

    await productController.create(req, res, next);

    expect(productServiceMock.createProduct).toHaveBeenCalledWith('user-1', { name: 'Café' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ product: { id: 'product-1', name: 'Café' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('lista os produtos e retorna a resposta JSON', async () => {
    const req = { auth: { user: { id: 'user-1' } } };
    const res = createResponse();
    const next = vi.fn();
    productServiceMock.listProducts.mockResolvedValue([{ id: 'product-1' }]);

    await productController.list(req, res, next);

    expect(productServiceMock.listProducts).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ products: [{ id: 'product-1' }] });
  });

  it('encaminha erros da camada de serviço para next', async () => {
    const req = { auth: { user: { id: 'user-1' } }, params: { id: 'missing' } };
    const res = createResponse();
    const next = vi.fn();
    const error = new Error('falha');
    productServiceMock.getProduct.mockRejectedValue(error);

    await productController.get(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('remove um produto com 204', async () => {
    const req = { auth: { user: { id: 'user-1' } }, params: { id: 'product-1' } };
    const res = createResponse();
    const next = vi.fn();
    productServiceMock.deleteProduct.mockResolvedValue();

    await productController.remove(req, res, next);

    expect(productServiceMock.deleteProduct).toHaveBeenCalledWith('user-1', 'product-1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});
