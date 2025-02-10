"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/stores/settingsStore";

export const SettingsModal = () => {
  const { buzzsproutApiKey, buzzsproutPodcastId, setBuzzsproutApiKey, setBuzzsproutPodcastId } = useSettingsStore();
  const [apiKey, setApiKey] = useState(buzzsproutApiKey);
  const [podcastId, setPodcastId] = useState(buzzsproutPodcastId);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setApiKey(buzzsproutApiKey);
    setPodcastId(buzzsproutPodcastId);
  }, [buzzsproutApiKey, buzzsproutPodcastId]);

  const handleSave = () => {
    setBuzzsproutApiKey(apiKey);
    setBuzzsproutPodcastId(podcastId);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Settings</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Set your Buzzsprout API Key and Podcast ID.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">
              Buzzsprout API Key
            </label>
            <div className="relative">
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API Key"
                type={showApiKey ? "text" : "password"}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showApiKey ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-gray-700">
              Buzzsprout Podcast ID
            </label>
            <Input
              value={podcastId}
              onChange={(e) => setPodcastId(e.target.value)}
              placeholder="Enter Podcast ID"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={handleSave}>Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 