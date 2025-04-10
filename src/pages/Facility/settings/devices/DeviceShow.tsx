import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { ExternalLink } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import DeviceTypeIcon from "@/pages/Facility/settings/devices/components/DeviceTypeIcon";
import { usePluginDevice } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import { ContactPoint } from "@/types/common/contactPoint";
import { type DeviceDetail } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

import DeviceEncounterHistory from "./DeviceEncounterHistory";
import DeviceServiceHistory from "./components/DeviceServiceHistory";
import ManageLocationSheet from "./components/ManageLocationSheet";

interface Props {
  facilityId: string;
  deviceId: string;
}

export default function DeviceShow({ facilityId, deviceId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", facilityId, deviceId],
    queryFn: query(deviceApi.retrieve, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
  });

  const { mutate: deleteDevice, isPending: isDeleting } = useMutation({
    mutationFn: mutate(deviceApi.delete, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      navigate(`/facility/${facilityId}/settings/devices`);
    },
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
    const getContactLink = (system: string, value: string) => {
      switch (system) {
        case "phone":
        case "fax":
          return `tel:${value}`;
        case "email":
          return `mailto:${value}`;
        case "url":
          return value;
        case "sms":
          return `sms:${value}`;
        default:
          return null;
      }
    };

    const link = getContactLink(contact.system, contact.value);

    return (
      <div key={`${contact.system}-${contact.value}`} className="space-y-1">
        <p className="text-sm font-medium text-gray-500">{t(contact.system)}</p>
        {link ? (
          <a
            href={link}
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            target={contact.system === "url" ? "_blank" : undefined}
            rel={contact.system === "url" ? "noopener noreferrer" : undefined}
          >
            {contact.value}
          </a>
        ) : (
          <p className="text-sm text-gray-900">{contact.value}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 max-w-4xl mx-auto">
      <div className="ml-2 flex gap-3 items-center">
        <DeviceTypeIcon
          type={device.care_type}
          className="size-5 mb-1 md:mb-3"
        />
        <PageTitle title={device.registered_name} />
      </div>

      <div className="flex flex-col gap-4 xl:gap-6" data-cy="device-details">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>{t("device_information")}</CardTitle>
            <Link href={`/devices/${deviceId}/edit`}>
              <Button
                variant="outline_primary"
                size="sm"
                data-cy="edit-device-button"
              >
                <CareIcon icon="l-pen" className="size-4" />
                {t("edit")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("registered_name")}
                  </h4>
                  <p className="mt-1">{device.registered_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("user_friendly_name")}
                  </h4>
                  <p className="mt-1">{device.user_friendly_name || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("location")}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    {device.current_location ? (
                      <Link
                        href={`/location/${device.current_location.id}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 truncate"
                      >
                        {device.current_location.name}
                        <ExternalLink className="size-3 flex-shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {t("no_location_associated")}
                      </span>
                    )}
                    <ManageLocationSheet
                      facilityId={facilityId}
                      device={device}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {device.current_location ? t("change") : t("associate")}
                      </Button>
                    </ManageLocationSheet>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("encounter")}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    {device.current_encounter ? (
                      <Link
                        href={`/encounter/${device.current_encounter.id}/updates`}
                        basePath={`/facility/${device.current_encounter.facility.id}/patient/${device.current_encounter.patient.id}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 truncate"
                      >
                        {device.current_encounter.patient.name}
                        <ExternalLink className="size-3 flex-shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {t("no_encounter_associated")}
                      </span>
                    )}
                    <DeviceEncounterHistory
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {t("view_history")}
                        </Button>
                      }
                      facilityId={facilityId}
                      deviceId={deviceId}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("managing_organization")}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    {device.managing_organization ? (
                      <Link
                        href={`/departments/${device.managing_organization.id}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 truncate"
                      >
                        {device.managing_organization.name}
                        <ExternalLink className="size-3 flex-shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {t("no_organization_associated")}
                      </span>
                    )}
                    <LinkDepartmentsSheet
                      entityType="device"
                      entityId={deviceId}
                      facilityId={facilityId}
                      currentOrganizations={
                        device.managing_organization
                          ? [device.managing_organization]
                          : []
                      }
                      onUpdate={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["device", facilityId, deviceId],
                        });
                      }}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {device.managing_organization
                            ? t("change")
                            : t("associate")}
                        </Button>
                      }
                      orgType="managing_organization"
                    />
                  </div>
                </div>
              </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("identifier")}
                  </h4>
                  <p className="text-sm mt-1">{device.identifier || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("lot_number")}
                  </h4>
                  <p className="text-sm mt-1">{device.lot_number || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("manufacturer")}
                  </h4>
                  <p className="text-sm mt-1">{device.manufacturer || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("model_number")}
                  </h4>
                  <p className="text-sm mt-1">{device.model_number || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("serial_number")}
                  </h4>
                  <p className="text-sm mt-1">{device.serial_number || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("part_number")}
                  </h4>
                  <p className="text-sm mt-1">{device.part_number || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("manufacture_date")}
                  </h4>
                  <p className="text-sm mt-1">
                    {device.manufacture_date
                      ? formatDate(device.manufacture_date, "dd/MM/yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    {t("expiration_date")}
                  </h4>
                  <p className="text-sm mt-1">
                    {device.expiration_date
                      ? formatDate(device.expiration_date, "dd/MM/yyyy")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
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

        <DeviceServiceHistory facilityId={facilityId} deviceId={deviceId} />

        {device.care_type && (
          <ErrorBoundary
            fallback={
              <Card className="md:col-span-2 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="size-5" />
                    <span>
                      Couldn't load device type specific information.{" "}
                      <strong className="font-semibold capitalize">
                        {device.care_type.replace(/_-/g, " ")}
                      </strong>{" "}
                      is not supported.
                    </span>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <PluginDeviceShowCard
              device={device as DeviceDetail & { care_type: string }}
              facilityId={facilityId}
            />
          </ErrorBoundary>
        )}

        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("danger_zone")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-md border p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">
                  {t("delete_this_device")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("delete_device_description")}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" data-cy="delete-device-button">
                    {t("delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("delete_device")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("delete_device_confirmation")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-cy="cancel-delete-device-button">
                      {t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteDevice()}
                      className={cn(buttonVariants({ variant: "destructive" }))}
                      disabled={isDeleting}
                      data-cy="confirm-delete-device-button"
                    >
                      {isDeleting ? t("deleting") : t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const PluginDeviceShowCard = ({
  device,
  facilityId,
}: {
  device: DeviceDetail & { care_type: string };
  facilityId: string;
}) => {
  const pluginDevice = usePluginDevice(device.care_type);
  if (!pluginDevice.showPageCard) {
    return null;
  }

  return <pluginDevice.showPageCard device={device} facilityId={facilityId} />;
};
