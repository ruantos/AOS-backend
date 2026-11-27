export const docsCookieName = 'recifeDocs';

export function docsCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api-docs' };
}
