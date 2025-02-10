'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  buzzsproutApiKey: string;
  buzzsproutPodcastId: string;
  setBuzzsproutApiKey: (key: string) => void;
  setBuzzsproutPodcastId: (id: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      buzzsproutApiKey: '',
      buzzsproutPodcastId: '',
      setBuzzsproutApiKey: (key) => set({ buzzsproutApiKey: key }),
      setBuzzsproutPodcastId: (id) => set({ buzzsproutPodcastId: id }),
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({
        buzzsproutApiKey: state.buzzsproutApiKey,
        buzzsproutPodcastId: state.buzzsproutPodcastId,
      }),
    }
  )
); 