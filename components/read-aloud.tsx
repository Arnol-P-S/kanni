"use client";

import { useState } from "react";
import { Pause, Volume2, VolumeX } from "lucide-react";

export function ReadAloud({ text, language }: { text: string; language: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [available, setAvailable] = useState(true);

  function speak() {
    if (!("speechSynthesis" in window)) {
      setAvailable(false);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const prefix = language === "ml" ? "ml" : "en";
    const voice = voices.find((candidate) =>
      candidate.lang.toLowerCase().startsWith(prefix),
    );
    if (!voice) {
      setAvailable(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  if (!available) {
    return (
      <span className="voice-unavailable">
        <VolumeX size={18} aria-hidden="true" /> Matching browser voice not
        available
      </span>
    );
  }

  return (
    <button
      type="button"
      className="icon-button"
      onClick={speaking ? stop : speak}
      aria-label={speaking ? "Pause read aloud" : "Read instruction aloud"}
    >
      {speaking ? (
        <Pause size={20} aria-hidden="true" />
      ) : (
        <Volume2 size={20} aria-hidden="true" />
      )}
      {speaking ? "Pause" : "Read aloud"}
    </button>
  );
}
