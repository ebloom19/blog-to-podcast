import { useState, useEffect, useRef } from "react";
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

export interface PodcastGenerationStatus {
  status: "processing" | "completed" | "failed";
  step: string;
  progress: number;
  data?: {
    id: string;
    audioUrl: string;
    audioDuration: number;
    coverImageUrl: string;
    title: string;
    description: string;
  };
  error?: string;
}

// Map step names to user-friendly messages
const stepMessages: Record<string, string> = {
  "initializing": "Starting podcast generation...",
  "scraping_blog": "Scraping blog content...",
  "generating_script": "Creating podcast script...",
  "generating_metadata": "Generating podcast metadata...",
  "generating_cover_image": "Creating cover image...",
  "generating_audio": "Generating podcast audio...",
  "completed": "Podcast generation completed!",
};

export const useGeneratePodcast = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GeneratePodcastResponse | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const { toast } = useToast();
  const addPodcast = usePodcastStore((state) => state.addPodcast);

  // Store requestId in a ref to access it in the polling function
  const requestIdRef = useRef<string | null>(null);
  // Store polling interval ID to clear it when needed
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check the status of a request
  const checkRequestStatus = async (requestId: string) => {
    try {
      const response = await fetch(`/api/generate?requestId=${requestId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch request status");
      }

      const statusData: PodcastGenerationStatus = await response.json();

      // Update UI based on status
      setProgress(statusData.progress);
      setCurrentStep(statusData.step);

      // Set current message based on step
      setCurrentMessage(stepMessages[statusData.step] || `Processing: ${statusData.step}`);

      if (statusData.status === "completed" && statusData.data) {
        // Process completed
        setLoading(false);
        setData({
          success: true,
          message: "Podcast generation completed successfully.",
          audioUrl: statusData.data.audioUrl,
          coverImageUrl: statusData.data.coverImageUrl,
          description: statusData.data.description,
          title: statusData.data.title,
        });

        // Add to podcast store with required properties
        addPodcast({
          ...statusData.data,
          success: true,
          message: "Podcast generation completed successfully."
        });

        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        toast({
          title: "Success",
          description: "Podcast generation completed successfully.",
        });
      } else if (statusData.status === "failed") {
        // Process failed
        setLoading(false);
        setError(
          statusData.error || "An error occurred during podcast generation."
        );

        // Set error message
        setCurrentMessage(`Error: ${statusData.error || "An error occurred during podcast generation."}`);

        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        toast({
          title: "Error",
          description:
            statusData.error || "An error occurred during podcast generation.",
          variant: "destructive",
        });
      }
      // If still processing, continue polling
    } catch (err: any) {
      console.error("Error checking request status:", err);
      // Don't stop polling on temporary errors
    }
  };

  const generatePodcast = async (url: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setCurrentMessage(stepMessages.initializing);
    setProgress(0);
    setCurrentStep("initializing");

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

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

      // Store the request ID
      requestIdRef.current = result.requestId;
      setCurrentMessage("Podcast generation in progress...");

      // Start polling for status updates
      pollingIntervalRef.current = setInterval(() => {
        if (requestIdRef.current) {
          checkRequestStatus(requestIdRef.current);
        }
      }, 2000); // Poll every 2 seconds
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
      // Cleanup: clear polling interval when component unmounts
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    generatePodcast,
    loading,
    error,
    data,
    currentMessage,
    progress,
    currentStep,
  };
};
