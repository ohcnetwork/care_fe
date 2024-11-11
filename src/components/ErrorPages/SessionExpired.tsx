import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "@/hooks/useAuthUser";

import * as Notification from "@/Utils/Notifications";

export default function SessionExpired() {
  const { signOut } = useAuthContext();
  const { t } = useTranslation();

  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center text-center">
      <div className="w-[500px] text-center">
        <img
          src="/images/session_expired.svg"
          alt={t("session_expired")}
          className="mx-auto w-1/2"
        />
        <h1>{t("session_expired")}</h1>
        <p>
          {t("session_expired_msg")}
          <br />
          <br />
          <div
            onClick={signOut}
            className="mt-5 inline-block cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-400"
          >
            {t("return_to_login")}
          </div>
        </p>
      </div>
    </div>
  );
}
