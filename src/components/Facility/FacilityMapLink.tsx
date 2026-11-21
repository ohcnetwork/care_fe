import { SquareArrowOutUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HrefLink } from "@/lib/router/HrefLink";
import { cn } from "@/lib/utils";

import {
  getMapUrl,
  isAndroidDevice,
  isValidLatitude,
  isValidLongitude,
} from "@/Utils/utils";

export const FacilityMapsLink = ({
  latitude,
  longitude,
  className,
}: {
  latitude: string;
  longitude: string;
  className?: string;
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
    <HrefLink
      className={cn(
        "text-primary hover:underline flex w-fit items-center gap-1",
        className,
      )}
      href={getMapUrl(latitude, longitude)}
      target={target}
      rel="noreferrer"
      aria-label={t("show_on_map")}
    >
      {t("show_on_map")}
      <SquareArrowOutUpRight className="size-3" />
    </HrefLink>
  );
};
