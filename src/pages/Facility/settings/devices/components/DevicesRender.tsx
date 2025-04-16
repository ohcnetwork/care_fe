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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import DeviceTypeIcon from "@/pages/Facility/settings/devices/components/DeviceTypeIcon";
import { DeviceList } from "@/types/device/device";
import { Encounter } from "@/types/emr/encounter";

interface Props {
  devices: DeviceList[];
  encounter?: Encounter;
}

export function DeviceTable({ devices, encounter }: Props) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("device")}</TableHead>
            <TableHead className="text-center">{t("status")}</TableHead>
            <TableHead className="text-center">{t("care_type")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <DeviceTypeIcon
                    className="size-5 text-gray-500 flex-shrink-0"
                    type={device.care_type}
                  />
                  <div>
                    <div className="font-medium">{device.registered_name}</div>
                    <div className="text-sm text-gray-500">
                      {device.user_friendly_name || "--"}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col gap-2 sm:flex-row justify-center">
                  <Badge
                    variant="secondary"
                    className={getStatusColor(device.status)}
                  >
                    {t(`device_status_${device.status}`)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={getAvailabilityStatusColor(
                      device.availability_status,
                    )}
                  >
                    {t(
                      `device_availability_status_${device.availability_status}`,
                    )}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {device.care_type ? (
                  <Badge
                    variant="secondary"
                    className="rounded-md bg-blue-100 text-blue-800 font-medium capitalize"
                  >
                    {device.care_type}
                  </Badge>
                ) : (
                  "--"
                )}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="link" asChild className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    basePath={
                      encounter
                        ? `/facility/${encounter.facility.id}/settings`
                        : ""
                    }
                    className="text-sm font-semibold text-black hover:underline flex items-center gap-1 justify-center"
                  >
                    {t("view_details")} <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
export function DeviceCard({ devices, encounter }: Props) {
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
