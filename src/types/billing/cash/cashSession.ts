// Session status types
export type SessionStatus = "open" | "closed";

// Session data returned from API
export interface SessionData {
  id: number;
  status: SessionStatus;
  opening_balance: number;
  expected_amount: number;
  counter_id: number;
  counter_x_care_id: string;
  external_user_id: string;
  external_user_name: string;
  counter_name: string;
  opened_at: string;
  closed_at: string | null;
  closing_expected: number;
  closing_declared: number;
  closing_difference: number;
  difference_status: string | null;
  payment_count: number;
  pending_outgoing_count: number;
  pending_incoming_count: number;
}

export interface OpenSessionInfo {
  session_id: number;
  external_user_id: string;
  external_user_name: string;
}

// Counter data returned from API
export interface CounterData {
  id: number;
  name: string;
  x_care_id: string;
  is_main_cash: boolean;
  open_sessions: OpenSessionInfo[];
  open_sessions_count: number;
}

// Request to open a new session
export interface OpenSessionRequest {
  counter_x_care_id: string;
  opening_balance?: number;
}

// Request to close a session
export interface CloseSessionRequest {
  counter_x_care_id: string;
}

// Response wrapper for single session
export interface SessionResponse {
  success: boolean;
  session: SessionData | null;
  message?: string;
}

// Response wrapper for session list
export interface SessionListResponse {
  success: boolean;
  sessions: SessionData[];
  message?: string;
}

// Response wrapper for counter list
export interface CounterListResponse {
  success: boolean;
  counters: CounterData[];
  count: number;
  message?: string;
}
