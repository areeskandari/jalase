import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRoomCode } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  userId: z.string(),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title } = schema.parse(body);

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roomCode = generateRoomCode();

    const [meeting] = await db.$transaction([
      db.meeting.create({
        data: {
          roomCode,
          title: title ?? `${user.name}'s Meeting`,
          hostId: userId,
        },
      }),
      db.user.update({
        where: { id: userId },
        data: { meetingsCreated: { increment: 1 } },
      }),
    ]);

    // Add host as participant
    await db.meetingParticipant.create({
      data: { meetingId: meeting.id, userId },
    });

    return NextResponse.json(meeting);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
