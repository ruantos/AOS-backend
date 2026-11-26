import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL deve ser configurada.');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });

export const prisma = new PrismaClient({ adapter });
