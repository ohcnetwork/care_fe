import { SquareArrowOutUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isAndroidDevice } from "@/Utils/utils";

export const FacilityMapsLink = ({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) => {
  const { t } = useTranslation();
  const href = isAndroidDevice
    ? `geo:0,0?q=${latitude},${longitude}`
    : `https://maps.google.com/?q=${latitude},${longitude}`;
  return (
    <a
      className="text-sm text-primary flex items-center gap-1 w-max"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {t("show_on_maps")}
      <SquareArrowOutUpRight className="h-3 w-3" />
    </a>
  );
};
