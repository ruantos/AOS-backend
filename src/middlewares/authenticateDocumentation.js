import { authenticate } from './authenticate.js';
import { docsCookieName } from '../config/docsSession.js';

export function authenticateDocumentation(req, res, next) {
  if (req.get('authorization') === undefined) {
    const cookie = req.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${docsCookieName}=`));
    if (cookie) {
      try {
        req.headers.authorization = `Bearer ${decodeURIComponent(cookie.slice(docsCookieName.length + 1))}`;
      } catch {
        req.headers.authorization = 'Bearer invalid';
      }
    }
  }
  return authenticate(req, res, next);
}
