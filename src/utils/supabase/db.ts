import postgres from 'postgres';

// This uses the DATABASE_URL (Port 6543) you just added to .env.local
const connectionString = process.env.DATABASE_URL!;

// This is the "Fast Lane" that bypasses HTTPS
const sql = postgres(connectionString, { 
  prepare: false, // Required for Supabase Port 6543 (Transaction Mode)
  idle_timeout: 20,
  max: 10 
});

export default sql;