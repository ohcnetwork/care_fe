import { Link } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import * as Notification from "@/Utils/Notifications";

export default function Error404() {
  const { t } = useTranslation();
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex h-screen items-center justify-center text-center">
      <div className="w-[500px] text-center">
        <img src="/images/404.svg" alt={t("error_404")} className="w-full" />
        <h1>{t("page_not_found")}</h1>
        <p>
          {t("404_message")}
          <br />
          <br />
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 hover:text-white"
          >
            {t("return_to_care")}
          </Link>
        </p>
      </div>
    </div>
  );
}
