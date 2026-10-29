import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is not defined.');
    console.error('Please configure DATABASE_URL in your .env file or environment.');
    process.exit(1);
  }

  const isSupabase = connectionString.includes('supabase') || connectionString.includes('sslmode=require');
  const client = new pg.Client({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully. Reading 001_initial_schema.sql...');

    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await client.query(sql);

    console.log('✅ Schema migration applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
