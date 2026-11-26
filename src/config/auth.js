import 'dotenv/config';

const secret = process.env.JWT_SECRET;
const ttlSeconds = Number(process.env.JWT_TTL_SECONDS ?? 3600);

if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('JWT_SECRET deve conter pelo menos 32 bytes.');
}

if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 86400) {
  throw new Error('JWT_TTL_SECONDS deve ser um inteiro entre 60 e 86400.');
}

export const authConfig = {
  secret,
  ttlSeconds,
  issuer: 'recife-express',
  audience: 'recife-express-api',
};
