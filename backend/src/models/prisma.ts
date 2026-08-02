import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Singleton de Prisma Client para evitar múltiples conexiones en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

import { Pool } from 'pg';

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || '';
  // Configurar el pool directamente para forzar UTF8 sin romper Prisma
  const pool = new Pool({ 
    connectionString: databaseUrl,
    client_encoding: 'UTF8'
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
