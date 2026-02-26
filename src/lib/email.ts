import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface MeetingEmailData {
  meetingTitle: string;
  meetingDate: string;
  duration: string;
  participants: { name: string; email: string }[];
  publicNotes: { content: string; speakerName: string; timestamp: string }[];
  transcript: string;
  summary: string;
  mom: string;
  actionItems: string[];
  recordingUrl?: string;
}

interface PersonalEmailData extends MeetingEmailData {
  recipientName: string;
  recipientEmail: string;
  privateNotes: { content: string; timestamp: string }[];
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function buildBaseEmailHtml(data: MeetingEmailData, privateSection?: string): string {
  const actionItemsHtml = data.actionItems
    .map(
      (item, i) => `
      <tr>
        <td style="padding: 8px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #374151;">
          <span style="display:inline-block;width:20px;height:20px;background:#111827;color:#fff;border-radius:50%;text-align:center;line-height:20px;font-size:11px;margin-right:10px;">${i + 1}</span>
          ${item}
        </td>
      </tr>`
    )
    .join("");

  const publicNotesHtml = data.publicNotes
    .map(
      (note) => `
      <div style="padding: 10px 0; border-bottom: 1px solid #f5f5f5;">
        <span style="font-size: 11px; color: #9ca3af; margin-right: 8px;">${note.timestamp}</span>
        <span style="font-size: 12px; color: #6b7280; font-weight: 600; margin-right: 8px;">${note.speakerName}</span>
        <span style="font-size: 14px; color: #374151;">${note.content}</span>
      </div>`
    )
    .join("");

  const transcriptHtml = data.transcript
    ? `<div style="font-family: monospace; font-size: 13px; color: #4b5563; line-height: 1.8; white-space: pre-wrap;">${data.transcript}</div>`
    : `<p style="color: #9ca3af; font-style: italic;">No transcript available.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeting Summary – ${data.meetingTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:36px 40px;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Meeting Summary</p>
              <h1 style="margin:0 0 16px;font-size:24px;color:#fff;font-weight:700;">${data.meetingTitle}</h1>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:24px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">Date</p>
                    <p style="margin:0;font-size:14px;color:#e5e7eb;">${data.meetingDate}</p>
                  </td>
                  <td style="padding-right:24px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">Duration</p>
                    <p style="margin:0;font-size:14px;color:#e5e7eb;">${data.duration}</p>
                  </td>
                  <td>
                    <p style="margin:0;font-size:12px;color:#9ca3af;">Participants</p>
                    <p style="margin:0;font-size:14px;color:#e5e7eb;">${data.participants.map((p) => p.name).join(", ")}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Items -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Action Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                ${actionItemsHtml || `<tr><td style="padding:12px 16px;color:#9ca3af;font-size:14px;">No action items extracted.</td></tr>`}
              </table>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Smart Summary</h2>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${data.summary}</div>
            </td>
          </tr>

          <!-- MOM -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Minutes of Meeting</h2>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${data.mom}</div>
            </td>
          </tr>

          ${
            data.publicNotes.length > 0
              ? `
          <!-- Public Notes -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Shared Notes</h2>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;">
                ${publicNotesHtml}
              </div>
            </td>
          </tr>`
              : ""
          }

          ${privateSection ?? ""}

          ${
            data.recordingUrl
              ? `
          <!-- Recording -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Recording</h2>
              <a href="${data.recordingUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500;">Watch Recording →</a>
            </td>
          </tr>`
              : ""
          }

          <!-- Transcript -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Full Transcript</h2>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;max-height:400px;overflow:hidden;">
                ${transcriptHtml}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;border-top:1px solid #f0f0f0;margin-top:32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Generated by Meeting · AI-powered meeting platform</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPostMeetingEmails(
  data: MeetingEmailData,
  privateNotesByUser: Map<string, { email: string; name: string; notes: { content: string; timestamp: string }[] }>
): Promise<void> {
  const from = process.env.RESEND_FROM ?? "Meeting <noreply@meeting.app>";
  const subject = `Meeting Summary: ${data.meetingTitle}`;

  const participantEmails = data.participants.map((p) => p.email);

  // Send general email to all participants
  const generalHtml = buildBaseEmailHtml(data);
  await resend.emails.send({
    from,
    to: participantEmails,
    subject,
    html: generalHtml,
  });

  // Send personal emails with private notes
  for (const [userId, userData] of privateNotesByUser) {
    if (!userData.notes.length) continue;

    const privateNotesHtml = userData.notes
      .map(
        (note) => `
      <div style="padding: 10px 0; border-bottom: 1px solid #f5f5f5;">
        <span style="font-size: 11px; color: #9ca3af; margin-right: 8px;">${note.timestamp}</span>
        <span style="font-size: 14px; color: #374151;">${note.content}</span>
      </div>`
      )
      .join("");

    const privateSection = `
      <tr>
        <td style="padding:32px 40px 0;">
          <h2 style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;">Your Private Notes</h2>
          <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;">Only visible to you</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;">
            ${privateNotesHtml}
          </div>
        </td>
      </tr>`;

    const personalHtml = buildBaseEmailHtml(data, privateSection);
    await resend.emails.send({
      from,
      to: userData.email,
      subject: `${subject} + Your Private Notes`,
      html: personalHtml,
    });
  }
}
