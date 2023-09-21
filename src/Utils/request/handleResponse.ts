import { RequestResult } from "./types";
import * as Notifications from "../Notifications";
import { navigate } from "raviger";

export default function handleResponse(
  { res, error }: RequestResult<unknown>,
  silent?: boolean
) {
  const notify = silent ? undefined : Notifications;

  if (res === undefined) {
    return;
  }

  // 5xx errors
  if (res.status >= 500 && res.status < 600) {
    console.error("Server error", res);
    notify?.Error({ msg: "Something went wrong...!" });
    return;
  }

  // 400/406 Bad Request
  if (res.status === 400 || res.status === 406) {
    notify?.BadRequest({ errs: error });
    return;
  }

  // Other 400 Errors
  if (res.status >= 400) {
    // Invalid token
    if (!silent && error?.code === "token_not_valid") {
      navigate("/session-expired");
    }

    notify?.Error({ msg: error?.detail || "Something went wrong...!" });
    return;
  }
}
