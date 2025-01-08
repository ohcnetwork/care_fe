import { t } from "i18next";
import { navigate } from "raviger";
import { toast } from "sonner";

import * as Notifications from "@/Utils/Notifications";
import { RequestResult } from "@/Utils/request/types";

export default function handleResponse(
  { res, error }: RequestResult<unknown>,
  silent?: boolean,
) {
  const notify = silent ? undefined : Notifications;

  if (res === undefined) {
    return;
  }

  // 404 Not Found
  if (res.status === 404) {
    toast.error(t("not_found"));
    return;
  }

  // 400/406 Bad Request
  if (res.status === 400 || res.status === 406) {
    notify?.BadRequest({ errs: error });
    return;
  }

  // Other Errors between 400-599 (inclusive)
  if (res.status >= 400 && res.status < 600) {
    // Handle invalid token / session expiry
    if (
      !silent &&
      (error?.code === "token_not_valid" ||
        error?.detail === "Authentication credentials were not provided.")
    ) {
      if (!location.pathname.startsWith("/session-expired")) {
        navigate(`/session-expired?redirect=${window.location.href}`);
      }
      return;
    }

    toast.error((error?.detail as string) || t("something_went_wrong"));
    return;
  }
}
