"use client";

import React, { useState, useRef, useEffect } from "react";
import "./AppVoice.css";

interface AppVoiceProps {
  onUserInput: (text: string) => void;
  isProcessing: boolean;
  aiMessage?: string;
  isAiSpeaking: boolean;
  onAiFinishedSpeaking: () => void;
}

const AppVoice = ({
  onUserInput,
  isProcessing,
  aiMessage,
  isAiSpeaking,
  onAiFinishedSpeaking,
}: AppVoiceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [error, setError] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (aiMessage && isAiSpeaking) {
      generateSpeech(aiMessage);
    }
  }, [aiMessage, isAiSpeaking]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const generateSpeech = async (text: string) => {
    try {
      const response = await fetch("/api/openai-gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          type: "speech",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;

      audioElement.onended = () => {
        onAiFinishedSpeaking();
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audioElement.onerror = () => {
        console.error("Audio playback error");
        onAiFinishedSpeaking();
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audioElement.play();
    } catch (error) {
      console.error("Error generating speech:", error);
      setError("Failed to generate AI speech");
      onAiFinishedSpeaking();
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/mp3" });
        await processAudioInput(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
      setError("");
    } catch (err) {
      setError("Failed to access microphone");
      console.error("Microphone error:", err);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsListening(false);
      setIsWaitingForResponse(true);
    }
  };

  const handleAiFinishedSpeaking = () => {
    setIsWaitingForResponse(false);
    onAiFinishedSpeaking();
  };

  const processAudioInput = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.mp3");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const { text: transcribedText } = await response.json();
      onUserInput(transcribedText);
    } catch (err) {
      setError("Failed to process audio");
      console.error("Processing error:", err);
    }
  };

  return (
    <div className="voice-interaction-container">
      {isAiSpeaking && (
        <div className="wave-container">
          <div className="wave-bars">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="wave-bar" />
            ))}
          </div>
        </div>
      )}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing || isAiSpeaking || isWaitingForResponse}
        className={`voice-button ${isListening ? "listening" : ""} ${
          isProcessing || isWaitingForResponse ? "processing" : ""
        } ${isAiSpeaking ? "ai-speaking" : ""}`}
      >
        {isListening
          ? "Stop Recording"
          : isProcessing || isWaitingForResponse
          ? "Processing..."
          : isAiSpeaking
          ? "AI Speaking..."
          : "Start Recording"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default AppVoice;
