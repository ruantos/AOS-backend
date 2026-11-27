import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  product: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../src/config/database.js', () => ({ prisma: prismaMock }));

import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../../src/services/productService.js';
import { HttpError } from '../../src/services/httpError.js';

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria um produto associado ao usuário e serializa o preço', async () => {
    prismaMock.product.create.mockResolvedValue({
      id: 'product-1',
      name: 'Café',
      price: 12,
    });

    const result = await createProduct('user-1', { name: 'Café', price: 12 });

    expect(prismaMock.product.create).toHaveBeenCalledWith({
      data: { name: 'Café', price: 12, createdById: 'user-1' },
    });
    expect(result).toEqual({ id: 'product-1', name: 'Café', price: '12.00' });
  });

  it('lista apenas produtos ativos do usuário', async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { id: 'product-1', name: 'Café', price: 12 },
      { id: 'product-2', name: 'Leite', price: 6.5 },
    ]);

    const result = await listProducts('user-1');

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: { createdById: 'user-1', deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    expect(result.map((product) => product.price)).toEqual(['12.00', '6.50']);
  });

  it('retorna NOT_FOUND quando o produto não pertence ao usuário ou não existe', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null);

    await expect(getProduct('user-1', 'missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('atualiza um produto do usuário', async () => {
    prismaMock.product.update.mockResolvedValue({
      id: 'product-1',
      name: 'Café especial',
      price: 15,
    });

    const result = await updateProduct('user-1', 'product-1', { name: 'Café especial' });

    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1', createdById: 'user-1', deletedAt: null },
      data: { name: 'Café especial' },
    });
    expect(result.price).toBe('15.00');
  });

  it('marca um produto como excluído', async () => {
    prismaMock.product.update.mockResolvedValue({});

    await deleteProduct('user-1', 'product-1');

    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'product-1', createdById: 'user-1', deletedAt: null },
        data: expect.objectContaining({ active: false }),
      }),
    );
  });

  it('usa HttpError com os dados informados', () => {
    const error = new HttpError(404, 'NOT_FOUND', 'Não encontrado');

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});
