"use client";

import { useState, useRef, useEffect } from "react";
import { useDataChannel } from "@livekit/components-react";
import { formatMeetingTimestamp } from "@/lib/utils";
import type { NoteEntry } from "@/types";

interface NotesPanelProps {
  meetingId: string;
  meetingDbId: string;
  userId: string;
  userName: string;
  meetingStartedAt: number;
  scope: "public" | "private";
}

export default function NotesPanel({
  meetingId,
  meetingDbId,
  userId,
  userName,
  meetingStartedAt,
  scope,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getMeetingElapsed = () =>
    Math.floor((Date.now() - meetingStartedAt) / 1000);

  // Listen for incoming data messages for public notes
  const { send } = useDataChannel(
    "public-notes",
    scope === "public"
      ? (msg) => {
          try {
            const payload = JSON.parse(new TextDecoder().decode(msg.payload)) as NoteEntry;
            setNotes((prev) => {
              if (prev.some((n) => n.id === payload.id)) return prev;
              return [...prev, payload];
            });
          } catch {}
        }
      : undefined
  );

  // Load existing notes on mount
  useEffect(() => {
    const url =
      scope === "public"
        ? `/api/notes?meetingId=${meetingDbId}&scope=public`
        : `/api/notes?meetingId=${meetingDbId}&userId=${userId}&scope=private`;

    fetch(url)
      .then((r) => r.json())
      .then((data: NoteEntry[]) => {
        if (Array.isArray(data)) setNotes(data);
      })
      .catch(() => {});
  }, [meetingDbId, userId, scope]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  async function saveNote() {
    const content = draft.trim();
    if (!content) return;
    setSaving(true);
    setDraft("");

    const meetingTimestamp = getMeetingElapsed();

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meetingDbId,
          userId,
          content,
          meetingTimestamp,
          scope,
        }),
      });
      const saved = await res.json();

      const entry: NoteEntry = {
        id: saved.id,
        userId,
        userName,
        content,
        meetingTimestamp,
        createdAt: saved.createdAt,
      };

      setNotes((prev) => {
        if (prev.some((n) => n.id === entry.id)) return prev;
        return [...prev, entry];
      });

      // Broadcast to other participants via LiveKit data channel
      if (scope === "public" && send) {
        send(new TextEncoder().encode(JSON.stringify(entry)), { reliable: true });
      }
    } catch {}

    setSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
  }

  const isPublic = scope === "public";

  return (
    <div className="flex flex-col h-full">
      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-2xl mb-2">{isPublic ? "📝" : "🔒"}</div>
            <p className="text-sm text-gray-400">
              {isPublic
                ? "No shared notes yet. Add one below."
                : "Your private notes. Only you can see these."}
            </p>
          </div>
        )}
        {notes.map((note) => (
          <div key={note.id} className="group">
            <div className={`rounded-lg px-3 py-2.5 ${isPublic ? "bg-gray-50" : "bg-amber-50 border border-amber-100"}`}>
              {isPublic && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">{note.userName ?? "Someone"}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatMeetingTimestamp(note.meetingTimestamp)}
                  </span>
                </div>
              )}
              {!isPublic && (
                <span className="text-xs text-amber-600 font-mono mb-1 block">
                  {formatMeetingTimestamp(note.meetingTimestamp)}
                </span>
              )}
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isPublic ? "Add a shared note… (Enter to save)" : "Add a private note… (Enter to save)"}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
          />
          <button
            onClick={saveNote}
            disabled={saving || !draft.trim()}
            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
          >
            {saving ? "…" : "Save"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {isPublic ? "Shift+Enter for new line" : "Only visible to you"}
        </p>
      </div>
    </div>
  );
}
