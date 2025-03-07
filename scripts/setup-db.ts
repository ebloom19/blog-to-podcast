import { neon } from "@neondatabase/serverless";

// This script is used to setup the database for the first time
async function setupDatabase() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    // Create the podcast_requests table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS podcast_requests (
        id TEXT PRIMARY KEY,
        status_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS podcast_requests_created_at_idx ON podcast_requests(created_at)
    `;
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

setupDatabase()
  .catch(console.error); 