"use client";

import { useGeneratePodcast } from "@/hooks/useGeneratePodcast";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { GeneratedPodcastsGrid } from "@/components/GeneratedPodcastsGrid";
import { SettingsModal } from "@/components/SettingsModal";
import { MorphingText } from "@/components/magicui/morphing-text";
// import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";

export default function Home() {
  const { generatePodcast, loading, error, data, currentMessage } =
    useGeneratePodcast();
  const [url, setUrl] = useState("");
  const [displayMessages, setDisplayMessages] = useState<string[]>([]);
  const prevMessageRef = useRef<string>("");

  // Only update the display messages when a new message is received
  useEffect(() => {
    if (currentMessage && currentMessage !== prevMessageRef.current) {
      // Add the new message to the display array (keeping only the last 2 messages)
      setDisplayMessages((prev) => {
        const newMessages = [...prev, currentMessage].slice(-2);
        return newMessages;
      });
      prevMessageRef.current = currentMessage;
    }
  }, [currentMessage]);

  // Reset messages when starting a new generation
  useEffect(() => {
    if (!loading) {
      setDisplayMessages([]);
      prevMessageRef.current = "";
    }
  }, [loading]);

  console.log("Data:", data);
  console.log("Current Message:", currentMessage);

  return (
    <div className="relative z-10 min-h-screen rounded-md bg-neutral-900 flex flex-col items-center w-full p-4">
      <div className="absolute top-4 right-4 z-20">
        <SettingsModal />
      </div>

      {/* Main content container with proper spacing */}
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto my-12 space-y-8">
        {/* Heading */}
        <h2 className="text-2xl relative z-20 md:text-4xl lg:text-6xl font-bold text-center text-white dark:text-white font-sans tracking-tight">
          What&apos;s cooler than Blogs?{" "}
          <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
            <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
              <span className="">Podcasts.</span>
            </div>
          </div>
        </h2>

        {/* Input and button container */}
        <div className="flex flex-col md:flex-row justify-center w-full max-w-2xl px-4 z-20 gap-4">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter blog URL"
            className="w-full text-white"
          />
          <Button
            onClick={() => generatePodcast(url)}
            disabled={loading || !url.trim()}
            className="bg-white text-black md:w-auto w-full"
          >
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>

        {/* Error message */}
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

        {/* Loading and progress indicators */}
        {loading && (
          <div className="flex flex-col items-center justify-center space-y-6 py-8 w-full">
            {/* <div className="w-32 h-32">
              <AnimatedCircularProgressBar
                max={100}
                min={0}
                value={progress}
                gaugePrimaryColor="rgb(168 85 247)" // Purple-500
                gaugeSecondaryColor="#ffffff"
              />
            </div> */}

            <div className="h-16 flex items-center justify-center w-full px-4">
              {displayMessages.length > 0 && (
                <MorphingText
                  texts={displayMessages}
                  className="text-white text-sm font-medium text-center w-full"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Podcast grid with proper spacing */}
      <div className="w-full max-w-6xl mx-auto mt-8">
        <GeneratedPodcastsGrid />
      </div>

      {/* Background effects */}
      <ShootingStars />
      <StarsBackground />
    </div>
  );
}
