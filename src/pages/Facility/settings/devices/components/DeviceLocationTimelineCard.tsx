import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import { formatName } from "@/Utils/utils";
import { DeviceLocationHistory } from "@/types/device/device";

interface LocationCardProps {
  locationData: DeviceLocationHistory;
}

interface LocationNodeProps {
  locationData: DeviceLocationHistory;
  children?: React.ReactNode;
}

function LocationNode({ locationData, children }: LocationNodeProps) {
  const { t } = useTranslation();
  const { start, end, location, created_by } = locationData;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center text-sm font-semibold">
        <Link
          href={`/locations/${location.id}`}
          className="flex items-center gap-1"
        >
          {location.name}
          <CareIcon icon="l-external-link-alt" className="size-3 opacity-50" />
        </Link>

        <div className="ml-2">
          <Badge variant="outline" className="text-xs">
            {t(`location_form__${location?.form}`)}
          </Badge>
        </div>
      </div>
      <div className="flex items-center text-sm">
        <span className="text-gray-700 font-normal">
          {t("associated_by", { name: formatName(created_by) })}
        </span>
      </div>
      {children}
      <span className="flex items-center gap-2 text-sm text-gray-600">
        <span>{format(new Date(start), "MMM d, yyyy")}</span>
        <ArrowRight className="size-3" />
        {end ? (
          <span>{format(new Date(end), "MMM d, yyyy")}</span>
        ) : (
          <span>{t("now")}</span>
        )}
      </span>
    </div>
  );
}

export const DeviceLocationTimelineCard = ({
  locationData,
}: LocationCardProps) => {
  const { end } = locationData;

  return (
    <div className="relative flex gap-8 pl-12 pt-0.5">
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        <div className="absolute w-px bg-gray-200 h-full top-4 group-last:hidden" />
        <div
          className={cn(
            "size-6 rounded-full flex items-center justify-center z-10",
            !end ? "bg-green-100" : "bg-primary-500",
          )}
        >
          <CareIcon
            icon={!end ? "l-location-point" : "l-check"}
            className={!end ? "text-green-600" : "text-white"}
          />
        </div>
        {!end && <div className="flex-1 w-px bg-gray-200" />}
      </div>
      <LocationNode locationData={locationData} />
    </div>
  );
};
