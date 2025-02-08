// Removed axios in favor of native fetch

import { z } from "zod";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

interface ScrapedData {
  blogPost: {
    title: string;
    content: string;
  };
}

/**
 * Fetches the rendered HTML content from the given URL using chrome-aws-lambda and puppeteer-core.
 * This method is suited for Vercel's serverless environment.
 */
const fetchPageContent = async (url: string): Promise<string> => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    // Use networkidle2 which is a bit more forgiving.
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const content = await page.content();
    return content;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

/**
 * Calls Llama (or a similar LLM) with a prompt using a Groq-like query style to extract the blog post data.
 * Replace this placeholder with your actual Llama integration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callLLama = async (htmlContent: string): Promise<any> => {
  const prompt = `
Extract the title and the full content from the following rendered HTML.
Determine whether the content is a blog post or an article using your own assessment.
Return the result as a JSON object in the following format:
{
  "blog_post": {
    "title": "extracted title",
    "content": "extracted content"
  }
}

HTML Content:

${htmlContent}`;

  console.log("LLama prompt:", prompt);

  // Define schema for blog post extraction
  const blogPostSchema = {
    description: "Extract blog post information",
    type: SchemaType.OBJECT,
    properties: {
      blog_post: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description: "Title of the blog post",
            nullable: false,
          },
          content: {
            type: SchemaType.STRING,
            description: "Content of the blog post",
            nullable: false,
          },
        },
        required: ["title", "content"],
      },
    },
    required: ["blog_post"],
  };

  // Use Google Generative AI exclusively
  const geminiAPIKey = process.env.GEMINI_API_KEY;
  if (!geminiAPIKey) {
    throw new Error("GEMINI_API_KEY not set in environment variables.");
  }
  const genAiClient = new GoogleGenerativeAI(geminiAPIKey);
  const model = genAiClient.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: blogPostSchema,
    },
  });
  console.time("googleGenAI => extractBlogPost");
  const geminiResult = await model.generateContent(prompt);
  console.timeEnd("googleGenAI => extractBlogPost");
  const rawAnswer = geminiResult.response.text();
  console.log("gemini rawAnswer: ", rawAnswer);

  // Clean the AI response (remove markdown formatting if present)
  const cleanAIResponse = (response: string): string => {
    return response.replace(/```json|```/g, "").trim();
  };

  const cleanedAnswer = cleanAIResponse(rawAnswer);
  console.log("cleanedAnswer: ", cleanedAnswer);

  try {
    const jsonResponse = JSON.parse(cleanedAnswer);
    return jsonResponse;
  } catch (error) {
    console.error("Failed to parse response as JSON:", error);
    throw new Error("Failed to parse response as JSON");
  }
};

export const scrapeBlogPost = async (url: string): Promise<ScrapedData> => {
  try {
    // Fetch the rendered HTML of the given URL.
    const pageContent = await fetchPageContent(url);

    // Use Llama (Google Generative AI) to extract the blog post data from the HTML content.
    const extractionResult = await callLLama(pageContent);

    // Validate the extraction result with a defined schema.
    const schema = z.object({
      blogPost: z.object({
        title: z.string(),
        content: z.string(),
      }),
    });

    const parsed = schema.safeParse(extractionResult);

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Error("Extracted data does not match the expected schema.");
    }

    const { blogPost } = parsed.data;

    if (!blogPost.title || !blogPost.content) {
      throw new Error(
        "The scraped content does not contain a valid title and content."
      );
    }

    return { blogPost };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error scraping blog post:", error);
    throw new Error("Failed to scrape the blog post.");
  }
};
