import { useCallback, useRef, useState } from "react";

import {
  type RealtimeServerEvent,
  type RealtimeTranscriptionSession,
  startRealtimeTranscription,
} from "./realtimeClient";

export interface TranscriptionEvents {
  /** New partial text for an in-flight turn, identified by `itemId`. */
  onDelta: (itemId: string, delta: string) => void;
  /** Turn finalized. `transcript` is the full text. */
  onCompleted: (itemId: string, transcript: string) => void;
}

interface UseRealtimeTranscriptionArgs extends TranscriptionEvents {
  apiKey?: string;
  onError: (error: Error) => void;
}

export interface RealtimeTranscriptionHandle {
  isConnected: boolean;
  connect: (stream: MediaStream) => Promise<void>;
  disconnect: () => void;
}

/**
 * Thin reactive wrapper around `startRealtimeTranscription`. The hook exposes
 * only connection lifecycle + event callbacks; transcript state itself is
 * owned by the orchestrator (so it can annotate turns with speaker labels
 * after diarization).
 */
export function useRealtimeTranscription({
  apiKey,
  onDelta,
  onCompleted,
  onError,
}: UseRealtimeTranscriptionArgs): RealtimeTranscriptionHandle {
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef<RealtimeTranscriptionSession | null>(null);

  const handleEvent = useCallback(
    (event: RealtimeServerEvent) => {
      if (event.type === "conversation.item.input_audio_transcription.delta") {
        const e = event as {
          item_id?: string;
          delta: string;
        };
        onDelta(e.item_id ?? "__pending__", e.delta ?? "");
        return;
      }

      if (
        event.type === "conversation.item.input_audio_transcription.completed"
      ) {
        const e = event as {
          item_id?: string;
          transcript: string;
        };
        onCompleted(e.item_id ?? "__pending__", e.transcript ?? "");
        return;
      }
    },
    [onDelta, onCompleted],
  );

  const connect = useCallback(
    async (stream: MediaStream) => {
      if (!apiKey) {
        throw new Error("Missing OpenAI API key");
      }
      if (sessionRef.current) {
        return;
      }
      const session = await startRealtimeTranscription({
        apiKey,
        mediaStream: stream,
        onEvent: handleEvent,
        onOpen: () => setIsConnected(true),
        onClose: () => setIsConnected(false),
        onError,
      });
      sessionRef.current = session;
    },
    [apiKey, handleEvent, onError],
  );

  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setIsConnected(false);
  }, []);

  return { isConnected, connect, disconnect };
}
