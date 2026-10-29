import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is not defined.');
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
    console.log('Connected. Reading 002_seed_data.sql...');

    const seedPath = path.join(__dirname, '../../migrations/002_seed_data.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed data script...');
    await client.query(sql);

    console.log('✅ Sample seed data inserted successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
