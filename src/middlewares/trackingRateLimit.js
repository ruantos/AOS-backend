import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { prisma } from '../config/database.js';
import { authConfig } from '../config/auth.js';

function clientAddress(req) {
  const forwarded = process.env.VERCEL === '1' ? req.get('x-forwarded-for')?.trim() : undefined;
  const address = forwarded && isIP(forwarded) ? forwarded : req.socket.remoteAddress;
  if (!address) return 'unknown';
  if (isIP(address) === 6) {
    const canonical = new URL(`http://[${address.split('%')[0]}]/`).hostname.toLowerCase();
    const mapped = canonical.match(/^\[::ffff:([0-9a-f]+):([0-9a-f]+)\]$/);
    if (mapped) {
      const high = parseInt(mapped[1], 16);
      const low = parseInt(mapped[2], 16);
      return [high >> 8, high & 255, low >> 8, low & 255].join('.');
    }
    return canonical;
  }
  return address;
}

export async function trackingRateLimit(req, res, next) {
  const key = createHmac('sha256', authConfig.secret).update(`tracking:${clientAddress(req)}`).digest('hex');
  const [bucket] = await prisma.$queryRaw`
    INSERT INTO "TrackingRateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, CURRENT_TIMESTAMP + INTERVAL '1 minute')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "TrackingRateLimit"."expiresAt" <= CURRENT_TIMESTAMP THEN 1 ELSE LEAST("TrackingRateLimit"."count" + 1, 31) END,
      "expiresAt" = CASE WHEN "TrackingRateLimit"."expiresAt" <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + INTERVAL '1 minute' ELSE "TrackingRateLimit"."expiresAt" END
    RETURNING "count", GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - CURRENT_TIMESTAMP))))::integer AS "retryAfter"
  `;
  res.set('Cache-Control', 'no-store');
  res.set('X-RateLimit-Limit', '30');
  res.set('X-RateLimit-Remaining', String(Math.max(0, 30 - bucket.count)));
  if (bucket.count > 30) {
    res.set('Retry-After', String(bucket.retryAfter));
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Muitas consultas. Aguarde um minuto e tente novamente.' } });
  }
  if (bucket.count === 1) {
    await prisma.$executeRaw`DELETE FROM "TrackingRateLimit" WHERE "expiresAt" < CURRENT_TIMESTAMP - INTERVAL '1 day'`;
  }
  return next();
}
