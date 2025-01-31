import { SquareArrowOutUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isAndroidDevice } from "@/Utils/utils";

export const FacilityMapsLink = ({
  latitude,
  longitude,
}: {
  latitude: number & { __brand: "ValidLatitude" };
  longitude: number & { __brand: "ValidLongitude" };
}) => {
  if (latitude < -90 || latitude > 90) {
    throw new Error("Invalid latitude. Must be between -90 and 90 degrees.");
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error("Invalid longitude. Must be between -180 and 180 degrees.");
  }
  const { t } = useTranslation();
  const href = isAndroidDevice
    ? `geo:0,0?q=${latitude},${longitude}`
    : `https://maps.google.com/?q=${latitude},${longitude}`;
  const target = isAndroidDevice ? "_self" : "_blank";
  return (
    <a
      className="text-sm text-primary flex items-center gap-1 w-max"
      href={href}
      target={target}
      rel="noreferrer"
    >
      {t("show_on_maps")}
      <SquareArrowOutUpRight className="h-3 w-3" />
    </a>
  );
};
