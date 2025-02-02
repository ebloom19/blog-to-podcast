import Groq from "groq-sdk";
import { z } from "zod";

interface GeneratedScript {
  script: string;
}

/**
 * Generates a multi-speaker podcast dialogue script from blog content.
 *
 * @param title - The title of the blog post.
 * @param content - The body/content of the blog post.
 * @returns A promise that resolves to the generated script.
 */
export const generatePodcastScript = async (
  title: string,
  content: string
): Promise<GeneratedScript> => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not defined in environment variables.");
  }

  // Initialize the Groq client
  const client = new Groq({
    apiKey: GROQ_API_KEY,
    // Optional configurations
    // maxRetries: 2, // Number of retries on failure
    // timeout: 60000, // Request timeout in milliseconds
  });

  // Define the refined prompt for Groq
  const prompt = `
Convert the following blog post into an engaging multi-speaker podcast dialogue script, adhering strictly to the following format:

- **Only** include two speakers: Speaker 1 and Speaker 2.
- **Only** include dialogue lines starting with "Speaker 1:" or "Speaker 2:", followed by their respective dialogues.
- Ensure each speaker alternates turns appropriately.
- Maintain proper punctuation and formatting.

**Example Format:**

Speaker 1: Hey, did you catch the game last night?
Speaker 2: Of course! What a match—it had me on the edge of my seat.
Speaker 1: Same here! That last-minute goal was unreal. Who's your MVP?
Speaker 2: Gotta be the goalie. Those saves were unbelievable.
Speaker 1: Absolutely. Saved the day, literally! Are you planning to watch the next game?
Speaker 2: Oh, you bet. I'm already stocked up on snacks!

---

**Blog Post:**

Title: "${title}"

Content: "${content}"

---

**Generated Podcast Script:**
`;

  try {
    // Send the prompt to Groq to generate the script
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Replace with the actual model name if different
      temperature: 0.7, // Adjust for creativity vs. accuracy
    });

    if (
      !chatCompletion ||
      !chatCompletion.choices ||
      !chatCompletion.choices[0] ||
      !chatCompletion.choices[0].message ||
      !chatCompletion.choices[0].message.content
    ) {
      throw new Error("No response received from Groq.");
    }

    const script = chatCompletion.choices[0].message.content.trim();

    // Define a regex pattern to match each dialogue line with only Speaker 1 and Speaker 2
    const dialoguePattern = /^(Speaker 1:|Speaker 2:)\s.+$/gm;

    // Extract all matched dialogues
    const dialogues = script.match(dialoguePattern);

    if (!dialogues || dialogues.length === 0) {
      throw new Error("No valid dialogues found in the generated script.");
    }

    // Reconstruct the script to include only valid dialogues
    const validatedScript = dialogues.join(" ");

    // Additional Validation:
    // 1. Ensure only Speaker 1 and Speaker 2 are used
    const invalidSpeakers = validatedScript.match(/Speaker\s\d+:/g)?.filter(
      (speaker) => speaker !== "Speaker 1:" && speaker !== "Speaker 2:"
    );

    if (invalidSpeakers && invalidSpeakers.length > 0) {
      throw new Error(
        `Invalid speaker labels found: ${invalidSpeakers.join(", ")}. Only Speaker 1 and Speaker 2 are allowed.`
      );
    }

    // Validate using Zod to ensure minimum length and proper structure
    const schema = z
      .string()
      .min(10, "Script is too short.")
      .regex(
        /^Speaker [12]: .+$/gm,
        "Each line must start with 'Speaker 1:' or 'Speaker 2:' followed by dialogue."
      );

    const parsed = schema.safeParse(validatedScript);

    if (!parsed.success) {
      console.error("Script validation failed:", parsed.error);
      throw new Error("The generated script does not meet the expected format.");
    }

    return { script: validatedScript };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error generating podcast script:", error);
    throw new Error("Failed to generate the podcast script.");
  }
};
