import { db } from "@/lib/db";
import { formatDuration, formatMeetingTimestamp } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function SummaryPage({ params }: Props) {
  const { roomId } = await params;

  const meeting = await db.meeting.findUnique({
    where: { roomCode: roomId },
    include: {
      host: { select: { name: true, email: true } },
      participants: { include: { user: { select: { name: true, email: true } } } },
      publicNotes: {
        include: { user: { select: { name: true } } },
        orderBy: { meetingTimestamp: "asc" },
      },
      summary: true,
    },
  });

  if (!meeting) notFound();

  const summary = meeting.summary;
  const actionItems: string[] = summary
    ? JSON.parse(summary.actionItems ?? "[]")
    : [];

  const startedAt = meeting.startedAt ?? meeting.createdAt;
  const endedAt = meeting.endedAt ?? new Date();
  const duration = formatDuration(startedAt, endedAt);

  const meetingDate = startedAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 mb-6 w-fit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Meeting Summary
                </span>
                {meeting.status === "ended" && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                    Ended
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {meeting.title ?? "Meeting"}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{meetingDate}</span>
                <span>·</span>
                <span>{duration}</span>
                <span>·</span>
                <span>{meeting.participants.length} participant{meeting.participants.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 mt-6 flex-wrap">
            {meeting.participants.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5 text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold">
                  {p.user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700">{p.user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {!summary && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-amber-700 text-sm">
              Summary is being generated… Refresh in a moment.
            </p>
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-900 text-white flex items-center justify-center text-xs">✓</span>
              Action Items
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {actionItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Summary */}
        {summary?.summary && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs">✨</span>
              Smart Summary
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {summary.summary}
              </p>
            </div>
          </section>
        )}

        {/* MOM */}
        {summary?.mom && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs">📋</span>
              Minutes of Meeting
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {summary.mom}
              </p>
            </div>
          </section>
        )}

        {/* Public Notes */}
        {meeting.publicNotes.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs">📝</span>
              Shared Notes
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {meeting.publicNotes.map((note) => (
                <div key={note.id} className="px-5 py-3.5 flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-400 mt-0.5 shrink-0">
                    {formatMeetingTimestamp(note.meetingTimestamp)}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                      {note.user.name}
                    </span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Transcript */}
        {summary?.transcript && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs">🎙️</span>
              Full Transcript
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-sm text-gray-600 leading-loose whitespace-pre-wrap font-mono">
                {summary.transcript}
              </p>
            </div>
          </section>
        )}

        {/* Recording */}
        {meeting.recordingUrl && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs">🎬</span>
              Recording
            </h2>
            <a
              href={meeting.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Watch recording
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </section>
        )}

        {/* Email notice */}
        <div className="bg-gray-900 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-300">
            A summary with transcript, notes, and action items has been sent to all participants.
          </p>
        </div>
      </div>
    </div>
  );
}
