import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaMariaDb(
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3309,
    connectionLimit: 5,
    user: process.env.DB_USER || "financeuser",
    password: process.env.DB_PASSWORD || "financepass"
  },
  { database: process.env.DB_NAME || "financeapp" }
)

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
