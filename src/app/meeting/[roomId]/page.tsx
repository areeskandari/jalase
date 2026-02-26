"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import UserIdentityModal from "@/components/home/UserIdentityModal";

const VideoRoom = dynamic(() => import("@/components/meeting/VideoRoom"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-gray-400">Loading meeting room…</div>
    </div>
  ),
});

interface Meeting {
  id: string;
  roomCode: string;
  title: string | null;
  hostId: string;
  status: string;
  startedAt: string | null;
  createdAt: string;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
}

export default function MeetingPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIdentity, setShowIdentity] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  useEffect(() => {
    // Check for stored user
    const storedUser = sessionStorage.getItem("meeting_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }

    // Load meeting data
    fetch(`/api/meetings/${roomId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Meeting not found");
        return r.json();
      })
      .then((data: Meeting) => {
        setMeeting(data);
        if (data.status === "ended") {
          setMeetingEnded(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    // Show identity modal if no user and meeting loaded
    if (!loading && meeting && !user && meeting.status !== "ended") {
      setShowIdentity(true);
    }
  }, [loading, meeting, user]);

  async function handleIdentified(newUser: StoredUser) {
    sessionStorage.setItem("meeting_user", JSON.stringify(newUser));
    setUser(newUser);
    setShowIdentity(false);

    // Join the meeting
    await fetch(`/api/meetings/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: newUser.id }),
    });
  }

  function handleMeetingEnd() {
    setMeetingEnded(true);
    router.push(`/meeting/${roomId}/summary`);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading meeting…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-950">
        <p className="text-gray-300 text-sm">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-300 underline"
        >
          Go home
        </button>
      </div>
    );
  }

  if (meetingEnded) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-950">
        <div className="text-4xl">✅</div>
        <h2 className="text-white text-xl font-semibold">Meeting ended</h2>
        <p className="text-gray-400 text-sm">Generating summary and sending emails…</p>
        <button
          onClick={() => router.push(`/meeting/${roomId}/summary`)}
          className="mt-4 px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          View summary
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      {showIdentity && (
        <UserIdentityModal
          onSubmit={handleIdentified}
          title="Join meeting"
          subtitle="Enter your details to join"
        />
      )}

      {user && meeting && (
        <VideoRoom
          roomCode={roomId}
          meetingDbId={meeting.id}
          userId={user.id}
          userName={user.name}
          meetingStartedAt={
            meeting.startedAt
              ? new Date(meeting.startedAt).getTime()
              : Date.now()
          }
          isHost={meeting.hostId === user.id}
          onMeetingEnd={handleMeetingEnd}
        />
      )}
    </div>
  );
}
