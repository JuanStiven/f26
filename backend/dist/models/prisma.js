"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
// Singleton de Prisma Client para evitar múltiples conexiones en desarrollo
const globalForPrisma = globalThis;
function createPrismaClient() {
    // Extraer la URL directa de PostgreSQL desde DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || '';
    const adapter = new adapter_pg_1.PrismaPg(databaseUrl);
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