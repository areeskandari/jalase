import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transcribeAudio } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("audio") as Blob | null;
    const meetingId = formData.get("meetingId") as string | null;
    const userId = formData.get("userId") as string | null;
    const speakerName = formData.get("speakerName") as string | null;
    const meetingTimestamp = parseInt(formData.get("meetingTimestamp") as string ?? "0", 10);
    const language = (formData.get("language") as string | null) ?? undefined;

    if (!audioBlob || !meetingId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const { text, language: detectedLanguage } = await transcribeAudio(buffer, language);

    if (!text.trim()) {
      return NextResponse.json({ text: "", saved: false });
    }

    const line = await db.transcriptLine.create({
      data: {
        meetingId,
        userId: userId ?? undefined,
        speakerName: speakerName ?? "Unknown",
        text,
        language: detectedLanguage,
        meetingTimestamp,
      },
    });

    return NextResponse.json({ text, language: detectedLanguage, lineId: line.id, saved: true });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
