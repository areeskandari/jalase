"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import UserIdentityModal from "./UserIdentityModal";

export default function CreateMeeting() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleIdentified(user: { id: string; name: string; email: string }) {
    setShowModal(false);
    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create meeting");
      const meeting = await res.json();
      sessionStorage.setItem("meeting_user", JSON.stringify(user));
      router.push(`/meeting/${meeting.roomCode}`);
    } catch {
      alert("Failed to create meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">New meeting</h2>
          <p className="text-sm text-gray-400 mt-1">Create a room and invite your team</p>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Meeting title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-white/10 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
          />
          <Button
            onClick={() => setShowModal(true)}
            loading={loading}
            size="lg"
            variant="secondary"
          >
            Start meeting
          </Button>
        </div>
      </div>

      {showModal && (
        <UserIdentityModal
          onSubmit={handleIdentified}
          title="Almost there"
          subtitle="Tell us your name and email to start"
        />
      )}
    </>
  );
}
