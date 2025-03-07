import { NextRequest } from "next/server";
import { cleanupOldRequests } from "@/utils/db";

// This can be triggered by a Vercel Cron Job
export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") || "7", 10);
    const deletedCount = await cleanupOldRequests(days);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${deletedCount} old requests`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to clean up old requests",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 