import { MutationMeta, QueryMeta } from "@tanstack/react-query";
import { t } from "i18next";
import { navigate } from "raviger";
import React from "react";
import { toast } from "sonner";

import { HTTPError } from "@/Utils/request/types";

type Meta = QueryMeta | MutationMeta | undefined;

export type HttpErrorHandler = (error: HTTPError, meta: Meta) => boolean | void;

const httpErrorHandlers: HttpErrorHandler[] = [];

/**
 * Registers a handler that will be called for all HTTP errors.
 * The latest registered handler will be called first.
 * @param handler - The handler to register.
 */
export function registerHttpErrorHandler(handler: HttpErrorHandler) {
  httpErrorHandlers.splice(0, 0, handler);
}

/**
 * Unregisters a handler that was previously registered using
 * `registerHttpErrorHandler`.
 * @param handler - The handler to unregister.
 */
export function unregisterHttpErrorHandler(handler: HttpErrorHandler) {
  httpErrorHandlers.splice(httpErrorHandlers.indexOf(handler), 1);
}

/**
 * Registers a handler that will be called for all HTTP errors.
 *
 * When the handler returns `true`, the error is considered handled and no
 * other handlers will be called.
 *
 * The error handler will be unregistered when the component unmounts.
 * @param handler - The handler to register.
 */
export function useHttpErrorHandler(handler: HttpErrorHandler) {
  const handlerRef = React.useRef(handler);

  React.useEffect(() => {
    registerHttpErrorHandler(handlerRef.current);
    return () => unregisterHttpErrorHandler(handlerRef.current);
  }, [handlerRef]);
}

/**
 * Handles HTTP errors.
 * @param error - The error to handle.
 */
export function handleHttpError(error: Error, meta?: Meta) {
  // If the error is an AbortError, skip further handling.
  if (error.name === "AbortError") {
    return;
  }

  // If the error is silenced, skip further handling.
  //
  // Voluntarily kept this check before the HTTPError instance check as errors
  // from plugins may not be an instance of HTTPError, but plugins could choose
  // to set the `silent` property regardless.
  if ("silent" in error && error.silent) {
    return;
  }

  // If the error is not an HTTPError, show a generic error message and skip
  // further handling.
  if (!(error instanceof HTTPError)) {
    toast.error(error.message || t("something_went_wrong"));
    return;
  }

  // Session expired handler is always called before any other handlers.
  if (sessionExpiredHandler(error, meta)) {
    return;
  }

  // Other handlers are called in the order they were registered.
  for (const handler of httpErrorHandlers) {
    if (handler(error, meta)) {
      return;
    }
  }

  // Default / fallback handlers are called last.
  for (const handler of [detailHandler, notFoundHandler, badRequestHandler]) {
    if (handler(error, meta)) {
      return;
    }
  }

  // If no handler handled the error, show a generic error message.
  toast.error(t("something_went_wrong"));
}

/**
 * Handles HTTP errors with a `detail` property by showing it as an error.
 */
const detailHandler: HttpErrorHandler = ({ cause }) => {
  if (cause && "detail" in cause && typeof cause.detail === "string") {
    toast.error(cause.detail);
    return true;
  }
};

/**
 * Handles HTTP 400 Bad Request errors by showing a generic error message.
 */
const badRequestHandler: HttpErrorHandler = ({ status, cause }) => {
  if (status !== 400) {
    return false;
  }

  if (cause && "errors" in cause) {
    for (const error of cause.errors) {
      if ("type" in error && error.type === "value_error") {
        // If error has a ctx property with an error property, show the error.
        if (error.ctx && "error" in error.ctx) {
          toast.error(error.ctx.error);
          continue;
        }

        if (typeof error.msg === "string") {
          toast.error(error.msg);
          continue;
        }
      }
    }
  }

  return true;
};

/**
 * Handles Session Expired / Invalid Token errors by redirecting to the
 * session expired page.
 */
const sessionExpiredHandler: HttpErrorHandler = ({ cause }) => {
  if (!cause || !("code" in cause) || !("detail" in cause)) {
    return;
  }

  if (
    cause.code !== "token_not_valid" &&
    cause.detail !== "Authentication credentials were not provided."
  ) {
    return;
  }

  // If the user is not already on the session expired page, navigate to it.
  if (!location.pathname.startsWith("/session-expired")) {
    navigate(`/session-expired?redirect=${window.location.href}`);
  }

  return true;
};

/**
 * Handles HTTP 404 Not Found errors by showing a generic error message.
 */
const notFoundHandler: HttpErrorHandler = ({ status }) => {
  if (status === 404) {
    toast.error(t("not_found"));
    return true;
  }
};
