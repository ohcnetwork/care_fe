export interface BatchRequestResult<T = unknown> {
  reference_id: string;
  data?: T;
  status_code: number;
}

export interface BatchRequestBody {
  requests: Array<{
    url: string;
    method: string;
    reference_id: string;
    body: any;
  }>;
}

export interface BatchRequestError {
  question_id?: string;
  msg?: string;
  error?: string;
  type?: string;
  loc?: string[];
  ctx?: {
    error?: string;
  };
}

export interface BatchErrorData {
  errors: BatchRequestError[];
}

export interface BatchResponseBase {
  reference_id: string;
  status_code: number;
}

// Request/Response types
export interface BatchRequest {
  url: string;
  method: string;
  reference_id: string;
  body: any; // Using any since the body type varies based on the request type
}

export interface BatchSuccessResponse<T = unknown> extends BatchResponseBase {
  data: T;
}
