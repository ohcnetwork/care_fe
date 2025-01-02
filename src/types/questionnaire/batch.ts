export interface BatchRequestResult<T = unknown> {
  data: T;
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

interface BaseValidationError {
  type: string;
  msg: string;
}

export interface QuestionValidationError extends BaseValidationError {
  question_id: string;
  error?: string;
}

export interface DetailedValidationError extends BaseValidationError {
  loc: string[];
  input: any;
  url: string;
  ctx?: {
    error: string;
  };
}

export interface SuccessResponse {
  data: any;
  status_code: 200;
}

export interface ValidationErrorResponse {
  data: {
    errors: Array<QuestionValidationError | DetailedValidationError>;
  };
  status_code: 400 | 404;
}

export type BatchResponseResult = SuccessResponse | ValidationErrorResponse;

export interface BatchResponse {
  results: BatchResponseResult[];
}

export type BatchSubmissionResult = BatchResponseResult;
