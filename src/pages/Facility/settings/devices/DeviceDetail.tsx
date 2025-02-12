import { useQuery } from "@tanstack/react-query";
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

import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";

import query from "@/Utils/request/query";
import { ContactPoint } from "@/types/common/contactPoint";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
  deviceId: string;
}

export default function DeviceDetail({ facilityId, deviceId }: Props) {
  const { t } = useTranslation();

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", facilityId, deviceId],
    queryFn: query(deviceApi.retrieve, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!device) {
    return null;
  }

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

  const renderContactInfo = (contact: ContactPoint) => {
    return (
      <div key={`${contact.system}-${contact.value}`} className="space-y-1">
        <p className="text-sm font-medium text-gray-500">
          {t(contact.system)} ({t(contact.use)})
        </p>
        <p className="text-sm text-gray-900">{contact.value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle title={device.registered_name} />
        <Link href={`/devices/${deviceId}/edit`}>
          <Button variant="outline">{t("edit")}</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("device_information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {t("registered_name")}
                </h4>
                <p className="mt-1">{device.registered_name}</p>
              </div>
              {device.user_friendly_name && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("user_friendly_name")}
                  </h4>
                  <p className="mt-1">{device.user_friendly_name}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
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
            </div>

            <Separator />

            <div className="space-y-4">
              {device.manufacturer && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("manufacturer")}
                  </h4>
                  <p className="mt-1">{device.manufacturer}</p>
                </div>
              )}
              {device.model_number && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("model_number")}
                  </h4>
                  <p className="mt-1">{device.model_number}</p>
                </div>
              )}
              {device.serial_number && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("serial_number")}
                  </h4>
                  <p className="mt-1">{device.serial_number}</p>
                </div>
              )}
              {device.part_number && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("part_number")}
                  </h4>
                  <p className="mt-1">{device.part_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dates_and_identifiers")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {device.identifier && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {t("identifier")}
                </h4>
                <p className="mt-1">{device.identifier}</p>
              </div>
            )}
            {device.lot_number && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {t("lot_number")}
                </h4>
                <p className="mt-1">{device.lot_number}</p>
              </div>
            )}
            {device.manufacturer_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {t("manufacturer_date")}
                </h4>
                <p className="mt-1">
                  {new Date(device.manufacturer_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {device.expiration_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {t("expiration_date")}
                </h4>
                <p className="mt-1">
                  {new Date(device.expiration_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {device.contact?.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("contact_information")}</CardTitle>
              <CardDescription>
                {t("device_contact_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {device.contact.map(renderContactInfo)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
