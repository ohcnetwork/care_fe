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

// Error types
export interface QuestionValidationError {
  question_id: string;
  error?: string;
  msg?: string;
  type?: string;
  field_key?: string;
  index?: number;
}

export interface DetailedValidationError {
  type: string;
  loc: string[];
  msg: string;
  ctx?: {
    error?: string;
  };
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

export interface StructuredDataError {
  errors: Array<{
    type: string;
    loc: string[];
    msg: string;
    ctx?: {
      error?: string;
    };
  }>;
}

// Request/Response types
export interface BatchRequest {
  url: string;
  method: string;
  reference_id: string;
  body: any; // Using any since the body type varies based on the request type
}

export interface BatchErrorData {
  errors: BatchRequestError[];
}

export interface BatchResponseBase {
  reference_id: string;
  status_code: number;
}

export interface BatchErrorResponse extends BatchResponseBase {
  data: BatchErrorData | StructuredDataError[];
}

export interface BatchSuccessResponse extends BatchResponseBase {
  data: unknown;
}

export interface ValidationErrorResponse {
  reference_id: string;
  status_code: number;
  data: {
    errors: QuestionValidationError[];
  };
}

// Type unions
export type BatchResponse = BatchErrorResponse | BatchSuccessResponse;

export type BatchSubmissionResult = BatchRequestResult<unknown>;

export type BatchResponseResult = ValidationErrorResponse | BatchResponse;
