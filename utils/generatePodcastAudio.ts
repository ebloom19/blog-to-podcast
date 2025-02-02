import { fal } from "@fal-ai/client";

/**
 * Represents the structure of the Fal.ai TTS audio response.
 */
interface FalAIResponse {
  audio: {
    url: string;
    duration: number;
    file_size?: number;
    file_name?: string;
    content_type?: string;
  };
}

/**
 * Generates podcast audio by sending the script to Fal.ai's TTS service.
 *
 * @param script - The podcast dialogue script with speaker labels.
 * @returns A promise that resolves to the audio URL.
 */
export const generatePodcastAudio = async (script: string): Promise<string> => {
  const FAL_API_KEY = process.env.FAL_KEY; // Ensure FAL_KEY is set in .env.local

  if (!FAL_API_KEY) {
    throw new Error("Fal.ai API key is not defined in environment variables.");
  }

  // Configure the Fal.ai client with the API key
  fal.config({
    credentials: FAL_API_KEY,
  });

  // Define the input payload based on the provided schema
  const inputPayload = {
    input: script,
    voices: [
      {
        voice: "Ava (English (AU)/Australian)",
        turn_prefix: "Speaker 1: ",
      },
      {
        voice: "Tilly (English (AU)/Australian)",
        turn_prefix: "Speaker 2: ",
      },
    ],
  };

  try {
    // Step 1: Submit the TTS request to Fal.ai
    const submitResponse = await fal.queue.submit("fal-ai/playai/tts/dialog", {
      input: inputPayload,
    });

    const { request_id } = submitResponse;

    if (!request_id) {
      throw new Error("Failed to obtain request ID from Fal.ai.");
    }

    // Step 2: Polling for the request status
    let status = "IN_PROGRESS";
    const pollInterval = 5000; // 5 seconds
    const maxAttempts = 48; // Poll for up to 4 minutes

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fal.queue.status(
        "fal-ai/playai/tts/dialog",
        {
          requestId: request_id,
          logs: false, // Set to true if you want to receive logs
        }
      );

      status = statusResponse.status;
      console.log(`Polling attempt ${attempt + 1}: Status - ${status}`);

      if (status === "COMPLETED") {
        break;
      } else if (status === "FAILED") {
        throw new Error("Fal.ai TTS generation failed.");
      }
    }

    if (status !== "COMPLETED") {
      throw new Error("Fal.ai TTS generation timed out.");
    }

    // Step 3: Fetch the result
    const resultResponse = await fal.queue.result("fal-ai/playai/tts/dialog", {
      requestId: request_id,
    });

    const result: FalAIResponse = resultResponse.data;

    if (!result.audio || !result.audio.url) {
      throw new Error("Failed to retrieve the audio file from Fal.ai.");
    }

    return result.audio.url;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error generating podcast audio:", error.message);
    throw new Error("Failed to generate the podcast audio.");
  }
};
