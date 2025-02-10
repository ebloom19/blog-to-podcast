import { NextRequest } from "next/server";
import { scrapeBlogPost } from "@/utils/scrapeBlogPost";
import { generatePodcastScript } from "@/utils/generatePodcastScript";
import { generatePodcastAudio } from "@/utils/generatePodcastAudio";
import { generateCoverImage } from "@/utils/generateCoverImage";
import { generatePodcastMetadata } from "@/utils/generatePodcastMetadata";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid URL provided." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Step 1: Scrape the blog post content
    const { title, content } = (await scrapeBlogPost(url)).blogPost;
    console.log("Scraped Blog Content:", title, content);

    // Step 2: Generate the podcast dialogue script
    const { script } = await generatePodcastScript(title, content);
    console.log("Generated Podcast Script:", script);

    // Step 3: Generate podcast metadata (e.g., episode description)
    const { description } = await generatePodcastMetadata(title, script);
    console.log("Generated Podcast Metadata:", description);

    // Step 4: Generate a cover image for the podcast episode using Fal.ai
    const { coverImageUrl } = await generateCoverImage(title, script);
    console.log("Generated Podcast Cover Image URL:", coverImageUrl);

    // Step 5: Generate the podcast audio using Fal.ai
    const { audioUrl, audioDuration } = await generatePodcastAudio(script);
    console.log("Generated Podcast Audio URL:", audioUrl);

    return new Response(
      JSON.stringify({
        id: uuidv4(),
        success: true,
        message: "Podcast generation completed successfully.",
        audioUrl: audioUrl,
        audioDuration: audioDuration,
        coverImageUrl: coverImageUrl,
        title: title,
        description: description,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error during podcast generation:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Podcast generation failed.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
