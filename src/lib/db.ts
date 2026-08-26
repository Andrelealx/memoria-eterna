import { PrismaClient } from "@prisma/client";

// Singleton do Prisma Client (evita múltiplas conexões em dev/HMR).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
