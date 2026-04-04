import { useEffect, useState } from "react";
import { Clock, FileText, Loader2, ChevronRight } from "lucide-react";
import { api } from "@/api";
import type { TranscriptionSessionListItem } from "@/types";

interface SessionHistoryProps {
  encounterId: string;
  onSelectSession: (sessionId: string) => void;
}

const statusColors: Record<string, string> = {
  created: "bg-gray-100 text-gray-600",
  recording: "bg-red-100 text-red-600",
  transcribing: "bg-yellow-100 text-yellow-600",
  generating_notes: "bg-blue-100 text-blue-600",
  completed: "bg-green-100 text-green-600",
  failed: "bg-red-100 text-red-600",
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

export default function SessionHistory({
  encounterId,
  onSelectSession,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<TranscriptionSessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await api.sessions.list(encounterId);
        setSessions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sessions"
        );
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [encounterId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <Clock className="w-8 h-8 mb-2" />
        <p>No previous transcription sessions</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">
        Previous Sessions ({sessions.length})
      </h3>
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[session.status] || "bg-gray-100"}`}
              >
                {session.status.replace("_", " ")}
              </span>
              {session.duration_seconds > 0 && (
                <span className="text-xs text-gray-400">
                  {formatDuration(session.duration_seconds)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{new Date(session.created_date).toLocaleString()}</span>
              {session.segment_count > 0 && (
                <span>{session.segment_count} segments</span>
              )}
              {session.soap_note_count > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {session.soap_note_count} note(s)
                </span>
              )}
            </div>
            {session.initiated_by_name && (
              <p className="text-xs text-gray-400 mt-0.5">
                by {session.initiated_by_name}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      ))}
    </div>
  );
}
