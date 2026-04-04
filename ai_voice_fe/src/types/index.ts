export interface TranscriptionSegment {
  id: string;
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
  speaker: string;
  is_final: boolean;
  created_date: string;
}

export interface SOAPNote {
  id: string;
  session_id: string;
  status: "generating" | "completed" | "reviewed" | "failed";
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  summary: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_date: string;
  modified_date: string;
}

export interface TranscriptionSession {
  id: string;
  encounter_id: string;
  initiated_by_name: string;
  status:
    | "created"
    | "recording"
    | "transcribing"
    | "generating_notes"
    | "completed"
    | "failed";
  duration_seconds: number;
  transcript: string;
  segments: TranscriptionSegment[];
  soap_notes: SOAPNote[];
  created_date: string;
  modified_date: string;
}

export interface TranscriptionSessionListItem {
  id: string;
  encounter_id: string;
  initiated_by_name: string;
  status: TranscriptionSession["status"];
  duration_seconds: number;
  soap_note_count: number;
  segment_count: number;
  created_date: string;
  modified_date: string;
}

export interface WebSocketMessage {
  type:
    | "connected"
    | "recording_started"
    | "recording_stopped"
    | "transcript"
    | "session_completed"
    | "error"
    | "pong";
  text?: string;
  confidence?: number;
  start_time?: number;
  end_time?: number;
  is_final?: boolean;
  session_id?: string;
  transcript?: string;
  message?: string;
}
