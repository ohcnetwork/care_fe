import { RequestResult } from "./types";
import * as Notifications from "../Notifications";
import { navigate } from "raviger";

export default function handleResponse(
  { res, error }: RequestResult<unknown>,
  silent?: boolean,
) {
  const notify = silent ? undefined : Notifications;

  if (res === undefined) {
    return;
  }

  // 400/406 Bad Request
  if (res.status === 400 || res.status === 406) {
    notify?.BadRequest({ errs: error });
    return;
  }

  // Other Errors between 400-599 (inclusive)
  if (res.status >= 400 && res.status < 600) {
    // Invalid token
    if (!silent && error?.code === "token_not_valid") {
      navigate(`/session-expired?redirect=${window.location.href}`);
    }

    // Handle session expiry
    if (error?.detail === "Authentication credentials were not provided.") {
      notify?.Error({ msg: "Session expired. Please Login again." });
      return;
    }

    notify?.Error({ msg: error?.detail || "Something went wrong...!" });
    return;
  }
}
