import { PrismaClient } from '@prisma/client';

// Singleton instance of Prisma Client to manage DB connection pooling efficiently
export const prisma = new PrismaClient();
