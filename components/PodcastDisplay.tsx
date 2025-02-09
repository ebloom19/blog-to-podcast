"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useDownloadZip } from "@/hooks/useDownloadZip";
import type { GeneratePodcastResponse } from "@/hooks/useGeneratePodcast";
import { DownloadIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

/**
 * PodcastDisplay is a component that displays:
 * - The cover image for the podcast episode.
 * - The generated metadata description.
 * - An audio player to play the generated podcast audio.
 */
const PodcastDisplay: React.FC<{ podcastData: GeneratePodcastResponse }> = ({
  podcastData,
}) => {
  const { downloadZip, loading: downloadLoading, error: downloadError } = useDownloadZip();
  const [open, setOpen] = useState(false);

  // Automatically open the modal when podcast data is available
  useEffect(() => {
    if (podcastData) {
      setOpen(true);
    }
  }, [podcastData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl mx-auto my-8 p-0">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold mr-4">Podcast Episode</CardTitle>
            <CardDescription>{podcastData.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="px-4 py-4 space-y-4">
              <div className="flex flex-row items-center gap-4">
                {/* Cover Image with 1:1 ratio */}
                <div className="w-48 h-48 relative rounded-md overflow-hidden">
                  <Image
                    src={podcastData.coverImageUrl}
                    alt="Podcast Cover Image"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Vertical Separator */}
                <div className="w-px bg-gray-300 h-48" />
                {/* Description */}
                <div className="flex-1">
                  <p className="text-gray-700">{podcastData.description}</p>
                </div>
              </div>
              <Separator className="w-full" />
              {/* Audio Player */}
              <div className="w-full flex flex-row justify-center items-center">
                <AudioPlayer src={podcastData.audioUrl} />
                {/* Download Button */}
                <div className="flex justify-center">
                    <Button
                    onClick={() => downloadZip(podcastData)}
                    disabled={downloadLoading}
                    >
                    {downloadLoading
                        ? "Preparing Download... "
                        : <DownloadIcon className="w-4 h-4" />}
                    </Button>
                </div>
                {downloadError && (
                    <p className="mt-2 text-red-500 text-center">{downloadError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PodcastDisplay;
