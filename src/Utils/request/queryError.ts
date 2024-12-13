type QueryErrorCause = Record<string, unknown> | undefined;

export class QueryError extends Error {
  status: number;
  silent: boolean;
  cause?: QueryErrorCause;

  constructor({
    message,
    status,
    silent,
    cause,
  }: {
    message: string;
    status: number;
    silent: boolean;
    cause?: Record<string, unknown>;
  }) {
    super(message, { cause });
    this.status = status;
    this.silent = silent;
    this.cause = cause;
  }
}
