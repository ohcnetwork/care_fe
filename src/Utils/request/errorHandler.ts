import { navigate } from "raviger";
import { toast } from "sonner";

import * as Notifications from "@/Utils/Notifications";
import { HTTPError } from "@/Utils/request/types";

export function handleHttpError(error: Error) {
  if (error.name === "AbortError") {
    return;
  }

  if (!(error instanceof HTTPError)) {
    Notifications.Error({ msg: error.message || "Something went wrong!" });
    return;
  }

  if (error.silent) {
    return;
  }

  const cause = error.cause;

  if (isNotFound(error)) {
    toast.error((cause?.detail as string) || "Not found");
    return;
  }

  if (isSessionExpired(cause)) {
    handleSessionExpired();
    return;
  }

  if (isBadRequest(error)) {
    Notifications.BadRequest({ errs: cause?.errors });
    return;
  }

  Notifications.Error({
    msg: cause?.detail || "Something went wrong...!",
  });
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
