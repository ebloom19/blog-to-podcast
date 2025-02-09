import { useState } from "react";
import type { GeneratePodcastResponse } from "./useGeneratePodcast";

interface UseDownloadZipReturn {
  downloadZip: (podcastData: GeneratePodcastResponse) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * useDownloadZip is a custom hook that provides a function to download a ZIP file
 * containing the podcast audio, cover image, and episode description.
 *
 * It calls the `/api/downloadPodcastZip` endpoint with the provided podcast data and handles
 * the loading and error states.
 */
export const useDownloadZip = (): UseDownloadZipReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadZip = async (podcastData: GeneratePodcastResponse) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/downloadPodcastZip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(podcastData),
      });
      if (!response.ok) {
        throw new Error("Failed to generate ZIP file.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "podcast.zip";
      link.click();
      window.URL.revokeObjectURL(url);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      console.error("Download failed", e);
    } finally {
      setLoading(false);
    }
  };

  return { downloadZip, loading, error };
};
