/**
 * MicButton — Voice input using Web Speech API.
 * Records speech → transcribes → fills broadcast input.
 * Works in Electron (Chromium) with no API key.
 */

import { useState, useRef, useCallback } from "react";

interface MicButtonProps {
  onTranscript: (text: string) => void;
}

export function MicButton({ onTranscript }: MicButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .webkitSpeechRecognition ?? window.SpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[MicButton] Speech recognition not available");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return (
    <button
      onClick={toggle}
      title={isListening ? "Stop recording" : "Voice input"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "none",
        background: isListening
          ? "var(--status-error, #ef4444)"
          : "var(--grid-bg-elevated, #242320)",
        color: isListening ? "var(--color-grid-fg, #f5f4f1)" : "var(--grid-fg-muted, #9c9689)",
        cursor: "pointer",
        transition: "all 150ms",
        flexShrink: 0,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isListening ? (
          // Stop icon (square)
          <rect x="6" y="6" width="12" height="12" rx="1" />
        ) : (
          // Mic icon
          <>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </>
        )}
      </svg>
      {isListening && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ef4444",
            animation: "pulse 1s infinite",
          }}
        />
      )}
    </button>
  );
}
