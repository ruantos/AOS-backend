import * as userService from '../services/userService.js';

export async function getMe(req, res) {
  const user = await userService.getCurrentUser(req.auth.user.id);
  res.json({ user });
}

export async function updateMe(req, res) {
  const user = await userService.updateCurrentUser(req.auth.user.id, req.auth.sessionId, req.input);
  res.json({ user });
}

export async function deactivateMe(req, res) {
  await userService.deactivateCurrentUser(req.auth.user.id, req.auth.sessionId);
  res.status(204).end();
}
