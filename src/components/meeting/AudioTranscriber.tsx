"use client";

import { useEffect, useRef } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";

interface AudioTranscriberProps {
  meetingDbId: string;
  userId: string;
  userName: string;
  meetingStartedAt: number;
  onTranscript: (entry: {
    id: string;
    speakerName: string;
    text: string;
    meetingTimestamp: number;
  }) => void;
}

const CHUNK_DURATION_MS = 8000; // 8 second chunks for transcription

export default function AudioTranscriber({
  meetingDbId,
  userId,
  userName,
  meetingStartedAt,
  onTranscript,
}: AudioTranscriberProps) {
  const { localParticipant } = useLocalParticipant();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    startTranscription();
    return () => stopTranscription();
  }, []);

  async function startTranscription() {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const chunks = [...chunksRef.current];
        chunksRef.current = [];
        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 1000) return; // skip silence

        const meetingTimestamp = Math.floor((Date.now() - meetingStartedAt) / 1000);
        const formData = new FormData();
        formData.append("audio", blob, "audio.webm");
        formData.append("meetingId", meetingDbId);
        formData.append("userId", userId);
        formData.append("speakerName", userName);
        formData.append("meetingTimestamp", String(meetingTimestamp));

        try {
          const res = await fetch("/api/transcription", { method: "POST", body: formData });
          const data = await res.json();
          if (data.saved && data.text?.trim()) {
            onTranscript({
              id: data.lineId,
              speakerName: userName,
              text: data.text,
              meetingTimestamp,
            });
          }
        } catch {}
      };

      recorder.start();

      // Cycle the recorder every CHUNK_DURATION_MS
      intervalRef.current = setInterval(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          // Restart after a tiny delay
          setTimeout(() => {
            if (isRunningRef.current && streamRef.current) {
              recorder.start();
            }
          }, 100);
        }
      }, CHUNK_DURATION_MS);
    } catch (err) {
      console.warn("Could not start audio transcription:", err);
    }
  }

  function stopTranscription() {
    isRunningRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }

  return null; // purely functional
}
