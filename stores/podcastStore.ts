'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of a Podcast record.
export interface Podcast {
  id: string;
  success: boolean;
  message: string;
  title: string;
  description: string;
  audioUrl: string;
  coverImageUrl: string;
  createdAt: Date;
  audioDuration: number;
}

// Define the store interface with actions.
interface PodcastStore {
  podcasts: Podcast[];
  addPodcast: (podcast: Omit<Podcast, "createdAt">) => void;
  updatePodcast: (id: string, updates: Partial<Podcast>) => void;
  removePodcast: (id: string) => void;
  clearPodcasts: () => void;
}

// Create the Zustand store with persist middleware.
export const usePodcastStore = create<PodcastStore>()(
  persist(
    (set) => ({
      podcasts: [],
      // Adds a new podcast to the store, automatically adding a createdAt timestamp.
      addPodcast: (podcast) =>
        set((state) => ({
          podcasts: [...state.podcasts, { ...podcast, createdAt: new Date() }],
        })),
      // Updates an existing podcast by id.
      updatePodcast: (id, updates) =>
        set((state) => ({
          podcasts: state.podcasts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      // Removes a podcast from the store by id.
      removePodcast: (id) =>
        set((state) => ({
          podcasts: state.podcasts.filter((p) => p.id !== id),
        })),
      // Clears all podcasts from the store.
      clearPodcasts: () => set({ podcasts: [] }),
    }),
    {
      name: 'podcast-store', // unique name for the storage location
      partialize: (state: PodcastStore) => ({
        podcasts: state.podcasts,
      }),
    }
  )
);
