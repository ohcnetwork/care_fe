import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import DeviceTypeIcon from "@/pages/Facility/settings/devices/components/DeviceTypeIcon";
import { DeviceList } from "@/types/device/device";
import { Encounter } from "@/types/emr/encounter";

interface Props {
  device: DeviceList;
  encounter?: Encounter;
}

export default function DeviceCard({ device, encounter }: Props) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
      case "entered_in_error":
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  const getAvailabilityStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "lost":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
      case "damaged":
      case "destroyed":
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  return (
    <Link
      href={`/devices/${device.id}`}
      basePath={encounter ? `/facility/${encounter.facility.id}/settings` : ""}
      className="block h-[160px]"
    >
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                <DeviceTypeIcon className="size-5 text-gray-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold line-clamp-1">
                  {device.registered_name}
                </CardTitle>
                {device.user_friendly_name && (
                  <CardDescription className="line-clamp-1">
                    {device.user_friendly_name}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className={getStatusColor(device.status)}
            >
              {t(`device_status_${device.status}`)}
            </Badge>
            <Badge
              variant="secondary"
              className={getAvailabilityStatusColor(device.availability_status)}
            >
              {t(`device_availability_status_${device.availability_status}`)}
            </Badge>
            {device.care_type && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 hover:bg-blue-100/80"
              >
                {device.care_type}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
