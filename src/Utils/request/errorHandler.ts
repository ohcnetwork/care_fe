import { t } from "i18next";
import { navigate } from "raviger";
import { toast } from "sonner";

import * as Notifications from "@/Utils/Notifications";
import { HTTPError, StructuredError } from "@/Utils/request/types";

export function handleHttpError(error: Error) {
  // Skip handling silent errors and AbortError
  if (("silent" in error && error.silent) || error.name === "AbortError") {
    return;
  }

  if (!(error instanceof HTTPError)) {
    toast.error(error.message || t("something_went_wrong"));
    return;
  }

  const cause = error.cause;

  if (isNotFound(error)) {
    toast.error((cause?.detail as string) || t("not_found"));
    return;
  }

  if (isSessionExpired(cause)) {
    handleSessionExpired();
    return;
  }

  if (isBadRequest(error)) {
    const errs = cause?.errors;
    if (isPydanticError(errs)) {
      handlePydanticErrors(errs);
      return;
    }

    if (isStructuredError(cause)) {
      handleStructuredErrors(cause);
      return;
    }

    Notifications.BadRequest({ errs });
    return;
  }

  toast.error((cause?.detail as string) || t("something_went_wrong"));
}

function isSessionExpired(error: HTTPError["cause"]) {
  return (
    // If Authorization header is not valid
    error?.code === "token_not_valid" ||
    // If Authorization header is not provided
    error?.detail === "Authentication credentials were not provided."
  );
}

function handleSessionExpired() {
  if (!location.pathname.startsWith("/session-expired")) {
    navigate(`/session-expired?redirect=${window.location.href}`);
  }
}

function isBadRequest(error: HTTPError) {
  return error.status === 400 || error.status === 406;
}

function isNotFound(error: HTTPError) {
  return error.status === 404;
}

type PydanticError = {
  type: string;
  loc?: string[];
  msg: string | Record<string, string>;
  input?: unknown;
  url?: string;
};

function isStructuredError(err: HTTPError["cause"]): err is StructuredError {
  return typeof err === "object" && !Array.isArray(err);
}

function handleStructuredErrors(cause: StructuredError) {
  for (const value of Object.values(cause)) {
    if (Array.isArray(value)) {
      value.forEach((err: any) => {
        if (typeof err === "string") {
          toast.error(err);
        } else if (err && typeof err === "object") {
          // Handle object errors - extract meaningful error messages
          const errorFields = ["detail", "msg", "error", "message"] as const;
          const errorMessage = errorFields.find(
            (field) => err[field] && typeof err[field] === "string",
          );

          toast.error(
            errorMessage ? err[errorMessage] : t("something_went_wrong"),
          );
        }
      });
      return;
    }
    if (typeof value === "string") {
      toast.error(value);
      return;
    }
  }
}

function isPydanticError(errors: unknown): errors is PydanticError[] {
  return (
    Array.isArray(errors) &&
    errors.every(
      (error) => typeof error === "object" && error !== null && "type" in error,
    )
  );
}

function handlePydanticErrors(errors: PydanticError[]) {
  errors.map(({ type, loc, msg }) => {
    const message = typeof msg === "string" ? msg : Object.values(msg)[0];
    if (!loc) {
      toast.error(message);
      return;
    }
    type = type
      .replace("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    toast.error(message, {
      description: `${type}: '${loc.join(".")}'`,
      duration: 8000,
    });
  });
}
