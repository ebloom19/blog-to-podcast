import { useState, useEffect, useRef } from "react";

interface GeneratePodcastResponse {
  success: boolean;
  message: string;
  audioUrl?: string;
}

export const useGeneratePodcast = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GeneratePodcastResponse | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const generatePodcast = async (url: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setCurrentMessage("");

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          if (chunk.startsWith("data:")) {
            const jsonString = chunk.replace(/^data:\s*/, "");
            try {
              const parsedData = JSON.parse(jsonString);
              const { progress, message, audioUrl } = parsedData;

              if (progress === -1) {
                setError(message);
                setLoading(false);
                reader.releaseLock();
                return;
              }

              setCurrentMessage(message);

              if (progress === 100) {
                setData({ success: true, message, audioUrl });
                setLoading(false);
                reader.releaseLock();
                return;
              }
            } catch (err) {
              console.error("Failed to parse JSON:", err);
            }
          }

          boundary = buffer.indexOf("\n\n");
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Podcast generation aborted.");
      } else {
        setError(err.message || "An unexpected error occurred.");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { generatePodcast, loading, error, data, currentMessage };
};
