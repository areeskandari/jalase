import JoinMeeting from "@/components/home/JoinMeeting";
import CreateMeeting from "@/components/home/CreateMeeting";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">Meeting</span>
        </div>
        <span className="text-xs text-gray-400">AI-powered meetings</span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-12 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-xs text-gray-500 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Transcription · Summary · Action items
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
            Meetings that{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
              remember themselves
            </span>
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            AI-powered meetings with real-time transcription, collaborative notes,
            and automatic summaries delivered to your inbox.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          <JoinMeeting />
          <CreateMeeting />
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center max-w-2xl w-full">
          {[
            { icon: "🎙️", label: "Live transcription" },
            { icon: "📝", label: "Collaborative notes" },
            { icon: "🤖", label: "AI summaries" },
            { icon: "📧", label: "Email delivery" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs text-gray-500 font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
