import { navigate } from "raviger";

import * as Notifications from "@/Utils/Notifications";
import { QueryError } from "@/Utils/request/queryError";

export function handleQueryError(error: Error) {
  if (error.name === "AbortError") {
    return;
  }

  if (!(error instanceof QueryError)) {
    Notifications.Error({ msg: error.message || "Something went wrong!" });
    return;
  }

  if (error.silent) {
    return;
  }

  const cause = error.cause;

  if (isSessionExpired(cause)) {
    handleSessionExpired();
    return;
  }

  if (isBadRequest(error)) {
    Notifications.BadRequest({ errs: cause });
    return;
  }

  Notifications.Error({
    msg: cause?.detail || "Something went wrong...!",
  });
}

function isSessionExpired(error: QueryError["cause"]) {
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

function isBadRequest(error: QueryError) {
  return error.status === 400 || error.status === 406;
}
