"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
// Singleton de Prisma Client para evitar múltiples conexiones en desarrollo
const globalForPrisma = globalThis;
const pg_1 = require("pg");
function createPrismaClient() {
    const databaseUrl = process.env.DATABASE_URL || '';
    // Configurar el pool directamente para forzar UTF8 sin romper Prisma
    const pool = new pg_1.Pool({
        connectionString: databaseUrl,
        client_encoding: 'UTF8'
    });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    return new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
}
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map