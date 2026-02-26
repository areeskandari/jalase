import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

interface Params {
  params: Promise<{ roomId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  try {
    const meeting = await db.meeting.findUnique({
      where: { roomCode: roomId },
      include: {
        host: { select: { id: true, name: true, email: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        summary: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const joinSchema = z.object({
  userId: z.string(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  try {
    const body = await req.json();
    const { userId } = joinSchema.parse(body);

    const meeting = await db.meeting.findUnique({ where: { roomCode: roomId } });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    if (meeting.status === "ended") {
      return NextResponse.json({ error: "Meeting has ended" }, { status: 410 });
    }

    await db.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId: meeting.id, userId } },
      update: { leftAt: null },
      create: { meetingId: meeting.id, userId },
    });

    // Mark meeting as active when first person joins
    if (meeting.status === "waiting") {
      await db.meeting.update({
        where: { id: meeting.id },
        data: { status: "active", startedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, meeting });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
