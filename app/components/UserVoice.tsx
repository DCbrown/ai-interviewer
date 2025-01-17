"use client";

import React, { useState, useRef } from "react";

interface AppVoiceProps {
  onTranscriptionComplete?: (text: string) => void;
}

const UserVoice = ({ onTranscriptionComplete }: AppVoiceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
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

        // Create form data to send to API
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.mp3");

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Transcription failed");

          const { text } = await response.json();
          onTranscriptionComplete?.(text);
        } catch (err) {
          setError("Failed to transcribe audio");
          console.error("Transcription error:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Failed to access microphone");
      console.error("Microphone error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="items-center gap-2" style={{ width: "100%" }}>
      <button
        style={{ width: "50%" }}
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 mx-1 rounded-full ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white transition-colors`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default UserVoice;
