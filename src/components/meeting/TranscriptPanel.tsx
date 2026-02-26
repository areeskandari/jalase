"use client";

import { useState, useEffect, useRef } from "react";
import { formatMeetingTimestamp } from "@/lib/utils";

interface TranscriptEntry {
  id: string;
  speakerName: string;
  text: string;
  meetingTimestamp: number;
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  isLive?: boolean;
}

export default function TranscriptPanel({ entries, isLive = true }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-2xl mb-2">🎙️</div>
            <p className="text-sm text-gray-400">
              {isLive
                ? "Listening… transcript will appear as people speak."
                : "No transcript available."}
            </p>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="group">
            <div className="flex items-start gap-2">
              <span className="text-xs font-mono text-gray-400 mt-0.5 shrink-0">
                {formatMeetingTimestamp(entry.meetingTimestamp)}
              </span>
              <div>
                <span className="text-xs font-semibold text-gray-600 block mb-0.5">
                  {entry.speakerName}
                </span>
                <p className="text-sm text-gray-800 leading-relaxed">{entry.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {isLive && (
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">Live transcription active</span>
        </div>
      )}
    </div>
  );
}
