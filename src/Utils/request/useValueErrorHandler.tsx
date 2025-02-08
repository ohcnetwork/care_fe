import { hashKey } from "@tanstack/react-query";

import { useHttpErrorHandler } from "@/Utils/request/errorHandler";

import { BadRequestValueError, HTTPError } from "./types";

type ValueErrorMatch =
  | { loc: string[]; msg: string }
  | { loc: string[]; msg?: undefined }
  | { loc?: undefined; msg: string };

/**
 * Pops a ValueError from the cause.
 * @param cause - The cause of the error (from the HTTPError instance)
 * @param match - The match to find in the cause.
 * @returns The ValueError that was popped, or null if no match was found.
 */
export const popValueError = (
  cause: HTTPError["cause"],
  match: ValueErrorMatch,
) => {
  if (!cause || !("errors" in cause)) {
    return null;
  }

  const matchedIndex = cause.errors.findIndex((error) => {
    if (!("type" in error) || error.type !== "value_error") {
      return false;
    }
    if (match.loc && JSON.stringify(error.loc) !== JSON.stringify(match.loc)) {
      return false;
    }
    if (match.msg && error.msg !== match.msg) {
      return false;
    }
    return true;
  });

  const error = cause.errors[matchedIndex];

  if (matchedIndex === -1) {
    return null;
  }

  cause.errors.splice(matchedIndex, 1);

  return error as BadRequestValueError;
};

/**
 * A wrapper around useHttpErrorHandler that pops a ValueError from the cause
 * and calls the onMatch callback if a match is found.
 */
export function useValueErrorHandler(opts: {
  match: ValueErrorMatch;
  onMatch: (error: BadRequestValueError) => void;
  meta?: Record<string, unknown>;
}) {
  useHttpErrorHandler(({ cause }, meta) => {
    if (opts.meta && hashKey([meta]) !== hashKey([opts.meta])) {
      return false;
    }

    const error = popValueError(cause, opts.match);
    if (error) {
      opts.onMatch(error);
      return true;
    }
  });
}
