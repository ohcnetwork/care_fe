/**
 * Minimal OpenAI Realtime WebRTC client, scoped to transcription-only use.
 *
 * Flow:
 *   1. POST /v1/realtime/transcription_sessions with the raw API key to mint
 *      an ephemeral `client_secret.value` (~1 min TTL).
 *   2. Build an RTCPeerConnection, attach the mic MediaStreamTrack, open a
 *      data channel called "oai-events" for JSON events, generate a local
 *      SDP offer.
 *   3. POST the offer SDP to /v1/realtime with `Authorization: Bearer
 *      <ephemeral>`. The response is the remote SDP answer.
 *   4. Receive transcription events on the data channel.
 *
 * POC caveat: the raw API key is used from the browser. We log a one-time
 * console warning and assume the caller has already gated this behind an
 * experiment flag.
 */
const REALTIME_BASE = "https://api.openai.com/v1/realtime";
const DEFAULT_MODEL = "gpt-4o-mini-transcribe";

let warned = false;

export interface RealtimeTranscriptionOptions {
  apiKey: string;
  model?: string;
  mediaStream: MediaStream;
  onEvent: (event: RealtimeServerEvent) => void;
  onOpen?: () => void;
  onClose?: (reason?: string) => void;
  onError?: (error: Error) => void;
  /** Optional locale hint. Leave undefined for auto-detect. */
  language?: string;
}

export interface RealtimeTranscriptionSession {
  close: (reason?: string) => void;
  send: (event: Record<string, unknown>) => void;
}

/** Minimal typing of the events we actually consume. */
export type RealtimeServerEvent =
  | {
      type: "conversation.item.input_audio_transcription.delta";
      item_id?: string;
      delta: string;
    }
  | {
      type: "conversation.item.input_audio_transcription.completed";
      item_id?: string;
      transcript: string;
    }
  | { type: "input_audio_buffer.speech_started"; item_id?: string }
  | { type: "input_audio_buffer.speech_stopped"; item_id?: string }
  | { type: "error"; error: { message?: string; code?: string } }
  | { type: string; [key: string]: unknown };

interface EphemeralKeyResponse {
  client_secret: { value: string; expires_at?: number };
  id?: string;
}

async function mintEphemeralKey(
  apiKey: string,
  model: string,
  language?: string,
): Promise<string> {
  const res = await fetch(`${REALTIME_BASE}/transcription_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_audio_format: "pcm16",
      input_audio_transcription: {
        model,
        ...(language ? { language } : {}),
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to create transcription session (${res.status}): ${body}`,
    );
  }

  const data = (await res.json()) as EphemeralKeyResponse;
  const key = data?.client_secret?.value;
  if (!key) {
    throw new Error("Transcription session response missing client_secret");
  }
  return key;
}

export async function startRealtimeTranscription(
  options: RealtimeTranscriptionOptions,
): Promise<RealtimeTranscriptionSession> {
  const { apiKey, mediaStream, onEvent, onOpen, onClose, onError } = options;
  const model = options.model ?? DEFAULT_MODEL;

  if (!warned) {
    warned = true;
    // Intentional one-shot warning: this path ships the key in the bundle.

    console.warn(
      "[AmbientScribe] Using OpenAI API key directly from the browser. " +
        "This is a POC-only path and must not be enabled in production.",
    );
  }

  const ephemeralKey = await mintEphemeralKey(apiKey, model, options.language);

  const pc = new RTCPeerConnection();
  const track = mediaStream.getAudioTracks()[0];
  if (!track) {
    pc.close();
    throw new Error("Microphone stream has no audio track");
  }
  pc.addTrack(track, mediaStream);

  const dc = pc.createDataChannel("oai-events");

  let isClosed = false;
  const close = (reason?: string) => {
    if (isClosed) return;
    isClosed = true;
    try {
      dc.close();
    } catch {
      // ignore
    }
    try {
      pc.close();
    } catch {
      // ignore
    }
    onClose?.(reason);
  };

  dc.addEventListener("open", () => {
    onOpen?.();
  });
  dc.addEventListener("close", () => close("data-channel-closed"));
  dc.addEventListener("error", (e) => {
    const message =
      e instanceof ErrorEvent && e.message ? e.message : "Data channel error";
    onError?.(new Error(message));
  });
  dc.addEventListener("message", (e) => {
    try {
      const payload = JSON.parse(e.data as string) as RealtimeServerEvent;
      onEvent(payload);
      if (payload.type === "error") {
        const err = (payload as { error?: { message?: string } }).error;
        onError?.(new Error(err?.message ?? "Unknown Realtime error"));
      }
    } catch {
      // Not JSON — ignore.
    }
  });

  pc.addEventListener("connectionstatechange", () => {
    if (
      pc.connectionState === "failed" ||
      pc.connectionState === "disconnected" ||
      pc.connectionState === "closed"
    ) {
      close(`peer-${pc.connectionState}`);
    }
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // For transcription-only sessions, the SDP exchange URL uses
  // `?intent=transcription` — the actual transcription model is configured
  // in the session body (`input_audio_transcription.model`). Passing the
  // transcription model name as a `?model=` param fails with
  // "Model X is not supported in transcription mode".
  const sdpRes = await fetch(`${REALTIME_BASE}?intent=transcription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp",
    },
    body: offer.sdp ?? "",
  });

  if (!sdpRes.ok) {
    const body = await sdpRes.text().catch(() => "");
    close("sdp-exchange-failed");
    throw new Error(`Failed Realtime SDP exchange (${sdpRes.status}): ${body}`);
  }

  const answerSdp = await sdpRes.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  const send = (event: Record<string, unknown>) => {
    if (dc.readyState === "open") {
      dc.send(JSON.stringify(event));
    }
  };

  return { close, send };
}
