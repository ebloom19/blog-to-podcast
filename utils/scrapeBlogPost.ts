import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

interface ScrapedData {
  blog_post: BlogPost;
}

interface BlogPost {
  title: string;
  content: string;
}

// Initialize the Firecrawl app with the API key
const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export const scrapeBlogPost = async (url: string): Promise<ScrapedData> => {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error(
      "Firecrawl API key is not defined in environment variables."
    );
  }

  try {
    // Define schema to extract 'blog_post' with 'title' and 'content' from the blog post
    const schema = z.object({
      blog_post: z.object({
        title: z.string(),
        content: z.string(),
      }),
    });

    // Perform the extraction using the SDK
    const extractResult = await app.extract(
      [
        url, // Array of URLs to extract from
      ],
      {
        prompt: "Extract the title and the entire content of the blog post from the given URL.",
        schema,
      }
    );

    if (!extractResult.success) {
      throw new Error(`Failed to extract the blog post: ${extractResult.error}`);
    }

    const extractedData = extractResult.data;

    if (!extractedData) {
      throw new Error("LLM extraction data not found.");
    }

    // Validate the extracted data using Zod
    const parsed = schema.safeParse({...extractedData});

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Error("Scraped data does not match the expected schema.");
    }

    const { blog_post } = parsed.data;

    if (!blog_post.title || !blog_post.content) {
      throw new Error(
        "The scraped content does not contain a valid title and content."
      );
    }

    return { blog_post };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error scraping blog post:", error);
    throw new Error("Failed to scrape the blog post.");
  }
};
