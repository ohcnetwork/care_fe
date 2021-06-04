import React from "react";
import { useTranslation } from "react-i18next";

export const PublicDashboard = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-lg">
      <h1 className="text-center md:text-left text-3xl md:text-4xl xl:text-5xl tracking-tight font-bold text-black leading-tight">
        {t("mahakavach_title")}
      </h1>
      <h3 className="text-center md:text-left">{t("mahakavach_subtitle")}</h3>
      <div className="text-base md:text-2xl lg:text-2xl pt-6 max-w-xl text-black pl-1 hidden">
        {t("goal")}
      </div>
    </div>
  );
};
