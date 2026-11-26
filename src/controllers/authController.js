import * as authService from '../services/authService.js';

export async function signup(req, res) {
  const user = await authService.signup(req.input);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const session = await authService.login(req.input);
  res.set('Cache-Control', 'no-store').json(session);
}

export async function logout(req, res) {
  await authService.logout(req.auth.user.id, req.auth.sessionId);
  res.status(204).end();
}
