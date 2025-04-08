import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { formatDateTime } from "@/Utils/utils";
import { DeviceLocationHistory } from "@/types/device/device";

interface LocationCardProps {
  locationData: DeviceLocationHistory;
}

export const DeviceLocationCard = ({ locationData }: LocationCardProps) => {
  const { t } = useTranslation();

  const { start, end, location, created_by } = locationData;

  return (
    <Card className="flex-1 p-4">
      <CardContent className="p-4 sm:p-3 space-y-4">
        <div className="flex flex-wrap gap-6 sm:gap-6">
          <div className="flex gap-3 text-xl font-semibold capitalize">
            <Link
              href={`/location/${location.id}`}
              className="text-gray-950 font-semibold flex items-start gap-0.5"
              id="patient-details"
            >
              {location.name}
              <CareIcon
                icon="l-external-link-alt"
                className="size-3 opacity-50 mt-1"
              />
            </Link>
          </div>
        </div>

        <div className="flex gap-3">
          <h2 className="text-lg font-semibold">{t("locations")}</h2>
          <Badge variant="outline">
            {t(`location_form__${location?.form}`)}
          </Badge>
          <Badge
            variant={location?.status === "active" ? "default" : "secondary"}
          >
            {location?.status}
          </Badge>
        </div>

        <div className="grid sm:flex sm:flex-wrap gap-7">
          <div className="w-full mx-2 sm:w-auto">
            <div className="text-gray-600 text-sm">{t("associated_by")}</div>
            <div className="font-semibold text-base flex items-center gap-2">
              {`${created_by.first_name} ${created_by.last_name}`}
            </div>
          </div>

          <div className="w-full mx-3 sm:w-auto">
            <div className="text-gray-600 text-sm">
              {t("association_start_date")}
            </div>
            <div className="font-semibold text-base">
              {start ? formatDateTime(start) : t("not_started")}
            </div>
          </div>

          {
            <div className="w-full mx-3 sm:w-auto">
              <div className="text-gray-600 text-sm">
                {t("association_end_date")}
              </div>
              <div className="font-semibold text-base">
                {end ? formatDateTime(end) : "-"}
              </div>
            </div>
          }
        </div>
      </CardContent>
    </Card>
  );
};
