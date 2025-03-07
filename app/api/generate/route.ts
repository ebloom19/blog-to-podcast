import { NextRequest } from "next/server";
import { scrapeBlogPost } from "@/utils/scrapeBlogPost";
import { generatePodcastScript } from "@/utils/generatePodcastScript";
import { generatePodcastAudio } from "@/utils/generatePodcastAudio";
import { generateCoverImage } from "@/utils/generateCoverImage";
import { generatePodcastMetadata } from "@/utils/generatePodcastMetadata";
import { v4 as uuidv4 } from "uuid";
import { saveRequestStatus, getRequestStatus } from "@/utils/db";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid URL provided." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Generate a unique request ID
  const requestId = uuidv4();
  
  // Initialize request status in the database
  const initialStatus = {
    status: "processing",
    step: "initializing",
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  
  await saveRequestStatus(requestId, initialStatus);

  // Start the generation process in the background
  generatePodcastAsync(requestId, url);

  // Return immediately with the request ID
  return new Response(
    JSON.stringify({
      success: true,
      message: "Podcast generation started.",
      requestId: requestId,
    }),
    { status: 202, headers: { "Content-Type": "application/json" } }
  );
}

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId");
  
  if (!requestId) {
    return new Response(
      JSON.stringify({ success: false, message: "Request ID is required." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const requestData = await getRequestStatus(requestId);
  
  if (!requestData) {
    return new Response(
      JSON.stringify({ success: false, message: "Request not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      ...requestData,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function generatePodcastAsync(requestId: string, url: string) {
  try {
    // Step 1: Scrape the blog post content
    await saveRequestStatus(requestId, {
      status: "processing",
      step: "scraping_blog",
      progress: 10,
    });
    
    const { title, content } = (await scrapeBlogPost(url)).blogPost;
    
    // Step 2: Generate the podcast dialogue script
    await saveRequestStatus(requestId, {
      status: "processing",
      step: "generating_script",
      progress: 30,
    });
    
    const { script } = await generatePodcastScript(title, content);
    
    // Step 3: Generate podcast metadata
    await saveRequestStatus(requestId, {
      status: "processing",
      step: "generating_metadata",
      progress: 50,
    });
    
    const { description } = await generatePodcastMetadata(title, script);
    
    // Step 4: Generate a cover image
    await saveRequestStatus(requestId, {
      status: "processing",
      step: "generating_cover_image",
      progress: 70,
    });
    
    const { coverImageUrl } = await generateCoverImage(title, script);
    
    // Step 5: Generate the podcast audio
    await saveRequestStatus(requestId, {
      status: "processing",
      step: "generating_audio",
      progress: 90,
    });
    
    const { audioUrl, audioDuration } = await generatePodcastAudio(script);
    
    // Update with completed data
    await saveRequestStatus(requestId, {
      status: "completed",
      step: "completed",
      progress: 100,
      completedAt: new Date().toISOString(),
      data: {
        id: requestId,
        audioUrl,
        audioDuration,
        coverImageUrl,
        title,
        description,
      },
    });

  } catch (error: any) {
    console.error("Error during podcast generation:", error.message);
    
    // Update with error status
    await saveRequestStatus(requestId, {
      status: "failed",
      error: error.message,
      completedAt: new Date().toISOString(),
    });
  }
}
