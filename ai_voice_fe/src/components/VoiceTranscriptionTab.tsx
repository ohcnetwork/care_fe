import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, FileText, History, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/api";
import { useTranscription } from "@/hooks/useTranscription";
import { useAudioStream } from "@/hooks/useAudioStream";
import AudioRecorder from "./AudioRecorder";
import TranscriptionPanel from "./TranscriptionPanel";
import SOAPNotePanel from "./SOAPNotePanel";
import SessionHistory from "./SessionHistory";
import type { SOAPNote, TranscriptionSession } from "@/types";

interface VoiceTranscriptionTabProps {
  encounter: { id: string; external_id?: string };
  patient: { id: string };
}

type TabView = "record" | "notes" | "history";

export default function VoiceTranscriptionTab({
  encounter,
}: VoiceTranscriptionTabProps) {
  const encounterId = encounter.external_id || encounter.id;
  const [activeTab, setActiveTab] = useState<TabView>("record");
  const [session, setSession] = useState<TranscriptionSession | null>(null);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const durationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [duration, setDuration] = useState(0);

  const transcription = useTranscription(session?.id ?? null);

  const audioStream = useAudioStream({
    onAudioData: transcription.sendAudio,
  });

  // Create a new session
  const createSession = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    try {
      const newSession = await api.sessions.create(encounterId);
      setSession(newSession);
      setSoapNote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setIsCreating(false);
    }
  }, [encounterId]);

  // Connect WebSocket when session is created
  useEffect(() => {
    if (session?.id && !transcription.isConnected) {
      transcription.connect();
    }
  }, [session?.id]);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (!transcription.isConnected) return;
    transcription.startRecording();
    await audioStream.startRecording();
    durationRef.current = 0;
    setDuration(0);
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  }, [transcription, audioStream]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    clearInterval(timerRef.current);
    audioStream.stopRecording();
    transcription.stopRecording();
  }, [audioStream, transcription]);

  // Generate SOAP notes
  const handleGenerateNotes = useCallback(async () => {
    if (!session) return;
    setIsGeneratingNotes(true);
    setError(null);
    try {
      const note = await api.sessions.generateNotes(session.id);
      setSoapNote(note);
      setActiveTab("notes");

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const updated = await api.soapNotes.get(note.id);
          setSoapNote(updated);
          if (updated.status !== "generating") {
            clearInterval(pollInterval);
            setIsGeneratingNotes(false);
          }
        } catch {
          clearInterval(pollInterval);
          setIsGeneratingNotes(false);
        }
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate notes"
      );
      setIsGeneratingNotes(false);
    }
  }, [session]);

  const handleUpdateNote = useCallback(
    async (id: string, data: Partial<SOAPNote>) => {
      const updated = await api.soapNotes.update(id, data);
      setSoapNote(updated);
    },
    []
  );

  const handleMarkReviewed = useCallback(async (id: string) => {
    const updated = await api.soapNotes.markReviewed(id);
    setSoapNote(updated);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      transcription.disconnect();
    };
  }, []);

  const tabs = [
    { id: "record" as const, label: "Record", icon: Mic },
    { id: "notes" as const, label: "SOAP Notes", icon: FileText },
    { id: "history" as const, label: "History", icon: History },
  ];

  const hasTranscript =
    transcription.segments.length > 0 || !!transcription.transcript;
  const sessionCompleted =
    session?.status === "completed" || !!transcription.transcript;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "record" && (
          <div className="flex flex-col gap-6">
            {/* Session Creation */}
            {!session && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  AI Voice Transcription
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Start a transcription session to record and transcribe the
                  patient encounter in real-time. AI will generate structured
                  SOAP notes from the conversation.
                </p>
                <button
                  onClick={createSession}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                  Start New Session
                </button>
              </div>
            )}

            {/* Active Session */}
            {session && (
              <>
                <AudioRecorder
                  isRecording={audioStream.isRecording}
                  audioLevel={audioStream.audioLevel}
                  isConnected={transcription.isConnected}
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                  error={audioStream.error || transcription.error}
                  duration={duration}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Live Transcription
                    </h3>
                    {transcription.segments.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {transcription.segments.length} segments
                      </span>
                    )}
                  </div>
                  <TranscriptionPanel
                    segments={transcription.segments}
                    partialText={transcription.partialText}
                    isRecording={audioStream.isRecording}
                  />
                </div>

                {/* Actions */}
                {hasTranscript && !audioStream.isRecording && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateNotes}
                      disabled={isGeneratingNotes}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
                    >
                      {isGeneratingNotes ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      Generate SOAP Note
                    </button>
                    <button
                      onClick={createSession}
                      disabled={isCreating}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      New Session
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <SOAPNotePanel
            note={soapNote}
            isGenerating={isGeneratingNotes}
            onUpdate={handleUpdateNote}
            onMarkReviewed={handleMarkReviewed}
          />
        )}

        {activeTab === "history" && (
          <SessionHistory
            encounterId={encounterId}
            onSelectSession={async (id) => {
              const sess = await api.sessions.get(id);
              setSession(sess);
              if (sess.soap_notes.length > 0) {
                setSoapNote(sess.soap_notes[0]);
              }
              setActiveTab("record");
            }}
          />
        )}
      </div>
    </div>
  );
}
