import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import sharp from "sharp";

// Define a proper type for a Buzzsprout episode response
interface BuzzsproutEpisode {
  id: number;
  title: string;
  audio_url: string;
  artwork_url: string;
  description: string;
  summary: string;
  artist: string;
  tags: string;
  // Add additional keys if needed: [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body; expecting title, description, audioUrl, coverImageUrl, and optionally audioDuration.
    const {
      title,
      description,
      audioUrl,
      coverImageUrl,
      audioDuration,
      buzzsproutApiKey: clientBuzzsproutApiKey,
      buzzsproutPodcastId: clientBuzzsproutPodcastId,
    } = await request.json();

    if (!title || !description || !audioUrl || !coverImageUrl) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Get Buzzsprout configuration from environment variables.
    const podcastId = clientBuzzsproutPodcastId;
    const buzzsproutKey = clientBuzzsproutApiKey;
    if (!podcastId || !buzzsproutKey) {
      return NextResponse.json(
        { success: false, message: "Buzzsprout configuration is missing." },
        { status: 500 }
      );
    }

    // Fetch existing episodes to ensure this episode hasn't already been published.
    const getEpisodesUrl = `https://www.buzzsprout.com/api/${podcastId}/episodes.json`;
    const getEpisodesRes = await fetch(getEpisodesUrl, {
      headers: {
        Authorization: `Token token=${buzzsproutKey}`,
      },
    });
    if (!getEpisodesRes.ok) {
      throw new Error("Failed to retrieve existing episodes from Buzzsprout.");
    }
    const existingEpisodes: BuzzsproutEpisode[] = await getEpisodesRes.json();

    // Check if an episode with the same title already exists (case-insensitive).
    const alreadyPublished = existingEpisodes.some((episode) => {
      return episode.title.toLowerCase() === title.toLowerCase();
    });
    if (alreadyPublished) {
      return NextResponse.json(
        { success: false, message: "Episode already published." },
        { status: 409 }
      );
    }

    // Convert coverImageUrl from .png to .jpeg and upload to fal.ai
    const coverImageRes = await fetch(coverImageUrl);
    if (!coverImageRes.ok) {
      throw new Error("Failed to fetch cover image for conversion.");
    }
    const coverImageBuffer = Buffer.from(await coverImageRes.arrayBuffer());
    const jpegBuffer = await sharp(coverImageBuffer).jpeg().toBuffer();
    const file = new File([jpegBuffer], "cover_image.jpeg", {
      type: "image/jpeg",
    });
    const falArtworkUrl = await fal.storage.upload(file);

    // Prepare payload for publishing the new episode.
    const payload = {
      title,
      description,
      summary: description, // using the description for summary; adjust as needed
      artist: "", // set artist if available
      tags: "", // set tags if needed
      published_at: new Date().toISOString(),
      duration: audioDuration || 0,
      audio_url: audioUrl,
      artwork_url: falArtworkUrl,
      explicit: false,
      private: false,
      email_user_after_audio_processed: true,
    };

    console.log("payload: ", payload);

    // Publish the episode via a POST to Buzzsprout's API.
    const publishUrl = `https://www.buzzsprout.com/api/${podcastId}/episodes.json`;
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: {
        Authorization: `Token token=${buzzsproutKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!publishRes.ok) {
      const errorText = await publishRes.text();
      throw new Error(`Failed to publish episode: ${errorText}`);
    }

    const publishedEpisode: BuzzsproutEpisode = await publishRes.json();

    return NextResponse.json(
      {
        success: true,
        message: "Episode published successfully.",
        publishedEpisode,
      },
      { status: 200 }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
