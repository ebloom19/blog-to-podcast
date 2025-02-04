"use client";

import { useGeneratePodcast } from "@/hooks/useGeneratePodcast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { generatePodcast, loading, error, data, currentMessage } = useGeneratePodcast();
  const [url, setUrl] = useState("");

  console.log("Data:", data);
  console.log("Current Message:", currentMessage);

  return (
    <div className="relative z-10 h-[40rem] rounded-md bg-neutral-900 flex flex-col items-center justify-center w-full min-h-screen">
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
          <span className="text-white">{currentMessage || "Generating podcast..."}</span>
        </div>
      )}
      {data?.audioUrl && (
        <div className="mt-4 text-green-500 flex flex-col items-center w-1/3 z-30">
          <AudioPlayer src={data.audioUrl} />
        </div>
      )}
      <ShootingStars />
      <StarsBackground />
    </div>
  );
}
