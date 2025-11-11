import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as NodePool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Detect if we're using Neon (WebSocket-based) or standard PostgreSQL
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech') || 
                       process.env.DATABASE_URL.includes('neon.cloud');

let pool: NeonPool | NodePool;
let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleNode>;

if (isNeonDatabase) {
  // Use Neon serverless driver with WebSocket support (for Replit)
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
  console.log("🔌 Using Neon serverless database driver");
} else {
  // Use standard node-postgres driver (for local/production PostgreSQL)
  pool = new NodePool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNode({ client: pool, schema });
  console.log("🔌 Using standard PostgreSQL driver");
}

export { pool, db };