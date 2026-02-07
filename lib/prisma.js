import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// 这里的地址直接写死，跳过 process.env.DATABASE_URL
const DATABASE_URL = "postgresql://neondb_owner:npg_STrFL5J0KRCU@ep-quiet-bird-aieej4x4.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;