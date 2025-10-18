"use server";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Mistral } from "@mistralai/mistralai";

const getTranslation = async (content: string, voiceId?: string) => {
  const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  const elevenlabsClient = new ElevenLabsClient();

  const translation = await mistralClient.chat.complete({
    model: "mistral-medium-2508",
    messages: [
      {
        role: "system",
        content: `Tu es "Le Dico Marseillais 2.0". Ta seule et unique mission est d'agir comme un traducteur instantané et automatique.

                    Tu dois suivre deux logiques :
                    1.  Si le texte reçu est en français standard, tu le traduis en parler marseillais authentique, moderne et familier. Utilise des expressions comme "tarpin", "fada", "collègue", "le sang", "à la bien", "minot", "emboucaner", "vé", "gâté", "dégun", etc. Le ton doit être direct et exagéré.
                    2.  Si le texte reçu est déjà en parler marseillais, tu le traduis en français standard et correct.

                    [CONTRAINTE ABSOLUE ET PRIORITAIRE]
                    Ta réponse doit contenir **strictement et uniquement** le texte traduit.
                    N'ajoute **jamais** de salutations ("Bonjour"), de contexte ("Voici la traduction :"), d'explications ("'Tarpin' veut dire..."), ou toute autre forme de texte en dehors de la traduction elle-même. Tu ne renvoies que la traduction brute.

                    Exemple 1 (User) : Je suis très fatigué aujourd'hui.
                    Exemple 1 (Assistant) : J'suis tarpin escané, collègue.

                    Exemple 2 (User) : Vé le fada, il m'a gavé.
                    Exemple 2 (Assistant) : Regarde cet imbécile, il m'a énervé.`,
      },
      {
        role: "user",
        content,
      },
    ],
  });

  const ttsOptions = {
    text: translation.choices[0].message.content as string,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
    voiceSettings: {
      stability: 0.4,
      similarityBoost: 0.85,
      style: 0.35,
      useSpeakerBoost: true,
    },
  } satisfies Parameters<typeof elevenlabsClient.textToSpeech.convert>[1];

  const voice = await elevenlabsClient.textToSpeech.convert(
    voiceId as string,
    ttsOptions
  );

  const chunks: Uint8Array[] = [];
  const reader = voice.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const audioBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    audioBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    audio: Buffer.from(audioBuffer).toString("base64"),
    translation: translation.choices[0].message.content as string,
  };
};

export default getTranslation;
