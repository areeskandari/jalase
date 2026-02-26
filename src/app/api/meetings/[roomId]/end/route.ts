import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMeetingInsights } from "@/lib/ai";
import { sendPostMeetingEmails } from "@/lib/email";
import { formatDuration, formatMeetingTimestamp } from "@/lib/utils";

interface Params {
  params: Promise<{ roomId: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  try {
    const meeting = await db.meeting.findUnique({
      where: { roomCode: roomId },
      include: {
        participants: { include: { user: true } },
        publicNotes: { include: { user: true }, orderBy: { meetingTimestamp: "asc" } },
        transcript: { orderBy: { meetingTimestamp: "asc" } },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const endedAt = new Date();

    await db.meeting.update({
      where: { id: meeting.id },
      data: { status: "ended", endedAt },
    });

    // Build transcript text
    const transcriptText = meeting.transcript
      .map(
        (line) =>
          `[${formatMeetingTimestamp(line.meetingTimestamp)}] ${line.speakerName ?? "Unknown"}: ${line.text}`
      )
      .join("\n");

    // Build public notes text
    const publicNotesText = meeting.publicNotes
      .map(
        (note) =>
          `[${formatMeetingTimestamp(note.meetingTimestamp)}] ${note.user.name}: ${note.content}`
      )
      .join("\n");

    const participantNames = meeting.participants.map((p) => p.user.name);

    // Generate AI insights
    const { summary, mom, actionItems } = await generateMeetingInsights({
      transcript: transcriptText,
      publicNotes: publicNotesText,
      participantNames,
    });

    // Save summary
    const savedSummary = await db.meetingSummary.create({
      data: {
        meetingId: meeting.id,
        transcript: transcriptText,
        summary,
        mom,
        actionItems: JSON.stringify(actionItems),
      },
    });

    // Fetch private notes per user
    const privateNotesByUser = new Map<
      string,
      { email: string; name: string; notes: { content: string; timestamp: string }[] }
    >();

    for (const participant of meeting.participants) {
      const pNotes = await db.privateNote.findMany({
        where: { meetingId: meeting.id, userId: participant.userId },
        orderBy: { meetingTimestamp: "asc" },
      });
      privateNotesByUser.set(participant.userId, {
        email: participant.user.email,
        name: participant.user.name,
        notes: pNotes.map((n) => ({
          content: n.content,
          timestamp: formatMeetingTimestamp(n.meetingTimestamp),
        })),
      });
    }

    const startedAt = meeting.startedAt ?? meeting.createdAt;
    const duration = formatDuration(startedAt, endedAt);
    const meetingDate = startedAt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send emails
    await sendPostMeetingEmails(
      {
        meetingTitle: meeting.title ?? "Meeting",
        meetingDate,
        duration,
        participants: meeting.participants.map((p) => ({
          name: p.user.name,
          email: p.user.email,
        })),
        publicNotes: meeting.publicNotes.map((n) => ({
          content: n.content,
          speakerName: n.user.name,
          timestamp: formatMeetingTimestamp(n.meetingTimestamp),
        })),
        transcript: transcriptText,
        summary,
        mom,
        actionItems,
        recordingUrl: meeting.recordingUrl ?? undefined,
      },
      privateNotesByUser
    );

    await db.meetingSummary.update({
      where: { id: savedSummary.id },
      data: { emailSentAt: new Date() },
    });

    return NextResponse.json({ success: true, summaryId: savedSummary.id });
  } catch (err) {
    console.error("Error ending meeting:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
