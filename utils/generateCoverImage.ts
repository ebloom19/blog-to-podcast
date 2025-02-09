import { fal } from "@fal-ai/client";
import Groq from "groq-sdk";

/**
 * Generates a cover image for the podcast episode.
 *
 * It first uses Groq to generate a concise cover image prompt based on the blog post title and content,
 * then submits that prompt to Fal.ai's Ideogram V2 image generation model.
 *
 * @param title - The title of the blog post / podcast episode.
 * @param content - The full blog post content.
 * @returns A promise resolving to an object with a coverImageUrl property.
 */
export const generateCoverImage = async (
  title: string,
  content: string
): Promise<{ coverImageUrl: string }> => {
  // --- Step 1: Generate the image prompt via Groq ---
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not defined in environment variables.");
  }
  const groqClient = new Groq({ apiKey: GROQ_API_KEY });
  const groqPrompt = `
Generate a concise, vivid, and visually engaging prompt for a podcast cover image.
The podcast is based on a blog post with the following details:
Title: "${title}"
Content Summary: "${content.slice(0, 300)}"
The prompt should evoke a modern, creative, and professional aesthetic.
Provide only the prompt text.
  `;
  const groqResponse = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that generates creative cover image prompts.",
      },
      { role: "user", content: groqPrompt },
    ],
    max_completion_tokens: 100,
    temperature: 0.7,
  });
  const groqMessage = groqResponse.choices?.[0]?.message?.content;
  if (!groqMessage) {
    throw new Error("Failed to generate cover image prompt using Groq.");
  }
  const coverPrompt = groqMessage.trim();
  console.log("Generated cover image prompt:", coverPrompt);

  // --- Step 2: Generate the cover image via Fal.ai's Ideogram V2 ---
  const FAL_API_KEY = process.env.FAL_KEY;
  if (!FAL_API_KEY) {
    throw new Error("Fal.ai API key is not defined in environment variables.");
  }

  fal.config({
    credentials: FAL_API_KEY,
  });

  // Submit the image generation request
  const submitResponse = await fal.queue.submit("fal-ai/ideogram/v2", {
    input: {
      prompt: coverPrompt,
      aspect_ratio: "1:1",
      expand_prompt: true,
      style: "auto",
    },
  });

  const { request_id } = submitResponse;
  if (!request_id) {
    throw new Error(
      "Failed to obtain request ID from Fal.ai for image generation."
    );
  }

  // Poll for the image generation status (up to 4 minutes)
  let status = "IN_PROGRESS";
  const pollInterval = 5000; // 5 seconds
  const maxAttempts = 48;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    const statusResponse = await fal.queue.status("fal-ai/ideogram/v2", {
      requestId: request_id,
      logs: false,
    });
    status = statusResponse.status;
    console.log(
      `Cover image generation attempt ${attempt + 1}: Status - ${status}`
    );
    if (status === "COMPLETED") {
      break;
    } else if (status === "FAILED") {
      throw new Error("Fal.ai image generation failed.");
    }
  }

  if (status !== "COMPLETED") {
    throw new Error("Fal.ai image generation timed out.");
  }

  // Fetch the result of the image generation
  const resultResponse = await fal.queue.result("fal-ai/ideogram/v2", {
    requestId: request_id,
  });
  const resultData = resultResponse.data;
  if (!resultData || !resultData.images || !resultData.images[0]?.url) {
    throw new Error("Failed to retrieve the cover image from Fal.ai.");
  }

  const coverImageUrl = resultData.images[0].url;
  console.log("Generated cover image URL:", coverImageUrl);
  return { coverImageUrl };
};
