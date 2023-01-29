import * as Notification from "../../Utils/Notifications";
import { useEffect } from "react";
import { handleSignOut } from "../../Utils/utils";
import { useTranslation } from "react-i18next";

export default function SessionExpired() {
  const { t } = useTranslation();
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex justify-center text-center items-center h-screen">
      <div className="text-center w-[500px]">
        <img
          src={`${process.env.PUBLIC_URL}/images/session_expired.svg`}
          alt={t("session_expired")}
          className="w-full"
        />
        <h1>{t("session_expired")}</h1>
        <p>
          {t("session_expired_msg")}
          <br />
          <br />
          <div
            onClick={() => {
              handleSignOut(false);
            }}
            className="rounded-lg px-4 py-2 inline-block bg-primary-600 text-white hover:text-white hover:bg-primary- cursor-pointer"
          >
            {t("return_to_login")}
          </div>
        </p>
      </div>
    </div>
  );
}
