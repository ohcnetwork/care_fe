import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import {
  getMapUrl,
  isAndroidDevice,
  isValidLatitude,
  isValidLongitude,
} from "@/Utils/utils";

export const FacilityMapsLink = ({
  latitude,
  longitude,
}: {
  latitude: string;
  longitude: string;
}) => {
  const { t } = useTranslation();

  if (
    !isValidLatitude(Number(latitude)) ||
    !isValidLongitude(Number(longitude))
  ) {
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
