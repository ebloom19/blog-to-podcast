export const maxDuration = 300; // 5 minutes

import { NextRequest } from "next/server";
import { scrapeBlogPost } from "@/utils/scrapeBlogPost";
import { generatePodcastScript } from "@/utils/generatePodcastScript";
import { generatePodcastAudio } from "@/utils/generatePodcastAudio";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid URL provided." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Define SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
    
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ progress: 0, message: "Podcast generation started." });

        // Step 1: Scrape the blog post content
        send({ progress: 5, message: "Scraping Blog Content..." });
        const { title, content } = (await scrapeBlogPost(url)).blog_post;
        console.log("Scraped Blog Content:", title, content);

        // Step 2: Generate the podcast dialogue script
        send({ progress: 10, message: "Generating Script..." });
        const { script } = await generatePodcastScript(title, content);
        console.log("Generated Podcast Script:", script);

        // Step 3: Generate the podcast audio using Fal.ai
        send({ progress: 30, message: "Generating Audio..." });
        const audioUrl = await generatePodcastAudio(script);
        console.log("Generated Podcast Audio URL:", audioUrl);

        send({ progress: 100, message: "Podcast generation completed successfully.", audioUrl });

        controller.close();
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error during podcast generation:", error.message);
        send({ progress: -1, message: "Podcast generation failed." });
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
