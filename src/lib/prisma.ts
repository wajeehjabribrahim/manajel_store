import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Cached in production too: on serverless each route bundle that imports this
// module would otherwise open its own connection pool inside the same instance,
// multiplying connections against a 50-connection Postgres limit.
globalForPrisma.prisma = prisma;
