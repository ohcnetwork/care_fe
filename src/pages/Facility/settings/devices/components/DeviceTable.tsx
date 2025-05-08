import { ArrowRightIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function DeviceTable({ devices, encounter }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
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
