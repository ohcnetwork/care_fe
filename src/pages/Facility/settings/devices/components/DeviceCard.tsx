import { ArrowRightIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  getAvailabilityStatusColor,
  getStatusColor,
} from "@/pages/Facility/settings/devices/Utils";
import DeviceTypeIcon from "@/pages/Facility/settings/devices/components/DeviceTypeIcon";
import { DeviceList } from "@/types/device/device";
import { Encounter } from "@/types/emr/encounter";

interface Props {
  devices: DeviceList[];
  encounter?: Encounter;
}
export default function DeviceCard({ devices, encounter }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-cy="devices-list"
    >
      {devices.map((device) => (
        <Card
          key={device.id}
          className="hover:shadow-md transition-shadow h-full flex flex-col"
        >
          <CardHeader className="pb-1 pt-3 px-4">
            <div className="flex items-start gap-2">
              <DeviceTypeIcon
                className="size-4 text-gray-500 mt-1"
                type={device.care_type}
              />
              <div>
                <CardTitle className="text-base font-semibold text-gray-900 line-clamp-1">
                  {device.registered_name}
                </CardTitle>
                <CardDescription className="text-xs text-gray-600 line-clamp-1">
                  {device.user_friendly_name || "--"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 justify-between px-4 pb-4 pt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className={`text-xs px-2 py-0.5 ${getStatusColor(device.status)}`}
              >
                {t(`device_status_${device.status}`)}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs px-2 py-0.5 ${getAvailabilityStatusColor(device.availability_status)}`}
              >
                {t(`device_availability_status_${device.availability_status}`)}
              </Badge>
              {device.care_type && (
                <Badge
                  variant="secondary"
                  className="rounded-md bg-blue-100 text-blue-800 text-xs font-medium capitalize px-2 py-0.5"
                >
                  {device.care_type}
                </Badge>
              )}
            </div>

            <Separator className="my-2" />

            <div className="flex justify-end">
              <Button variant="link" asChild className="p-0 text-sm text-black">
                <Link
                  href={`/devices/${device.id}`}
                  basePath={
                    encounter
                      ? `/facility/${encounter.facility.id}/settings`
                      : ""
                  }
                  className="flex items-center gap-1 hover:underline"
                >
                  {t("view_details")} <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
