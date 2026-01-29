import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

console.log('--- Starting Connection Test ---');

const rawConnectionString = process.env.DATABASE_URL;
console.log("Environment DATABASE_URL found:", !!rawConnectionString);

if (!rawConnectionString) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
}

// Strip quotes if present
const connectionString = rawConnectionString.replace(/^"|"$/g, '');

// Log masked connection string
const masked = connectionString.replace(/:([^:@]+)@/, ':****@');
console.log("Using connection string:", masked);

const pool = new Pool({ connectionString });

pool.connect()
    .then(client => {
        console.log("Successfully connected to Neon!");
        return client.query('SELECT NOW()')
            .then(res => {
                console.log("Query success! Current time from DB:", res.rows[0]);
                client.release();
                return pool.end();
            });
    })
    .catch(err => {
        console.error("Connection FAILED:", err);
        process.exit(1);
    });
