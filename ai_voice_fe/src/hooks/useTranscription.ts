import { useCallback, useEffect, useRef, useState } from "react";
import { createTranscriptionWebSocket } from "@/api";
import type { WebSocketMessage, TranscriptionSegment } from "@/types";

interface TranscriptionState {
  isConnected: boolean;
  isRecording: boolean;
  segments: TranscriptionSegment[];
  partialText: string;
  error: string | null;
  transcript: string;
}

export function useTranscription(sessionId: string | null) {
  const [state, setState] = useState<TranscriptionState>({
    isConnected: false,
    isRecording: false,
    segments: [],
    partialText: "",
    error: null,
    transcript: "",
  });

  const wsRef = useRef<WebSocket | null>(null);
  const segmentIdCounter = useRef(0);

  const connect = useCallback(() => {
    if (!sessionId || wsRef.current) return;

    const ws = createTranscriptionWebSocket(sessionId);
    wsRef.current = ws;

    ws.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data);
        handleMessage(msg);
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      setState((prev) => ({
        ...prev,
        error: "WebSocket connection error",
      }));
    };

    ws.onclose = () => {
      wsRef.current = null;
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isRecording: false,
      }));
    };
  }, [sessionId]);

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    switch (msg.type) {
      case "connected":
        setState((prev) => ({ ...prev, isConnected: true }));
        break;

      case "recording_started":
        setState((prev) => ({ ...prev, isRecording: true }));
        break;

      case "recording_stopped":
        setState((prev) => ({ ...prev, isRecording: false, partialText: "" }));
        break;

      case "transcript":
        if (msg.is_final && msg.text) {
          const newSegment: TranscriptionSegment = {
            id: `local-${segmentIdCounter.current++}`,
            text: msg.text,
            start_time: msg.start_time ?? 0,
            end_time: msg.end_time ?? 0,
            confidence: msg.confidence ?? 0,
            speaker: "",
            is_final: true,
            created_date: new Date().toISOString(),
          };
          setState((prev) => ({
            ...prev,
            segments: [...prev.segments, newSegment],
            partialText: "",
          }));
        } else if (msg.text) {
          setState((prev) => ({ ...prev, partialText: msg.text ?? "" }));
        }
        break;

      case "session_completed":
        setState((prev) => ({
          ...prev,
          transcript: msg.transcript ?? "",
          isRecording: false,
        }));
        break;

      case "error":
        setState((prev) => ({ ...prev, error: msg.message ?? "Unknown error" }));
        break;
    }
  }, []);

  const startRecording = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "start" }));
  }, []);

  const stopRecording = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "stop" }));
  }, []);

  const sendAudio = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendAudio,
  };
}
