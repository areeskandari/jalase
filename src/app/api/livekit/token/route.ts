import { NextRequest, NextResponse } from "next/server";
import { createParticipantToken } from "@/lib/livekit";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  roomCode: z.string(),
  userId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, userId } = schema.parse(body);

    const [user, meeting] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.meeting.findUnique({ where: { roomCode } }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (meeting.status === "ended") {
      return NextResponse.json({ error: "Meeting has ended" }, { status: 410 });
    }

    const token = await createParticipantToken({
      roomName: roomCode,
      participantName: user.name,
      participantId: userId,
    });

    return NextResponse.json({ token, livekitUrl: process.env.LIVEKIT_URL });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
