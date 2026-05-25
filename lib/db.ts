import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Vytvoříme instanci bez jakýchkoliv parametrů v konstruktoru. 
// Pokud by chyběla URL v .env, Prisma vyhodí chybu až při reálném databázovém dotazu,
// ne při pouhém načtení souboru Next.js serverem.
export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}