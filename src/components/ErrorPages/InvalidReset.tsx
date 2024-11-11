import { Link } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import * as Notification from "@/Utils/Notifications";

export default function InvalidReset() {
  const { t } = useTranslation();
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex h-screen items-center justify-center text-center">
      <div className="w-[500px] text-center">
        <img
          src="/images/invalid_reset.svg"
          alt={t("invalid_reset")}
          className="w-full"
        />
        <h1>{t("invalid_password_reset_link")}</h1>
        <p>
          {t("invalid_link_msg")}
          <br />
          <br />
          <Link
            href="/forgot-password"
            className="hover:bg-primary- inline-block cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-white hover:text-white"
          >
            {t("return_to_password_reset")}
          </Link>
        </p>
      </div>
    </div>
  );
}
