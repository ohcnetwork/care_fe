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
  /**
   * Fires when the realtime session closes WITHOUT a preceding explicit
   * `disconnect()` from us — i.e. the OpenAI side dropped the data channel
   * (session timeout, ICE failure, server-side error). The orchestrator
   * uses this to attempt reconnection so the doctor doesn't have to.
   */
  onUnexpectedClose?: (reason?: string) => void;
  /**
   * Fires for every event received on the data channel, regardless of
   * type. Used as a heartbeat signal to detect "session is open but no
   * transcript activity for too long" stalls.
   */
  onActivity?: () => void;
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
  onUnexpectedClose,
  onActivity,
}: UseRealtimeTranscriptionArgs): RealtimeTranscriptionHandle {
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef<RealtimeTranscriptionSession | null>(null);
  // Set to true right before we call `session.close()` ourselves so we can
  // distinguish "we asked for it" closes (stop / reconnect) from "the
  // server / network kicked us" closes (which trigger reconnect logic).
  const expectedCloseRef = useRef(false);

  const handleEvent = useCallback(
    (event: RealtimeServerEvent) => {
      onActivity?.();

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
    [onActivity, onDelta, onCompleted],
  );

  const handleClose = useCallback(
    (reason?: string) => {
      setIsConnected(false);
      if (expectedCloseRef.current) {
        expectedCloseRef.current = false;
        return;
      }
      onUnexpectedClose?.(reason);
    },
    [onUnexpectedClose],
  );

  const connect = useCallback(
    async (stream: MediaStream) => {
      if (!apiKey) {
        throw new Error("Missing OpenAI API key");
      }
      if (sessionRef.current) {
        return;
      }
      // Reset the flag for the new session.
      expectedCloseRef.current = false;
      const session = await startRealtimeTranscription({
        apiKey,
        mediaStream: stream,
        onEvent: handleEvent,
        onOpen: () => setIsConnected(true),
        onClose: handleClose,
        onError,
      });
      sessionRef.current = session;
    },
    [apiKey, handleClose, handleEvent, onError],
  );

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      // Mark the upcoming close as expected so handleClose doesn't fire
      // onUnexpectedClose and trigger a reconnect.
      expectedCloseRef.current = true;
      sessionRef.current.close();
    }
    sessionRef.current = null;
    setIsConnected(false);
  }, []);

  return { isConnected, connect, disconnect };
}
