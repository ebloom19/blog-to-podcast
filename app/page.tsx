"use client";

import { useGeneratePodcast } from "@/hooks/useGeneratePodcast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { Loader2 } from "lucide-react";
import { GeneratedPodcastsGrid } from "@/components/GeneratedPodcastsGrid";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  const { generatePodcast, loading, error, data, currentMessage } =
    useGeneratePodcast();
  const [url, setUrl] = useState("");

  console.log("Data:", data);
  console.log("Current Message:", currentMessage);

  return (
    <div className="relative z-10 min-h-screen rounded-md bg-neutral-900 flex flex-col items-center justify-center w-full p-4">
      <div className="absolute top-4 right-4 z-20">
        <SettingsModal />
      </div>
      <h2 className="text-2xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-white dark:text-white font-sans tracking-tight">
        What&apos;s cooler than Blogs?{" "}
        <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
          <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
            <span className="">Podcasts.</span>
          </div>
        </div>
      </h2>
      <div className="mt-8 flex justify-center w-1/2 z-20">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter blog URL"
          className="w-full max-w-md mr-4 text-white"
        />
        <Button
          onClick={() => generatePodcast(url)}
          disabled={loading || !url.trim()}
          className="bg-white text-black"
        >
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {loading && (
        <div className="mt-6 flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
          <span className="text-white">
            {currentMessage || "Generating podcast..."}
          </span>
        </div>
      )}
      <GeneratedPodcastsGrid />
      <ShootingStars />
      <StarsBackground />
    </div>
  );
}
