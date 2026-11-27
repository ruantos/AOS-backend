import * as productService from '../services/productService.js';

export async function create(req, res, next) {
  try {
    console.log(
        `[PRODUCT][CREATE] Usuário ${req.auth.user.id} criando produto`
    );

    const product = await productService.createProduct(
        req.auth.user.id,
        req.input
    );

    res.status(201).json({ product });
  } catch (error) {
    console.error(
        `[PRODUCT][CREATE] Erro ao criar produto: ${error.message}`
    );

    return next(error);
  }
}

export async function list(req, res, next) {
  try {
    console.log(
        `[PRODUCT][LIST] Usuário ${req.auth.user.id} listando produtos`
    );

    const products = await productService.listProducts(req.auth.user.id);

    res.json({ products });
  } catch (error) {
    console.error(
        `[PRODUCT][LIST] Erro ao listar produtos: ${error.message}`
    );

    return next(error);
  }
}

export async function get(req, res, next) {
  try {
    console.log(
        `[PRODUCT][GET] Usuário ${req.auth.user.id} buscando produto ${req.params.id}`
    );

    const product = await productService.getProduct(
        req.auth.user.id,
        req.params.id
    );

    res.json({ product });
  } catch (error) {
    console.error(
        `[PRODUCT][GET] Erro ao buscar produto: ${error.message}`
    );

    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    console.log(
        `[PRODUCT][UPDATE] Usuário ${req.auth.user.id} atualizando produto ${req.params.id}`
    );

    const product = await productService.updateProduct(
        req.auth.user.id,
        req.params.id,
        req.input
    );

    res.json({ product });
  } catch (error) {
    console.error(
        `[PRODUCT][UPDATE] Erro ao atualizar produto: ${error.message}`
    );

    return next(error);
  }
}

export async function remove(req, res, next) {
  try {
    console.log(
        `[PRODUCT][DELETE] Usuário ${req.auth.user.id} removendo produto ${req.params.id}`
    );

    await productService.deleteProduct(
        req.auth.user.id,
        req.params.id
    );

    res.status(204).end();
  } catch (error) {
    console.error(
        `[PRODUCT][DELETE] Erro ao remover produto: ${error.message}`
    );

    return next(error);
  }
}
