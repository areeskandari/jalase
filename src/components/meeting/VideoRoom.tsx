"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
  useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles";
import NotesPanel from "./NotesPanel";
import TranscriptPanel from "./TranscriptPanel";
import AudioTranscriber from "./AudioTranscriber";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface VideoRoomProps {
  roomCode: string;
  meetingDbId: string;
  userId: string;
  userName: string;
  meetingStartedAt: number;
  isHost: boolean;
  onMeetingEnd: () => void;
}

type SidePanel = "public-notes" | "private-notes" | "transcript";

interface TranscriptEntry {
  id: string;
  speakerName: string;
  text: string;
  meetingTimestamp: number;
}

export default function VideoRoom(props: VideoRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/livekit/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: props.roomCode, userId: props.userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setToken(data.token);
        setLivekitUrl(data.livekitUrl);
      })
      .catch((e) => setTokenError(e.message));
  }, [props.roomCode, props.userId]);

  if (tokenError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-sm">
        {tokenError}
      </div>
    );
  }

  if (!token || !livekitUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting…
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect
      audio
      video
      onDisconnected={() => {}}
      data-lk-theme="default"
      className="h-full"
    >
      <RoomAudioRenderer />
      <RoomInner {...props} />
    </LiveKitRoom>
  );
}

function InviteButton({ roomCode }: { roomCode: string }) {
  const [copied, setCopied] = useState(false);

  function copyInvite() {
    const url = `${window.location.origin}/meeting/${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copyInvite}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Invite
        </>
      )}
    </button>
  );
}

function RoomInner({
  roomCode,
  meetingDbId,
  userId,
  userName,
  meetingStartedAt,
  isHost,
  onMeetingEnd,
}: VideoRoomProps) {
  const [activePanel, setActivePanel] = useState<SidePanel>("public-notes");
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [endingMeeting, setEndingMeeting] = useState(false);

  const handleTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscriptEntries((prev) => {
      if (prev.some((e) => e.id === entry.id)) return prev;
      return [...prev, entry];
    });
  }, []);

  async function handleEndMeeting() {
    if (!confirm("End this meeting for everyone?")) return;
    setEndingMeeting(true);
    try {
      await fetch(`/api/meetings/${roomCode}/end`, { method: "POST" });
      onMeetingEnd();
    } catch {
      alert("Failed to end meeting. Please try again.");
      setEndingMeeting(false);
    }
  }

  const panels: { id: SidePanel; label: string; icon: React.ReactNode }[] = [
    {
      id: "public-notes",
      label: "Shared Notes",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "private-notes",
      label: "My Notes",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: "transcript",
      label: "Transcript",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-full bg-gray-950">
      {/* Audio transcriber – invisible, runs in background */}
      <AudioTranscriber
        meetingDbId={meetingDbId}
        userId={userId}
        userName={userName}
        meetingStartedAt={meetingStartedAt}
        onTranscript={handleTranscript}
      />

      {/* Main video area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-300 tracking-wider">LIVE</span>
            </div>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-sm text-gray-400 font-mono">{roomCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <InviteButton roomCode={roomCode} />
            {isHost && (
              <Button
                variant="danger"
                size="sm"
                loading={endingMeeting}
                onClick={handleEndMeeting}
              >
                End meeting
              </Button>
            )}
          </div>
        </div>

        {/* Video conference */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <VideoConference className="h-full" />
        </div>
      </div>

      {/* Side panel */}
      <div className="w-80 shrink-0 bg-white border-l border-gray-100 flex flex-col h-full">
        {/* Panel tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                activePanel === panel.id
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {panel.icon}
              <span className="text-[10px]">{panel.label}</span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activePanel === "public-notes" && (
            <NotesPanel
              meetingId={roomCode}
              meetingDbId={meetingDbId}
              userId={userId}
              userName={userName}
              meetingStartedAt={meetingStartedAt}
              scope="public"
            />
          )}
          {activePanel === "private-notes" && (
            <NotesPanel
              meetingId={roomCode}
              meetingDbId={meetingDbId}
              userId={userId}
              userName={userName}
              meetingStartedAt={meetingStartedAt}
              scope="private"
            />
          )}
          {activePanel === "transcript" && (
            <TranscriptPanel entries={transcriptEntries} isLive />
          )}
        </div>
      </div>
    </div>
  );
}
