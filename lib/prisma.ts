// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' }
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Add type-safe event handling
prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
  console.log('Query:', e);
});

// Handle connection errors
process.on('unhandledRejection', async (e) => {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('Prisma Client error:', e);
    await prisma.$disconnect();
    await prisma.$connect();
  }
});