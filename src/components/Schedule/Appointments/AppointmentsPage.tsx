import { useQuery } from "@tanstack/react-query";
import { format, formatDate } from "date-fns";
import { Link, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";
import Page from "@/components/Common/Page";
import { ScheduleAPIs } from "@/components/Schedule/api";
import { getFakeTokenNumber } from "@/components/Schedule/helpers";
import { Appointment, SlotAvailability } from "@/components/Schedule/types";

import useAuthUser from "@/hooks/useAuthUser";

import query from "@/Utils/request/query";
import { dateQueryString, formatName, formatPatientAge } from "@/Utils/utils";

interface QueryParams {
  resource?: string;
  slot?: string;
}

export default function AppointmentsPage(props: { facilityId?: string }) {
  const { t } = useTranslation();

  const [qParams, setQParams] = useQueryParams<QueryParams>();
  const date = dateQueryString(new Date());

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

  const slotsQuery = useQuery({
    queryKey: ["slots", facilityId, qParams.resource, date],
    queryFn: query(ScheduleAPIs.slots.getSlotsForDay, {
      pathParams: { facility_id: facilityId },
      body: {
        resource: qParams.resource ?? "",
        day: date,
      },
    }),
    enabled: !!qParams.resource,
  });
  const slots = slotsQuery.data?.results;
  const slot = slots?.find((s) => s.id === qParams.slot);

  return (
    <Page
      title="Out Patient (OP) Appointments"
      collapseSidebar
      options={
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "board" | "list")}
        >
          <TabsList>
            <TabsTrigger value="board">
              <CareIcon icon="l-kanban" className="mr-2" />
              <span>{t("board")}</span>
            </TabsTrigger>
            <TabsTrigger value="list">
              <CareIcon icon="l-list-ul" className="mr-2" />
              <span>{t("list")}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
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

            <SlotFilter
              slots={slots ?? []}
              selectedSlot={qParams.slot}
              onSelect={(slot) => {
                const updated = { ...qParams };
                if (slot === "all") {
                  delete updated.slot;
                } else {
                  updated.slot = slot;
                }
                setQParams(updated);
              }}
            />
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Input className="w-[300px]" placeholder={t("search")} />
          <Button variant="secondary">
            <CareIcon icon="l-filter" className="mr-2" />
            <span>{t("filter")}</span>
          </Button>
          {/* <div className="flex border rounded-lg">
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
          </div> */}
        </div>
      </div>

      <ScrollArea>
        <div className="flex w-max space-x-4">
          {(
            [
              "booked",
              "checked_in",
              "in_consultation",
              "fulfilled",
              "noshow",
            ] as const
          ).map((status) => (
            <AppointmentColumn
              key={status}
              status={status}
              facilityId={facilityId}
              slot={slot?.id}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Page>
  );
}

function AppointmentColumn(props: {
  facilityId: string;
  status: Appointment["status"];
  resource?: string;
  slot?: string;
}) {
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: [
      "appointments",
      props.facilityId,
      props.status,
      props.resource,
      props.slot,
    ],
    queryFn: query(ScheduleAPIs.appointments.list, {
      pathParams: { facility_id: props.facilityId },
      queryParams: {
        status: props.status,
        limit: 100,
        slot: props.slot,
        resource: props.resource,
      },
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

interface SlotFilterProps {
  slots: SlotAvailability[];
  selectedSlot: string | undefined;
  onSelect: (slot: string) => void;
}

function SlotFilter({ slots, selectedSlot, onSelect }: SlotFilterProps) {
  const { t } = useTranslation();

  if (slots.length <= 3) {
    return (
      <Tabs value={selectedSlot ?? "all"} onValueChange={onSelect}>
        <TabsList>
          <TabsTrigger value="all" className="uppercase">
            {t("all")}
          </TabsTrigger>
          {slots.map((slot) => (
            <TabsTrigger key={slot.id} value={slot.id}>
              {format(slot.start_datetime, "h:mm a").replace(":00", "")}
              {" - "}
              {format(slot.end_datetime, "h:mm a").replace(":00", "")}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }

  return (
    <Select value={selectedSlot ?? "all"} onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("show_all_slots")}</SelectItem>
        {slots.map((slot) => (
          <SelectItem key={slot.id} value={slot.id}>
            {format(slot.start_datetime, "h:mm a")}
            {" - "}
            {format(slot.end_datetime, "h:mm a")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
