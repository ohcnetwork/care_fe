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
import {
  DEVICE_AVAILABILITY_STATUS_COLORS,
  DeviceList,
} from "@/types/device/device";
import { EncounterRead } from "@/types/emr/encounter/encounter";

interface Props {
  device: DeviceList;
  encounter?: EncounterRead;
}

export default function DeviceCard({ device, encounter }: Props) {
  const { t } = useTranslation();

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
                <DeviceTypeIcon
                  className="size-5 text-gray-500"
                  type={device.care_type}
                />
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
            <Badge variant={DEVICE_AVAILABILITY_STATUS_COLORS[device.status]}>
              {t(`device_status_${device.status}`)}
            </Badge>
            <Badge
              variant={
                DEVICE_AVAILABILITY_STATUS_COLORS[device.availability_status]
              }
            >
              {t(`device_availability_status_${device.availability_status}`)}
            </Badge>
            {device.care_type && (
              <Badge variant="blue">{device.care_type}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
