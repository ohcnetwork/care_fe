const API_BASE = import.meta.env.VITE_CARE_URL || "";
const PLUGIN_API = `${API_BASE}/api/ai_voice`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("care_access_token") || "";
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.error || res.statusText);
  }
  return res.json();
}

export const api = {
  sessions: {
    list: (encounterId: string) =>
      request<import("@/types").TranscriptionSessionListItem[]>(
        `${PLUGIN_API}/sessions/?encounter_id=${encounterId}`
      ),
    get: (id: string) =>
      request<import("@/types").TranscriptionSession>(
        `${PLUGIN_API}/sessions/${id}/`
      ),
    create: (encounterId: string) =>
      request<import("@/types").TranscriptionSession>(
        `${PLUGIN_API}/sessions/`,
        {
          method: "POST",
          body: JSON.stringify({ encounter_id: encounterId }),
        }
      ),
    complete: (id: string) =>
      request<import("@/types").TranscriptionSession>(
        `${PLUGIN_API}/sessions/${id}/complete/`,
        { method: "POST" }
      ),
    generateNotes: (id: string) =>
      request<import("@/types").SOAPNote>(
        `${PLUGIN_API}/sessions/${id}/generate_notes/`,
        { method: "POST" }
      ),
  },
  soapNotes: {
    get: (id: string) =>
      request<import("@/types").SOAPNote>(
        `${PLUGIN_API}/soap-notes/${id}/`
      ),
    update: (id: string, data: Partial<import("@/types").SOAPNote>) =>
      request<import("@/types").SOAPNote>(
        `${PLUGIN_API}/soap-notes/${id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      ),
    markReviewed: (id: string) =>
      request<import("@/types").SOAPNote>(
        `${PLUGIN_API}/soap-notes/${id}/mark_reviewed/`,
        { method: "POST" }
      ),
  },
};

export function createTranscriptionWebSocket(
  sessionId: string
): WebSocket {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsHost = API_BASE.replace(/^https?:\/\//, "") || window.location.host;
  return new WebSocket(
    `${wsProtocol}//${wsHost}/ws/transcription/${sessionId}/`
  );
}
