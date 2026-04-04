import type { TranscriptionSegment } from "@/types";
import { useEffect, useRef } from "react";

interface TranscriptionPanelProps {
  segments: TranscriptionSegment[];
  partialText: string;
  isRecording: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function TranscriptionPanel({
  segments,
  partialText,
  isRecording,
}: TranscriptionPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new segments arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [segments, partialText]);

  if (segments.length === 0 && !partialText) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>
          {isRecording
            ? "Waiting for speech..."
            : "Transcription will appear here when you start recording"}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-2 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg"
    >
      {segments.map((segment) => (
        <div
          key={segment.id}
          className="flex gap-3 p-2 rounded hover:bg-gray-100 transition-colors"
        >
          <span className="text-xs text-gray-400 font-mono whitespace-nowrap pt-1">
            {formatTime(segment.start_time)}
          </span>
          <div className="flex-1">
            {segment.speaker && (
              <span className="text-xs font-semibold text-blue-600 mr-2">
                {segment.speaker}
              </span>
            )}
            <span className="text-gray-800">{segment.text}</span>
          </div>
          {segment.confidence > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap h-fit ${
                segment.confidence > 0.9
                  ? "bg-green-100 text-green-700"
                  : segment.confidence > 0.7
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {Math.round(segment.confidence * 100)}%
            </span>
          )}
        </div>
      ))}

      {/* Partial/interim transcription */}
      {partialText && (
        <div className="flex gap-3 p-2 opacity-60">
          <span className="text-xs text-gray-400 font-mono whitespace-nowrap pt-1">
            ...
          </span>
          <span className="text-gray-600 italic">{partialText}</span>
        </div>
      )}
    </div>
  );
}
