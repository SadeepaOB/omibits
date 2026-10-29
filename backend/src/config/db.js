import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file (or parent .env)
dotenv.config();

const { Pool } = pg;

// Connection string from environment variables
const connectionString = process.env.DATABASE_URL;

// Configure SSL based on environment and provider
// Supabase requires SSL encryption for hosted connections.
const isProduction = process.env.NODE_ENV === 'production';
const isSupabase = connectionString && (connectionString.includes('supabase') || connectionString.includes('sslmode=require'));

const poolConfig = {
  connectionString,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error if connection takes > 5 seconds
};

// Enable SSL if running on Supabase or production
if (isSupabase || isProduction) {
  poolConfig.ssl = {
    rejectUnauthorized: false, // Required for cloud-hosted certificates in standard Node environments
  };
}

// Active pool instance
let poolInstance = connectionString ? new Pool(poolConfig) : null;

if (poolInstance) {
  // Listen for unexpected pool errors on idle clients
  poolInstance.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });
}

/**
 * Execute a parameterized SQL query using the pool.
 * @param {string} text - SQL query string with parameterized placeholders ($1, $2, ...)
 * @param {Array} params - Array of parameter values
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params) {
  if (!poolInstance) {
    throw new Error('Database pool is not configured. Please check your DATABASE_URL environment variable.');
  }
  return poolInstance.query(text, params);
}

/**
 * Get a client from the pool for manual transactions.
 * Remember to release the client when done!
 */
export async function getClient() {
  if (!poolInstance) {
    throw new Error('Database pool is not configured. Please check your DATABASE_URL environment variable.');
  }
  return poolInstance.connect();
}

/**
 * Close the pool gracefully during server shutdown.
 */
export async function closePool() {
  if (poolInstance) {
    await poolInstance.end();
  }
}

/**
 * For testing purposes: allows injecting a mock pool or query function.
 */
export function setMockPool(mock) {
  poolInstance = mock;
}

export default {
  query,
  getClient,
  closePool,
  setMockPool,
};
