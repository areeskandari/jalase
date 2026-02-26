"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import UserIdentityModal from "./UserIdentityModal";

export default function JoinMeeting() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatCode(raw: string) {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.replace(/-/g, "");
    if (clean.length !== 9) {
      setError("Enter a valid 9-character meeting code");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/meetings/${code}`);
    setLoading(false);
    if (!res.ok) {
      setError("Meeting not found. Check the code and try again.");
      return;
    }
    const meeting = await res.json();
    if (meeting.status === "ended") {
      setError("This meeting has already ended.");
      return;
    }
    setShowModal(true);
  }

  async function handleIdentified(user: { id: string; name: string; email: string }) {
    setShowModal(false);
    setLoading(true);
    try {
      await fetch(`/api/meetings/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      sessionStorage.setItem("meeting_user", JSON.stringify(user));
      router.push(`/meeting/${code}`);
    } catch {
      setError("Failed to join. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
        <div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Join a meeting</h2>
          <p className="text-sm text-gray-500 mt-1">Enter the meeting code shared with you</p>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <Input
            placeholder="abc-def-ghi"
            value={code}
            onChange={(e) => {
              setCode(formatCode(e.target.value));
              setError("");
            }}
            maxLength={11}
            className="text-center text-lg tracking-widest font-mono"
            error={error}
          />
          <Button type="submit" loading={loading} size="lg">
            Join meeting
          </Button>
        </form>
      </div>

      {showModal && (
        <UserIdentityModal
          onSubmit={handleIdentified}
          title="Join meeting"
          subtitle="Let others know who you are"
        />
      )}
    </>
  );
}
