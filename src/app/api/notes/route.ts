import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const addSchema = z.object({
  meetingId: z.string(),
  userId: z.string(),
  content: z.string().min(1),
  meetingTimestamp: z.number().int().min(0),
  scope: z.enum(["public", "private"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { meetingId, userId, content, meetingTimestamp, scope } = addSchema.parse(body);

    if (scope === "public") {
      const note = await db.publicNote.create({
        data: { meetingId, userId, content, meetingTimestamp },
        include: { user: { select: { name: true } } },
      });
      return NextResponse.json(note);
    } else {
      const note = await db.privateNote.create({
        data: { meetingId, userId, content, meetingTimestamp },
      });
      return NextResponse.json(note);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const meetingId = searchParams.get("meetingId");
  const userId = searchParams.get("userId");
  const scope = searchParams.get("scope") as "public" | "private" | null;

  if (!meetingId) {
    return NextResponse.json({ error: "meetingId required" }, { status: 400 });
  }

  try {
    if (scope === "public") {
      const notes = await db.publicNote.findMany({
        where: { meetingId },
        include: { user: { select: { name: true } } },
        orderBy: { meetingTimestamp: "asc" },
      });
      return NextResponse.json(notes);
    } else if (scope === "private" && userId) {
      const notes = await db.privateNote.findMany({
        where: { meetingId, userId },
        orderBy: { meetingTimestamp: "asc" },
      });
      return NextResponse.json(notes);
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
