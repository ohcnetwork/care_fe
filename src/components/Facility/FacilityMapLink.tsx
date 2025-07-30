import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { getMapUrl, isAndroidDevice } from "@/Utils/utils";

const isValidLatitude = (latitude: string) => {
  const lat = parseFloat(latitude.trim());
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
};

const isValidLongitude = (longitude: string) => {
  const long = parseFloat(longitude.trim());
  return Number.isFinite(long) && long >= -180 && long <= 180;
};

export const FacilityMapsLink = ({
  latitude,
  longitude,
}: {
  latitude: string;
  longitude: string;
}) => {
  const { t } = useTranslation();

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }
  const target = isAndroidDevice ? "_self" : "_blank";

  return (
    <Link
      className="text-primary hover:underline flex items-center gap-1"
      href={getMapUrl(latitude, longitude)}
      target={target}
      rel="noreferrer"
      aria-label={t("show_on_map")}
    >
      {t("show_on_map")}
      <SquareArrowOutUpRight className="size-3" />
    </Link>
  );
};
