// Transfer status types
export type TransferStatus = "pending" | "accepted" | "rejected" | "cancelled";

// Transfer data returned from API
export interface TransferData {
  id: number;
  status: TransferStatus;
  amount: number;
  from_user_id: string | null;
  from_user_name: string | null;
  from_counter_id: string | null;
  from_counter_name: string | null;
  to_user_id: string | null;
  to_user_name: string | null;
  to_counter_id: string | null;
  to_counter_name: string | null;
  created_at: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  reject_reason: string | null;
  denominations: Record<string, number> | null;
}

// Request to create a new transfer
export interface CreateTransferRequest {
  from_counter_x_care_id: string;
  to_session_id: string;
  amount: number;
  denominations?: Record<string, number>;
}

// Request to accept a transfer
export interface AcceptTransferRequest {
  counter_x_care_id: string;
  session_id: string;
}

// Request to reject a transfer
export interface RejectTransferRequest {
  counter_x_care_id: string;
  session_id: string;
  reason?: string;
}

// Request to cancel a transfer
export interface CancelTransferRequest {
  counter_x_care_id: string;
}

// Response wrapper for single transfer
export interface TransferResponse {
  success: boolean;
  transfer: TransferData | null;
  message?: string;
}

// Response wrapper for transfer list
export interface TransferListResponse {
  success: boolean;
  transfers: TransferData[];
  message?: string;
}
