import React from "react";
import { useTranslation } from "react-i18next";

export const PublicDashboard = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-lg">
      <h1 className="text-3xl md:text-4xl xl:text-5xl tracking-tight font-bold text-white leading-tight">
        {t("coronasafe_network")}
      </h1>
      <div className="text-base md:text-2xl lg:text-xl pt-6 max-w-xl text-white pl-1">
        {t("goal")}
      </div>
    </div>
  );
};
