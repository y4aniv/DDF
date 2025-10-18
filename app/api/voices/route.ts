import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextResponse } from "next/server";

const GET = async () => {
  const elevenlabs = new ElevenLabsClient();
  const voices = await elevenlabs.voices.search({
    category: "cloned",
  });

  return NextResponse.json(
    voices.voices.map((voice) => {
      return {
        id: voice.voiceId,
        name: voice.name,
      };
    })
  );
};

export { GET };
