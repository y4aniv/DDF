"use client";

import { getVoices } from "@/actions/get-voices";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { ArrowUpIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import getTranslation from "@/actions/get-translation";
import { Button } from "@/components/ui/button";

const Root = () => {
  const [voices, setVoices] = useState<Awaited<ReturnType<typeof getVoices>>>(
    []
  );
  type Voice = Awaited<ReturnType<typeof getVoices>>[number];
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [translatedText, setTranslatedText] = useState("");
   const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showRestart, setShowRestart] = useState(false);

  useEffect(() => {
    getVoices()
      .then((voices) => {
        setVoices(voices);
        if (voices.length > 0) {
          setSelectedVoice(voices[0]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSend = async () => {
    if (content.trim()) {
      setSending(true);

      try {
        const result = await getTranslation(content.trim(), selectedVoice?.id);

        // Passer à l'état de résultat
        setTranslatedText(result.translation);
        setShowResult(true);
        setSending(false);

        // Préparer et jouer l'audio
        const audioData = Uint8Array.from(atob(result.audio), (c) =>
          c.charCodeAt(0)
        );
        const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Calculer la durée approximative par mot
        const words = result.translation.split(" ");
        const audioDuration = await new Promise<number>((resolve) => {
          audio.onloadedmetadata = () => {
            resolve(audio.duration);
          };
        });
        const timePerWord = (audioDuration * 1000) / words.length;

        // Jouer l'audio
        audio.play();

        // Afficher le texte mot par mot
        let currentIndex = 0;
        const intervalId = setInterval(() => {
          if (currentIndex < words.length) {
             setDisplayedWords(words.slice(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(intervalId);
          }
        }, timePerWord);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
           setDisplayedWords(words);
          clearInterval(intervalId);
          setShowRestart(true);
        };
      } catch (error) {
        console.error("Erreur lors de la traduction:", error);
        setSending(false);
      }
    }
  };

  const handleRestart = () => {
    setShowResult(false);
    setShowRestart(false);
     setDisplayedWords([]);
    setTranslatedText("");
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Spinner />
          </motion.div>
        ) : showResult ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-6 max-w-2xl px-6"
          >
             <div className="text-2xl text-center font-medium flex flex-wrap justify-center gap-x-2">
               {displayedWords.map((word, index) => (
                 <motion.span
                   key={index}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{
                     duration: 0.3,
                     ease: [0.22, 1, 0.36, 1],
                   }}
                 >
                   {word}
                 </motion.span>
               ))}
             </div>
            <AnimatePresence>
              {showRestart && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Button
                    onClick={handleRestart}
                    variant="outline"
                    className="gap-2"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                    Recommencer
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <InputGroup className="w-md">
              <InputGroupTextarea
                placeholder="Balance ta phrase, mon gâté..."
                rows={4}
                className="max-h-28 overflow-y-auto"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <InputGroupAddon
                align="block-end"
                className="flex w-full justify-between"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton variant="ghost" disabled={sending}>
                      {selectedVoice?.name ??
                        voices[0]?.name ??
                        "Sélectionner une voix"}
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="[--radius:0.95rem]"
                  >
                    {voices.map((voice) => (
                      <DropdownMenuItem
                        key={voice.id}
                        onSelect={() => setSelectedVoice(voice)}
                      >
                        {voice.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <InputGroupButton
                  variant="default"
                  className="rounded-full"
                  size="icon-xs"
                  disabled={!content.trim() || sending}
                  onClick={handleSend}
                >
                  {sending ? <Spinner className="h-4 w-4" /> : <ArrowUpIcon />}
                  <span className="sr-only">Send</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Root;
