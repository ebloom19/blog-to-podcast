import { neon } from "@neondatabase/serverless";

// Create a SQL client with your connection string
const sql = neon(process.env.DATABASE_URL!);

export async function saveRequestStatus(requestId: string, status: any) {
  try {
    await sql`
      INSERT INTO podcast_requests (id, status_data)
      VALUES (${requestId}, ${JSON.stringify(status)})
      ON CONFLICT (id) DO UPDATE
      SET status_data = ${JSON.stringify(status)}
    `;
  } catch (error) {
    console.error("Error saving request status:", error);
    throw error;
  }
}

export async function getRequestStatus(requestId: string) {
  try {
    const result = await sql`
      SELECT status_data FROM podcast_requests
      WHERE id = ${requestId}
    `;
    return result[0]?.status_data || null;
  } catch (error) {
    console.error("Error getting request status:", error);
    throw error;
  }
}

export async function cleanupOldRequests(olderThanDays = 7) {
  try {
    const result = await sql`
      DELETE FROM podcast_requests
      WHERE created_at < NOW() - INTERVAL '${olderThanDays} days'
      RETURNING id
    `;
    return result.length;
  } catch (error) {
    console.error("Error cleaning up old requests:", error);
    throw error;
  }
} 