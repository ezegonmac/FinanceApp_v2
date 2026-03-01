import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaMariaDb(
  {
    host: "localhost",
    port: 3309,
    connectionLimit: 5,
    user: "financeuser",
    password: "financepass"
  },
  { database: "financeapp" }
)

// export const prisma = new PrismaClient({ adapter });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
