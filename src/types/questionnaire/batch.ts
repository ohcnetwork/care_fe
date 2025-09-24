import {
  BatchResponseBase,
  BatchSuccessResponse,
} from "@/types/base/batch/batch";

// Error types

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
export interface DetailedValidationError {
  type: string;
  loc: string[];
  msg: string;
  ctx?: {
    error?: string;
  };
}
export interface BatchErrorResponse extends BatchResponseBase {
  data: BatchErrorData | StructuredDataError[];
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

export interface QuestionValidationError {
  question_id: string;
  error?: string;
  msg?: string;
  type?: string;
  field_key?: string;
  index?: number;
  required?: boolean;
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

export type BatchResponseResult<T = unknown> =
  | ValidationErrorResponse
  | BatchResponse<T>;
