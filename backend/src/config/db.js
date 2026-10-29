import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
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
  poolInstance.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });
}

// Fallback for development demonstration when DATABASE_URL is not yet configured locally
let fallbackDevDb = null;
if (!connectionString && process.env.NODE_ENV !== 'test') {
  console.log('-------------------------------------------------------------------');
  console.log('ℹ️  [NOTICE] DATABASE_URL is not set.');
  console.log('   Running with in-memory development database for demonstration.');
  console.log('   To connect to your real Supabase PostgreSQL database, configure');
  console.log('   DATABASE_URL in backend/.env or the root .env file.');
  console.log('-------------------------------------------------------------------');
  const { createMockDatabase, sampleInitialData } = await import('../../tests/mockDb.js');
  fallbackDevDb = createMockDatabase(sampleInitialData);
}

/**
 * Execute a parameterized SQL query using the pool or dev demo database.
 * @param {string} text - SQL query string with parameterized placeholders ($1, $2, ...)
 * @param {Array} params - Array of parameter values
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params) {
  if (poolInstance) {
    return poolInstance.query(text, params);
  }
  if (fallbackDevDb) {
    return fallbackDevDb.query(text, params);
  }
  throw new Error('Database pool is not configured. Please check your DATABASE_URL environment variable.');
}

/**
 * Get a client from the pool for manual transactions.
 */
export async function getClient() {
  if (poolInstance) {
    return poolInstance.connect();
  }
  if (fallbackDevDb) {
    return {
      query: fallbackDevDb.query,
      release: () => {},
    };
  }
  throw new Error('Database pool is not configured. Please check your DATABASE_URL environment variable.');
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
