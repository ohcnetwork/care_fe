import { CubeIcon } from "@radix-ui/react-icons";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import { DeviceList } from "@/types/device/device";
import { Encounter } from "@/types/emr/encounter";

interface Props {
  device: DeviceList;
  encounter?: Encounter;
}

export default function DeviceCard({ device, encounter }: Props) {
  const { t } = useTranslation();
  const deviceTypes = usePluginDevices();

  // Find the matching device type for the current device
  const deviceType = device.care_type
    ? deviceTypes.find((type) => type.type === device.care_type)
    : undefined;

  // Use the device type icon or fallback to CubeIcon
  const DeviceIcon = deviceType?.icon || CubeIcon;

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
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div className="mt-1">
              <DeviceIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold line-clamp-1">
                {device.registered_name}
              </CardTitle>
              {device.user_friendly_name && (
                <CardDescription className="text-sm text-gray-600 line-clamp-1">
                  {device.user_friendly_name}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={getStatusColor(device.status)}>
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
      <CardFooter className="border-t flex justify-end min-h-10 p-3">
        <Button asChild variant="link" size="icon" className="mr-8">
          <Link
            href={`/devices/${device.id}`}
            basePath={
              encounter ? `/facility/${encounter.facility.id}/settings` : ""
            }
            className="flex items-center text-secondary font-semibold"
          >
            {t("view_device")}
            <CareIcon icon="l-arrow-right" className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
