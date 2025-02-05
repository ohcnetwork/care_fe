import { SquareArrowOutUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isAndroidDevice } from "@/Utils/utils";

const isValidLatitude = (latitude: string) => {
  if (latitude === "0E-16") return false;
  const lat = parseFloat(latitude);
  return !isNaN(lat) && lat >= -90 && lat <= 90;
};
const isValidLongitude = (longitude: string) => {
  if (longitude === "0E-16") return false;
  const long = parseFloat(longitude);
  return !isNaN(long) && long >= -180 && long <= 180;
};

export const FacilityMapsLink = ({
  latitude,
  longitude,
}: {
  latitude: string;
  longitude: string;
}) => {
  const { t } = useTranslation();
  if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
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
  } else {
    return null;
  }
};
