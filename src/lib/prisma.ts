// Prisma client singleton helper
// --------------------------------
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
    // Prevent re-declaring the global var in every file
    // eslint-disable-next-line no-var, vars-on-top
    var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma =
    global.prisma ??
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
    });

// In dev, attach to global to reuse the same instance on hot-reloads
if (process.env.NODE_ENV === 'development') {
    global.prisma = prisma;
}

export default prisma;
