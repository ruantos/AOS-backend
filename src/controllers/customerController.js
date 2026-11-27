import * as customerService from '../services/customerService.js';

export async function create(req, res) {
  try {
    console.log(
        `[CUSTOMER][CREATE] Usuário ${req.auth.user.id} criando cliente`
    );

    const customer = await customerService.createCustomer(
        req.auth.user.id,
        req.input
    );

    res.status(201).json({ customer });
  } catch (error) {
    console.error(
        `[CUSTOMER][CREATE] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao criar cliente',
      error: error.message
    });
  }
}

export async function list(req, res) {
  try {
    console.log(
        `[CUSTOMER][LIST] Usuário ${req.auth.user.id} listando clientes`
    );

    const customers = await customerService.listCustomers(
        req.auth.user.id
    );

    res.json({ customers });
  } catch (error) {
    console.error(
        `[CUSTOMER][LIST] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao listar clientes',
      error: error.message
    });
  }
}

export async function get(req, res) {
  try {
    console.log(
        `[CUSTOMER][GET] Usuário ${req.auth.user.id} consultando cliente ${req.params.id}`
    );

    const customer = await customerService.getCustomer(
        req.auth.user.id,
        req.params.id
    );

    res.json({ customer });
  } catch (error) {
    console.error(
        `[CUSTOMER][GET] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao consultar cliente',
      error: error.message
    });
  }
}

export async function update(req, res) {
  try {
    console.log(
        `[CUSTOMER][UPDATE] Usuário ${req.auth.user.id} atualizando cliente ${req.params.id}`
    );

    const customer = await customerService.updateCustomer(
        req.auth.user.id,
        req.params.id,
        req.input
    );

    res.json({ customer });
  } catch (error) {
    console.error(
        `[CUSTOMER][UPDATE] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao atualizar cliente',
      error: error.message
    });
  }
}

export async function remove(req, res) {
  try {
    console.log(
        `[CUSTOMER][DELETE] Usuário ${req.auth.user.id} removendo cliente ${req.params.id}`
    );

    await customerService.deleteCustomer(
        req.auth.user.id,
        req.params.id
    );

    res.status(204).end();
  } catch (error) {
    console.error(
        `[CUSTOMER][DELETE] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao remover cliente',
      error: error.message
    });
  }
}
