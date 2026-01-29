import { PrismaClient } from '@prisma/client';
import "dotenv/config";

console.log('--- Loading src/config/prisma.ts ---');

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString || typeof rawConnectionString !== 'string') {
    console.error("CRITICAL ERROR: DATABASE_URL is missing or invalid in prisma.ts");
    throw new Error("DATABASE_URL environment variable is not defined or invalid");
}

// Strip surrounding quotes if present
const connectionString = rawConnectionString.replace(/^"|"$/g, '').trim();

if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    console.error("CRITICAL ERROR: DATABASE_URL does not look like a valid PostgreSQL connection string.");
    throw new Error("Invalid DATABASE_URL format");
}

const maskedUrl = connectionString.replace(/:[^:@]+@/, ':****@');
console.log('Prisma Config: Connection string found:', maskedUrl);

let prisma: PrismaClient;

try {
    // Initialize Prisma Client with native connector
    prisma = new PrismaClient({
        datasourceUrl: connectionString,
        log: ['query', 'info', 'warn', 'error'],
    });
    console.log('Prisma Config: Native client initialized.');
} catch (error) {
    console.error("CRITICAL ERROR: Failed to initialize Prisma Client:", error);
    throw error;
}

export default prisma;
