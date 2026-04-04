import { Mic, MicOff, Square } from "lucide-react";

interface AudioRecorderProps {
  isRecording: boolean;
  audioLevel: number;
  isConnected: boolean;
  onStart: () => void;
  onStop: () => void;
  error: string | null;
  duration: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioRecorder({
  isRecording,
  audioLevel,
  isConnected,
  onStart,
  onStop,
  error,
  duration,
}: AudioRecorderProps) {
  const normalizedLevel = Math.min(100, audioLevel);

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Audio Level Visualization */}
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Pulsing ring when recording */}
        {isRecording && (
          <div
            className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"
            style={{
              transform: `scale(${1 + normalizedLevel / 200})`,
              animationDuration: "1.5s",
            }}
          />
        )}

        {/* Audio level ring */}
        <div
          className="absolute inset-2 rounded-full transition-all duration-75"
          style={{
            background: isRecording
              ? `radial-gradient(circle, transparent 60%, rgba(239, 68, 68, ${normalizedLevel / 200}) 100%)`
              : "transparent",
            transform: `scale(${1 + normalizedLevel / 400})`,
          }}
        />

        {/* Main button */}
        <button
          onClick={isRecording ? onStop : onStart}
          disabled={!isConnected}
          className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 shadow-lg
            ${isRecording
              ? "bg-red-500 hover:bg-red-600 text-white"
              : isConnected
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <Square className="w-8 h-8" />
          ) : isConnected ? (
            <Mic className="w-8 h-8" />
          ) : (
            <MicOff className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Timer */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-lg font-mono font-semibold text-red-600">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Level bar */}
      {isRecording && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full transition-all duration-75"
              style={{ width: `${normalizedLevel}%` }}
            />
          </div>
        </div>
      )}

      {/* Status text */}
      <p className="text-sm text-gray-500">
        {error
          ? error
          : !isConnected
            ? "Connecting..."
            : isRecording
              ? "Listening... Speak clearly into your microphone"
              : "Press the microphone to start recording"}
      </p>
    </div>
  );
}
