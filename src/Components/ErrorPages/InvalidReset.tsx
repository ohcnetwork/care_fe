import * as Notification from "../../Utils/Notifications";
import { useEffect } from "react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

export default function InvalidReset() {
  const { t } = useTranslation();
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex justify-center text-center items-center h-screen">
      <div className="text-center w-[500px]">
        <img
          src={`${process.env.PUBLIC_URL}/images/invalid_reset.svg`}
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
            className="rounded-lg px-4 py-2 inline-block bg-primary-600 text-white hover:text-white hover:bg-primary- cursor-pointer"
          >
            {t("return_to_password_reset")}
          </Link>
        </p>
      </div>
    </div>
  );
}
