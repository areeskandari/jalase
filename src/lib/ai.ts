import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(
  audioBuffer: Buffer,
  language?: string
): Promise<{ text: string; language: string }> {
  const file = new File([new Uint8Array(audioBuffer)], "audio.webm", { type: "audio/webm" });

  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language,
    response_format: "verbose_json",
  });

  return {
    text: response.text,
    language: response.language ?? language ?? "en",
  };
}

export async function generateMeetingInsights(params: {
  transcript: string;
  publicNotes: string;
  participantNames: string[];
}): Promise<{
  summary: string;
  mom: string;
  actionItems: string[];
}> {
  const { transcript, publicNotes, participantNames } = params;

  const systemPrompt = `You are an expert meeting analyst. You produce clear, concise, and actionable post-meeting documents. Always respond in the same language as the meeting transcript.`;

  const userPrompt = `Analyze the following meeting and produce three distinct outputs.

PARTICIPANTS: ${participantNames.join(", ")}

TRANSCRIPT:
${transcript || "(No transcript available)"}

PUBLIC NOTES:
${publicNotes || "(No public notes)"}

Respond in JSON with exactly these keys:
{
  "summary": "A smart, well-structured summary of the meeting. Use headers and bullet points where helpful. Capture key decisions, important discussions, and context.",
  "mom": "Formal Minutes of Meeting. Include: Date/time reference, attendees, agenda items discussed, decisions made, next steps. Use professional formatting.",
  "actionItems": ["Action item 1 with owner if mentioned", "Action item 2", "..."]
}

Extract action items as deeply as possible — include implicit commitments, follow-ups, and tasks mentioned even casually. Each action item should be specific and ideally include who is responsible.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    summary: parsed.summary ?? "",
    mom: parsed.mom ?? "",
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
  };
}
