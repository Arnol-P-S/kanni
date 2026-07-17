import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  kanniPrisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required before Kanni can access school data.");
  }

  const configuredPoolSize = Number(process.env.DATABASE_POOL_SIZE ?? 10);
  const poolSize =
    Number.isInteger(configuredPoolSize) &&
    configuredPoolSize >= 1 &&
    configuredPoolSize <= 50
      ? configuredPoolSize
      : 10;
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    max: poolSize,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });
}

let productionClient: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    productionClient ??= createClient();
    return productionClient;
  }

  globalForPrisma.kanniPrisma ??= createClient();
  return globalForPrisma.kanniPrisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
