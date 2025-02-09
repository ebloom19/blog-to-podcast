import Groq from "groq-sdk";

/**
 * Generates podcast metadata (such as an episode description) based on the blog post.
 *
 * @param title - The title of the blog post.
 * @param content - The full blog post content.
 * @returns A promise that resolves to an object containing the generated description.
 */
export const generatePodcastMetadata = async (
  title: string,
  content: string
): Promise<{ description: string }> => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not defined in environment variables.");
  }

  // Initialize the Groq client
  const client = new Groq({ apiKey: GROQ_API_KEY });

  const prompt = `
 Generate a podcast episode metadata based on the following blog post details.
 
 Title: "${title}"
 
 Blog Content Summary: "${content.slice(0, 500)}"
 
 Requirements:
 - Generate a concise and engaging podcast episode description.
 - Highlight key themes and takeaways.
 - Use inviting language that encourages listening.
 
 Provide only the description text.
  `;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are an assistant that generates podcast metadata." },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 150,
    temperature: 0.7,
  });

  const message = response.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error("No response received for podcast metadata.");
  }

  return { description: message.trim() };
}; 