import { useState, useEffect } from "react";
import { usePodcastStore } from "@/stores/podcastStore";
import { useToast } from "./use-toast";

export interface GeneratePodcastResponse {
  success: boolean;
  message: string;
  audioUrl: string;
  coverImageUrl: string;
  description: string;
  title: string;
}

export const useGeneratePodcast = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GeneratePodcastResponse | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const { toast } = useToast();
  const addPodcast = usePodcastStore((state) => state.addPodcast);

  const generatePodcast = async (url: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setCurrentMessage("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "An error occurred");
        setLoading(false);
        toast({
          title: "Error",
          description: result.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      setData(result);
      setCurrentMessage(result.message);

      // Add the newly generated podcast to the store.
      addPodcast(result);

      toast({
        title: "Success",
        description: result.message,
      });
      setLoading(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup if you need to cancel any pending requests in a future update.
    };
  }, []);

  return { generatePodcast, loading, error, data, currentMessage };
};
