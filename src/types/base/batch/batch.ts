export interface BatchRequestResult<T = unknown> {
  reference_id: string;
  data?: T;
  status_code: number;
}

export interface BatchRequestResponse<T = unknown> {
  results: BatchRequestResult<T>[];
}

export interface BatchRequestBody<T = unknown> {
  requests: Array<{
    url: string;
    method: string;
    reference_id: string;
    body: T;
  }>;
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
  body: unknown;
}

export interface BatchSuccessResponse<T = unknown> extends BatchResponseBase {
  data: T;
}
