import { useState } from "react";
import { useToast } from "./use-toast";

// Define the payload interface for publishing a podcast.
export interface PublishPodcastPayload {
  title: string;
  description: string;
  audioUrl: string;
  coverImageUrl: string;
  audioDuration?: number;
  buzzsproutApiKey?: string;
  buzzsproutPodcastId?: string;
}

// Define the response type for a published episode.
export interface PublishPodcastResponse {
  success: boolean;
  message: string;
  publishedEpisode: {
    id: number;
    title: string;
    audio_url: string;
    artwork_url: string;
    description: string;
    summary: string;
    artist: string;
    tags: string;
  };
}

export const usePublishPodcast = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const publishPodcast = async (
    payload: PublishPodcastPayload
  ): Promise<PublishPodcastResponse | void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/publishPodcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data: PublishPodcastResponse = await response.json();
      if (!response.ok) {
        setError(data.message);
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: data.message,
      });
      return data;
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { publishPodcast, loading, error };
};
