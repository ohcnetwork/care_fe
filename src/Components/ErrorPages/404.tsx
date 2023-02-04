import { Link } from "raviger";
import * as Notification from "../../Utils/Notifications";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Error404() {
  const { t } = useTranslation();
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex justify-center text-center items-center h-screen">
      <div className="text-center w-[500px]">
        <img
          src={`${process.env.PUBLIC_URL}/images/404.svg`}
          alt={t("error_404")}
          className="w-full"
        />
        <h1>{t("page_not_found")}</h1>
        <p>
          {t("404_message")}
          <br />
          <br />
          <Link
            href="/"
            className="rounded-lg px-4 py-2 inline-block bg-primary-600 text-white hover:text-white hover:bg-primary-700"
          >
            {t("return_to_care")}
          </Link>
        </p>
      </div>
    </div>
  );
}
