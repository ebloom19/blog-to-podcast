import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Expect the podcastData to contain audioUrl, coverImageUrl, and description
    const { audioUrl, coverImageUrl, description, title } = await request.json();

    const fileName = `${title.replace(/ /g, "_")}_podcast.zip`;

    const zip = new JSZip();

    // Fetch the podcast audio file from the provided URL and add to zip
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      throw new Error("Could not fetch audio file.");
    }
    const audioBuffer = await audioRes.arrayBuffer();
    zip.file("audio.mp3", audioBuffer);

    // Fetch the cover image file from the provided URL and add to zip
    const imageRes = await fetch(coverImageUrl);
    if (!imageRes.ok) {
      throw new Error("Could not fetch cover image.");
    }
    const imageBuffer = await imageRes.arrayBuffer();
    // Optionally, you could infer the image type from the response headers; here we assume JPG.
    zip.file("cover_image.jpg", imageBuffer);

    // Generate a text file for the episode metadata (description, title)
    zip.file("episode_metadata.txt", `title: ${title} \n description: ${description}`);

    // Generate the zip file as a Uint8Array
    const zipContent = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(zipContent, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
