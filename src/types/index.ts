export interface MeetingUser {
  id: string;
  name: string;
  email: string;
}

export interface NoteEntry {
  id: string;
  userId: string;
  userName: string;
  content: string;
  meetingTimestamp: number;
  createdAt: string;
}

export interface TranscriptEntry {
  id: string;
  speakerName: string;
  text: string;
  meetingTimestamp: number;
  language?: string;
}

// LiveKit data channel message types
export type DataMessageType =
  | { type: "note:add"; payload: NoteEntry; scope: "public" | "private" }
  | { type: "note:update"; payload: { id: string; content: string }; scope: "public" | "private" }
  | { type: "transcript:line"; payload: TranscriptEntry }
  | { type: "meeting:end" };
