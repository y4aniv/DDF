"use server";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const getVoices = async () => {
  const elevenlabsClient = new ElevenLabsClient();
  const voices = await elevenlabsClient.voices.search({
    category: "cloned",
  });
  return voices.voices.map((voice) => {
    return {
      id: voice.voiceId,
      name: voice.name,
    };
  });
};

export { getVoices };
