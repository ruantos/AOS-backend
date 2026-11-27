import * as userService from '../services/userService.js';

export async function getMe(req, res) {
  try {
    console.log(
        `[USER][GET_ME] Usuário ${req.auth.user.id} consultando seus dados`
    );

    const user = await userService.getCurrentUser(
        req.auth.user.id
    );

    res.json({ user });
  } catch (error) {
    console.error(
        `[USER][GET_ME] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao consultar usuário',
      error: error.message
    });
  }
}

export async function updateMe(req, res) {
  try {
    console.log(
        `[USER][UPDATE_ME] Usuário ${req.auth.user.id} atualizando perfil`
    );

    const user = await userService.updateCurrentUser(
        req.auth.user.id,
        req.auth.sessionId,
        req.input
    );

    res.json({ user });
  } catch (error) {
    console.error(
        `[USER][UPDATE_ME] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao atualizar usuário',
      error: error.message
    });
  }
}

export async function deactivateMe(req, res) {
  try {
    console.log(
        `[USER][DEACTIVATE_ME] Usuário ${req.auth.user.id} desativando conta`
    );

    await userService.deactivateCurrentUser(
        req.auth.user.id,
        req.auth.sessionId
    );

    res.status(204).end();
  } catch (error) {
    console.error(
        `[USER][DEACTIVATE_ME] Erro: ${error.message}`
    );

    res.status(500).json({
      message: 'Erro ao desativar usuário',
      error: error.message
    });
  }
}
