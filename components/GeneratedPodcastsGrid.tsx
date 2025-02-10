"use client";

import React, { useState } from "react";
import Image from "next/image";
import { usePodcastStore, Podcast } from "@/stores/podcastStore";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useDownloadZip } from "@/hooks/useDownloadZip";
import { usePublishPodcast } from "@/hooks/usePublishPodcast";
import { DownloadIcon } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";

export const GeneratedPodcastsGrid: React.FC = () => {
  const podcasts = usePodcastStore((state) => state.podcasts);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const { buzzsproutApiKey, buzzsproutPodcastId } = useSettingsStore();

  // Helper function to extract only the first sentence and ensure it ends with "..."
  const formatDescription = (desc: string): string => {
    // Remove newlines and extra spaces
    const formatted = desc.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
    // Find the index of the first sentence-ending punctuation (. ! or ?)
    const punctuationIndex = formatted.search(/[.!?]/);
    if (punctuationIndex !== -1) {
      // Extract up to and including the punctuation
      let firstSentence = formatted.slice(0, punctuationIndex + 1);
      // Remove the ending punctuation and append an ellipsis
      firstSentence = firstSentence.replace(/[.!?]+$/, "");
      return firstSentence + "...";
    }
    // If no punctuation found, return the whole string with ellipsis
    return formatted + "...";
  };

  const {
    downloadZip,
    loading: downloadLoading,
    error: downloadError,
  } = useDownloadZip();
  const {
    publishPodcast,
    loading: publishLoading,
    error: publishError,
  } = usePublishPodcast();

  return (
    <>
      {podcasts.length > 0 && (
        <div className="mt-8 w-full max-w-4xl mx-auto">
          <h3 className="text-white text-xl font-semibold mb-4">
            Generated Podcasts
          </h3>
          <BentoGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {podcasts.map((podcast, index) => (
              <div
                key={index}
                onClick={() => {
                  console.log("clicked", podcast);
                  setSelectedPodcast(podcast);
                }}
                className="cursor-pointer z-10"
              >
                <BentoGridItem
                  key={podcast.id}
                  title={podcast.title}
                  // Updated description: concat to one sentence ending with "..."
                  description={formatDescription(podcast.description)}
                  header={
                    <Image
                      src={podcast.coverImageUrl}
                      alt={podcast.title}
                      className="w-full h-32 object-cover rounded-t-md"
                      width={400} // Adjust as needed
                      height={200}
                    />
                  }
                  className={index === 3 || index === 6 ? "md:col-span-2" : ""}
                />
              </div>
            ))}
          </BentoGrid>
        </div>
      )}
      <Dialog
        open={!!selectedPodcast}
        onOpenChange={(open) => {
          if (!open) setSelectedPodcast(null);
        }}
      >
        <DialogContent className="max-w-3xl mx-auto my-8 p-0">
          {selectedPodcast && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold mr-4">
                  Podcast Episode
                </CardTitle>
                <CardDescription>{selectedPodcast.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="px-4 py-4 space-y-4">
                  <div className="flex flex-row items-center gap-4">
                    <div className="w-48 h-48 relative rounded-md overflow-hidden">
                      <Image
                        src={selectedPodcast.coverImageUrl}
                        alt="Podcast Cover Image"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="w-px bg-gray-300 h-48" />
                    <div className="flex-1">
                      <p className="text-gray-700">
                        {selectedPodcast.description}
                      </p>
                    </div>
                  </div>
                  <Separator className="w-full" />
                  <div className="w-full flex flex-col justify-center items-center gap-3">
                    <AudioPlayer src={selectedPodcast.audioUrl} />
                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={() => downloadZip(selectedPodcast)}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? (
                          "Preparing Download..."
                        ) : (
                          <DownloadIcon className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() =>
                          publishPodcast({
                            ...selectedPodcast,
                            buzzsproutApiKey,
                            buzzsproutPodcastId,
                          })
                        }
                        disabled={publishLoading}
                      >
                        {publishLoading ? "Publishing..." : "Publish Episode"}
                      </Button>
                    </div>
                    {(downloadError || publishError) && (
                      <>
                        {downloadError && (
                          <p className="mt-2 text-red-500 text-center">
                            {downloadError}
                          </p>
                        )}
                        {publishError && (
                          <p className="mt-2 text-red-500 text-center">
                            {publishError}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeneratedPodcastsGrid;
