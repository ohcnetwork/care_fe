import { useQuery } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { Link, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Avatar } from "@/components/Common/Avatar";
import Page from "@/components/Common/Page";
import { ScheduleAPIs } from "@/components/Schedule/api";
import {
  filterAvailabilitiesByDayOfWeek,
  getFakeTokenNumber,
} from "@/components/Schedule/helpers";
import { Appointment } from "@/components/Schedule/types";
import { formatAvailabilityTime } from "@/components/Users/UserAvailabilityTab";

import useAuthUser from "@/hooks/useAuthUser";

import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";

interface QueryParams {
  resource?: string;
  slot?: string;
}

export default function AppointmentsPage(props: { facilityId?: string }) {
  const { t } = useTranslation();

  const [qParams, setQParams] = useQueryParams<QueryParams>();

  const authUser = useAuthUser();
  const facilityId = props.facilityId ?? authUser.home_facility!;

  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  const resourcesQuery = useQuery({
    queryKey: ["appointments-resources", facilityId],
    queryFn: query(ScheduleAPIs.appointments.availableDoctors, {
      pathParams: { facility_id: facilityId },
    }),
  });

  const resources = resourcesQuery.data?.users;
  const resource = resources?.find((r) => r.id === qParams.resource);

  const slots = useSlots(facilityId, qParams.resource);
  const slot = slots?.find((s) => s.id === qParams.slot);

  return (
    <Page title="Out Patient (OP) Appointments" collapseSidebar>
      <div className="mt-4 py-4 flex flex-col md:flex-row gap-4 justify-between border-t border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div>
            <Label className="mb-2 text-black">
              {t("select_practitioner")}
            </Label>
            <Select
              disabled={resourcesQuery.isLoading}
              value={qParams.resource}
              onValueChange={(value) => {
                const resource = resourcesQuery.data?.users.find(
                  (r) => r.id === value,
                );
                setQParams({ resource: resource?.id });
              }}
            >
              <SelectTrigger className="min-w-60">
                <SelectValue placeholder={t("show_all")}>
                  {resource && (
                    <div className="flex items-center gap-2">
                      <Avatar
                        imageUrl={resource.profile_picture_url}
                        name={formatName(resource)}
                        className="size-6 rounded-full"
                      />
                      <span>{formatName(resource)}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {resourcesQuery.data?.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar
                        imageUrl={user.profile_picture_url}
                        name={formatName(user)}
                        className="size-6 rounded-full"
                      />
                      <div className="space-x-2">
                        <span>{formatName(user)}</span>
                        <span className="text-xs text-gray-500 font-medium">
                          {user.user_type}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">
              <span className="text-black">{t("today")}</span>
              <span className="pl-1 text-gray-500">
                ({formatDate(new Date(), "dd MMM yyyy")})
              </span>
            </Label>
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1 max-w-min">
              <Button
                variant={slot ? "ghost" : "outline"}
                onClick={() => setQParams({ resource: qParams.resource })}
                className={cn(!slot && "shadow", "hover:bg-white")}
              >
                {t("all")}
              </Button>
              {slots?.map((slot) => (
                <Button
                  key={slot.id}
                  variant={slot?.id === qParams.slot ? "outline" : "ghost"}
                  onClick={() =>
                    setQParams({ resource: qParams.resource, slot: slot.id })
                  }
                  className={cn(
                    slot?.id === qParams.slot && "shadow",
                    "hover:bg-white",
                  )}
                >
                  {formatAvailabilityTime(slot.availability)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Input className="w-[300px]" placeholder={t("search")} />
          <Button variant="outline">{t("filter")}</Button>
          <div className="flex border rounded-lg">
            <Button
              variant="ghost"
              className={cn(
                "rounded-r-none",
                viewMode === "board" && "bg-gray-100",
              )}
              onClick={() => setViewMode("board")}
            >
              {t("board")}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "rounded-l-none",
                viewMode === "list" && "bg-gray-100",
              )}
              onClick={() => setViewMode("list")}
            >
              {t("list")}
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea>
        <div className="flex w-max space-x-4">
          <AppointmentColumn status="booked" facilityId={facilityId} />
          <AppointmentColumn status="checked_in" facilityId={facilityId} />
          <AppointmentColumn status="in_consultation" facilityId={facilityId} />
          <AppointmentColumn status="fulfilled" facilityId={facilityId} />
          <AppointmentColumn status="noshow" facilityId={facilityId} />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Page>
  );
}

function AppointmentColumn(props: {
  status: Appointment["status"];
  facilityId: string;
}) {
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ["appointments", props.facilityId, props.status],
    queryFn: query(ScheduleAPIs.appointments.list, {
      pathParams: { facility_id: props.facilityId },
      queryParams: { status: props.status },
    }),
  });

  const appointments = data?.results ?? [];

  return (
    <div
      className={cn(
        "bg-gray-100 py-4 rounded-lg w-[20rem] overflow-y-hidden",
        !data && "animate-pulse",
      )}
    >
      <div className="flex px-3 items-center gap-3 mb-4">
        <h2 className="font-semibold capitalize text-base px-1">
          {props.status.replace("_", " ")}
        </h2>
        <span className="bg-gray-200 px-2 py-1 rounded-md text-sm">
          {data?.count ?? "..."}
        </span>
      </div>
      {appointments.length === 0 ? (
        <div className="flex justify-center items-center h-[calc(100vh-22rem)]">
          <p className="text-gray-500">{t("no_appointments")}</p>
        </div>
      ) : (
        <ScrollArea>
          <ul className="space-y-3 px-3 pb-4 pt-1 h-[calc(100vh-22rem)]">
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <Link
                  href={`/facility/${props.facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}`}
                  className="text-inherit"
                >
                  <AppointmentCard appointment={appointment} />
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const { patient } = appointment;
  const { t } = useTranslation();

  return (
    <div className="bg-white p-3 rounded shadow group hover:ring-1 hover:ring-primary-700 hover:ring-offset-1 hover:ring-offset-white hover:shadow-md transition-all duration-100 ease-in-out">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-base group-hover:text-primary-700 transition-all duration-200 ease-in-out">
            {patient.name}
          </h3>
          <p className="text-sm text-gray-700">
            {formatPatientAge(patient as any, true)},{" "}
            {t(`GENDER__${patient.gender}`)}
          </p>
        </div>

        <div className="bg-gray-100 px-2 py-1 rounded text-center">
          <p className="text-[10px] uppercase">{t("token")}</p>
          {/* TODO: replace this with token number once that's ready... */}
          <p className="font-bold text-2xl uppercase">
            {getFakeTokenNumber(appointment)}
          </p>
        </div>
      </div>
    </div>
  );
}
const useSlots = (facilityId: string, resource_id?: string) => {
  const templatesQuery = useQuery({
    queryKey: ["slots", facilityId, resource_id],
    queryFn: query(ScheduleAPIs.templates.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource: resource_id ?? "",
        resource_type: "user",
      },
    }),
    enabled: !!resource_id,
  });

  if (!templatesQuery.data) {
    return null;
  }

  const today = new Date();

  return (
    templatesQuery.data.results
      // .filter((t) => isDateInRange(today, t.valid_from, t.valid_to)) // TODO: uncomment this, temp hack.
      .flatMap((t) => filterAvailabilitiesByDayOfWeek(t.availabilities, today))
  );
};
