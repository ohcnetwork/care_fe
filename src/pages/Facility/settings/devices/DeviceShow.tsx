import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { AlertCircle, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import PageHeadTitle from "@/components/Common/PageHeadTitle";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";
import { ResourceFormPicker } from "@/components/Questionnaire/ResourceFormPicker";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import DeviceTypeIcon from "@/pages/Facility/settings/devices/components/DeviceTypeIcon";
import { usePluginDevice } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import { ContactPoint } from "@/types/common/contactPoint";
import {
  DEVICE_AVAILABILITY_STATUS_COLORS,
  type DeviceDetail,
} from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

import DeviceEncounterHistory from "./DeviceEncounterHistory";
import { DeviceResponses } from "./components/DeviceResponses";
import DeviceServiceHistory from "./components/DeviceServiceHistory";
import ManageLocationSheet from "./components/ManageLocationSheet";

interface Props {
  facilityId: string;
  deviceId: string;
  tab?: "overview" | "responses";
}

const cardClassName =
  "min-w-0 rounded-[10px] border-neutral-200 bg-white text-neutral-950 shadow-xs";
const buttonClassName =
  "h-12 shrink-0 border-neutral-400 text-sm text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10 [&_svg]:size-5";
const linkClassName =
  "inline-flex min-w-0 items-center gap-1.5 rounded-sm text-sm text-neutral-950 underline underline-offset-4 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const tabClassName =
  "-mb-px h-12 rounded-t-lg rounded-b-none border-neutral-200 bg-neutral-100 px-4 text-neutral-700 shadow-[inset_0_-1px_4px_rgba(0,0,0,0.06)] hover:text-neutral-950 focus-visible:border-indigo-500 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 data-[state=active]:border-neutral-200 data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-neutral-950 data-[state=active]:shadow-none md:h-10";

export default function DeviceShow({
  facilityId,
  deviceId,
  tab = "overview",
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const baseUrl = `/facility/${facilityId}/settings/devices/${deviceId}`;
  useShortcutSubContext(undefined);

  const {
    data: device,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
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

  if (isLoading) return <Loading />;

  const deviceError = (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>
        <p>{t(device ? "device_refresh_error" : "device_load_error")}</p>
        <Button
          variant="outline"
          className={cn("mt-3", buttonClassName)}
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {t("try_again")}
        </Button>
      </AlertDescription>
    </Alert>
  );

  if (!device) {
    return (
      <div className="space-y-6">
        <PageHeadTitle title={t("device")} />
        <h1 className="text-3xl leading-9 font-bold text-neutral-950">
          {t("device")}
        </h1>
        {deviceError}
      </div>
    );
  }

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
        <dt className="text-sm font-medium text-neutral-700">
          {t(contact.system)}
        </dt>
        <dd>
          {link ? (
            <a
              href={link}
              className={cn(linkClassName, "break-all")}
              target={contact.system === "url" ? "_blank" : undefined}
              rel={contact.system === "url" ? "noopener noreferrer" : undefined}
            >
              {contact.value}
            </a>
          ) : (
            <p className="break-words text-sm text-neutral-950">
              {contact.value}
            </p>
          )}
        </dd>
      </div>
    );
  };

  const specifications = [
    { label: t("identifier"), value: device.identifier },
    { label: t("manufacturer"), value: device.manufacturer },
    { label: t("model_number"), value: device.model_number },
    { label: t("serial_number"), value: device.serial_number },
    { label: t("lot_number"), value: device.lot_number },
    { label: t("part_number"), value: device.part_number },
    {
      label: t("manufacture_date"),
      value: device.manufacture_date
        ? formatDate(device.manufacture_date, "dd/MM/yyyy")
        : undefined,
    },
    {
      label: t("expiration_date"),
      value: device.expiration_date
        ? formatDate(device.expiration_date, "dd/MM/yyyy")
        : undefined,
    },
  ];

  return (
    <div
      className="min-w-0 space-y-6 text-neutral-950"
      data-cy="device-detail-page"
    >
      <PageHeadTitle title={device.registered_name} />
      {isError && deviceError}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700">
            <DeviceTypeIcon type={device.care_type} className="size-6" />
          </div>
          <div className="min-w-0 space-y-2">
            <h1 className="break-words text-3xl leading-9 font-bold tracking-tight">
              {device.registered_name}
            </h1>
            {device.user_friendly_name && (
              <p className="break-words text-sm text-neutral-600">
                {device.user_friendly_name}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  device.status === "active"
                    ? "green"
                    : DEVICE_AVAILABILITY_STATUS_COLORS[device.status]
                }
                size="xs"
                className={cn(
                  "h-5 rounded-sm px-2 py-0",
                  device.status === "active" && "border-green-500/40",
                  device.status === "inactive" &&
                    "border-neutral-400/40 bg-neutral-100 text-neutral-700",
                  device.status === "entered_in_error" && "border-red-500/45",
                )}
              >
                {t(`device_status_${device.status}`)}
              </Badge>
              <Badge
                variant={
                  DEVICE_AVAILABILITY_STATUS_COLORS[device.availability_status]
                }
                size="xs"
                className={cn(
                  "h-5 rounded-sm px-2 py-0",
                  device.availability_status === "available" &&
                    "border-green-500/40",
                  device.availability_status === "lost" &&
                    "border-yellow-500/40",
                  ["damaged", "destroyed"].includes(
                    device.availability_status,
                  ) && "border-red-500/45",
                )}
              >
                {t(`device_availability_status_${device.availability_status}`)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <ResourceFormPicker
            facilityId={facilityId}
            subjectType="device"
            subjectId={deviceId}
          />
          <Button
            variant="outline"
            className={buttonClassName}
            onClick={() => navigate(`${baseUrl}/edit`)}
          >
            <Pencil className="size-5" />
            {t("edit")}
          </Button>
        </div>
      </header>

      <Tabs value={tab} activationMode="manual" className="gap-0">
        <TabsList
          aria-label={t("device")}
          className="h-auto w-full justify-start gap-1 rounded-none border-b border-neutral-200 bg-transparent p-0"
        >
          {(["overview", "responses"] as const).map((value) => {
            const href =
              value === "overview" ? baseUrl : `${baseUrl}/responses`;
            return (
              <TabsTrigger
                key={value}
                value={value}
                asChild
                className={tabClassName}
                onKeyDown={(event) => {
                  if (event.key === " ") {
                    event.preventDefault();
                    navigate(href);
                  }
                }}
              >
                <Link basePath="/" href={href}>
                  {t(value)}
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent
          value="overview"
          className="space-y-4 pt-4"
          data-cy="device-overview-panel"
        >
          <Card className={cardClassName}>
            <CardHeader className="p-4 pb-3">
              <CardTitle>
                <h2 className="text-lg leading-6 font-semibold">
                  {t("device_information")}
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 p-4 pt-0 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-neutral-700">
                  {t("registered_name")}
                </h4>
                <p className="mt-1 break-words text-sm">
                  {device.registered_name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-700">
                  {t("location")}
                </h3>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  {device.current_location ? (
                    <Link
                      basePath="/"
                      href={`/facility/${facilityId}/settings/locations/${device.current_location.id}`}
                      className={linkClassName}
                    >
                      <span className="break-words">
                        {device.current_location.name}
                      </span>
                      <ExternalLink className="size-3.5 shrink-0" />
                    </Link>
                  ) : (
                    <span className="text-sm text-neutral-600">
                      {t("no_location_associated")}
                    </span>
                  )}
                  <ManageLocationSheet facilityId={facilityId} device={device}>
                    <Button variant="outline" className={buttonClassName}>
                      {device.current_location ? t("change") : t("associate")}
                    </Button>
                  </ManageLocationSheet>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-700">
                  {t("encounter")}
                </h3>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  {device.current_encounter ? (
                    <Link
                      basePath="/"
                      href={`/facility/${device.current_encounter.facility.id}/patient/${device.current_encounter.patient.id}/encounter/${device.current_encounter.id}/updates`}
                      className={linkClassName}
                    >
                      <span className="break-words">
                        {device.current_encounter.patient.name}
                      </span>
                      <ExternalLink className="size-3.5 shrink-0" />
                    </Link>
                  ) : (
                    <span className="text-sm text-neutral-600">
                      {t("no_encounter_associated")}
                    </span>
                  )}
                  <DeviceEncounterHistory
                    facilityId={facilityId}
                    deviceId={deviceId}
                    trigger={
                      <Button variant="outline" className={buttonClassName}>
                        {t("view_history")}
                      </Button>
                    }
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-700">
                  {t("managing_organization")}
                </h3>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  {device.managing_organization ? (
                    <Link
                      basePath="/"
                      href={`/facility/${facilityId}/settings/departments/${device.managing_organization.id}/departments`}
                      className={linkClassName}
                    >
                      <span className="break-words">
                        {device.managing_organization.name}
                      </span>
                      <ExternalLink className="size-3.5 shrink-0" />
                    </Link>
                  ) : (
                    <span className="text-sm text-neutral-600">
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
                      <Button variant="outline" className={buttonClassName}>
                        {device.managing_organization
                          ? t("change")
                          : t("associate")}
                      </Button>
                    }
                    orgType="managing_organization"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="p-4 pb-3">
              <CardTitle>
                <h2 className="text-lg leading-6 font-semibold">
                  {t("technical_details")}
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {specifications.map(({ label, value }) => (
                  <div key={label} className="min-w-0 space-y-1">
                    <dt className="text-sm font-medium text-neutral-700">
                      {label}
                    </dt>
                    <dd className="break-words text-sm">{value || "-"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {device.contact?.length > 0 && (
            <Card className={cardClassName}>
              <CardHeader className="p-4 pb-3">
                <CardTitle>
                  <h2 className="text-lg leading-6 font-semibold">
                    {t("contact_information")}
                  </h2>
                </CardTitle>
                <CardDescription className="text-sm text-neutral-600">
                  {t("device_contact_description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {device.contact.map(renderContactInfo)}
                </dl>
              </CardContent>
            </Card>
          )}

          <DeviceServiceHistory facilityId={facilityId} deviceId={deviceId} />

          {device.care_type && (
            <ErrorBoundary
              fallback={
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>
                    {t("device_type_information_unavailable", {
                      type: device.care_type.replace(/[_-]/g, " "),
                    })}
                  </AlertDescription>
                </Alert>
              }
            >
              <PluginDeviceShowCard
                device={device as DeviceDetail & { care_type: string }}
                facilityId={facilityId}
              />
            </ErrorBoundary>
          )}

          <Card className={cardClassName}>
            <CardHeader className="p-4 pb-3">
              <CardTitle>
                <h2 className="text-lg leading-6 font-semibold">
                  {t("danger_zone")}
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-4 p-4 pt-0 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">
                  {t("delete_this_device")}
                </h3>
                <p className="text-sm text-neutral-700">
                  {t("delete_device_description")}
                </p>
              </div>
              <Button
                variant="outline"
                className={cn(
                  buttonClassName,
                  "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800",
                )}
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="size-5" />
                {t("delete")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value="responses"
          className="pt-4"
          data-cy="device-responses-panel"
        >
          <DeviceResponses
            facilityId={facilityId}
            deviceId={deviceId}
            deviceName={device.registered_name}
          />
        </TabsContent>
      </Tabs>

      <ConfirmActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("delete_device")}
        description={t("delete_device_confirmation")}
        variant="destructive"
        confirmText={isDeleting ? t("deleting") : t("delete")}
        disabled={isDeleting}
        onConfirm={() => deleteDevice()}
      />
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
  const plugin = usePluginDevice(device.care_type);
  if (plugin.isLoading) return <Skeleton className="w-full aspect-video" />;
  const ShowPageCard = plugin.device.showPageCard;
  if (!ShowPageCard) return null;
  return <ShowPageCard device={device} facilityId={facilityId} />;
};
