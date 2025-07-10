import {
  BatchErrorData,
  BatchRequestResult,
  BatchResponseBase,
  BatchSuccessResponse,
} from "@/types/base/batch/batch";

export interface BatchErrorResponse extends BatchResponseBase {
  data: BatchErrorData | StructuredDataError[];
}
// Error types
export interface QuestionValidationError {
  question_id: string;
  error?: string;
  msg?: string;
  type?: string;
  field_key?: string;
  index?: number;
  required?: boolean;
}

export interface DetailedValidationError {
  type: string;
  loc: string[];
  msg: string;
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

export interface ValidationErrorResponse {
  reference_id: string;
  status_code: number;
  data: {
    errors: QuestionValidationError[];
  };
}

// Type unions
export type BatchResponse<T = unknown> =
  | BatchErrorResponse
  | BatchSuccessResponse<T>;

export type BatchSubmissionResult<T = unknown> = BatchRequestResult<T>;

export type BatchResponseResult<T = unknown> =
  | ValidationErrorResponse
  | BatchResponse<T>;
