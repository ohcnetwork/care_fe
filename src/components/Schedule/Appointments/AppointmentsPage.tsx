import { CaretDownIcon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDate, isPast } from "date-fns";
import { Link, navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";
import Page from "@/components/Common/Page";
import {
  formatSlotTimeRange,
  groupSlotsByAvailability,
} from "@/components/Schedule/Appointments/utils";
import { ScheduleAPIs } from "@/components/Schedule/api";
import { getFakeTokenNumber } from "@/components/Schedule/helpers";
import {
  Appointment,
  AppointmentStatuses,
  SlotAvailability,
} from "@/components/Schedule/types";

import useAuthUser from "@/hooks/useAuthUser";

import FiltersCache from "@/Utils/FiltersCache";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString, formatName, formatPatientAge } from "@/Utils/utils";

interface QueryParams {
  practitioner?: string;
  slot?: string;
  date?: string;
  search?: string;
}

export default function AppointmentsPage(props: { facilityId?: string }) {
  const { t } = useTranslation();

  const [qParams, _setQParams] = useQueryParams<QueryParams>();
  const date = qParams.date ?? dateQueryString(new Date());

  const setQParams = (params: QueryParams) => {
    params = FiltersCache.utils.clean({ ...qParams, ...params });
    _setQParams(params, { replace: true });
  };

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
  const practitioner = resources?.find((r) => r.id === qParams.practitioner);

  const slotsQuery = useQuery({
    queryKey: ["slots", facilityId, qParams.practitioner, date],
    queryFn: query(ScheduleAPIs.slots.getSlotsForDay, {
      pathParams: { facility_id: facilityId },
      body: {
        resource: qParams.practitioner ?? "",
        day: date,
      },
    }),
    enabled: !!qParams.practitioner,
  });
  const slots = slotsQuery.data?.results;
  const slot = slots?.find((s) => s.id === qParams.slot);

  return (
    <Page
      title={t("appointments")}
      hideBack={true}
      breadcrumbs={false}
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
            <Popover>
              <PopoverTrigger asChild disabled={resourcesQuery.isLoading}>
                <Button
                  variant="outline"
                  role="combobox"
                  className="min-w-60 justify-start"
                >
                  {practitioner ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        imageUrl={practitioner.profile_picture_url}
                        name={formatName(practitioner)}
                        className="size-6 rounded-full"
                      />
                      <span>{formatName(practitioner)}</span>
                    </div>
                  ) : (
                    <span>{t("show_all")}</span>
                  )}
                  <CaretDownIcon className="ml-auto" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={t("search")}
                    className="outline-none border-none ring-0 shadow-none"
                  />
                  <CommandList>
                    <CommandEmpty>
                      {resourcesQuery.isFetching
                        ? t("searching")
                        : t("no_results")}
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() =>
                          setQParams({
                            practitioner: undefined,
                            slot: undefined,
                          })
                        }
                        className="cursor-pointer"
                      >
                        <span>{t("show_all")}</span>
                        {qParams.practitioner === undefined && (
                          <CheckIcon className="ml-auto" />
                        )}
                      </CommandItem>
                      {resourcesQuery.data?.users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={formatName(user)}
                          onSelect={() =>
                            setQParams({
                              practitioner: user.id,
                              slot: undefined,
                            })
                          }
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar
                              imageUrl={user.profile_picture_url}
                              name={formatName(user)}
                              className="size-6 rounded-full"
                            />
                            <span>{formatName(user)}</span>
                            <span className="text-xs text-gray-500 font-medium">
                              {user.user_type}
                            </span>
                          </div>
                          {qParams.practitioner === user.id && (
                            <CheckIcon className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
                if (slot === "all") {
                  setQParams({ slot: undefined });
                } else {
                  setQParams({ slot });
                }
              }}
            />
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Input
            className="w-[300px]"
            placeholder={t("search")}
            value={qParams.search}
            onChange={(e) => setQParams({ search: e.target.value })}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">
                <CareIcon icon="l-filter" className="mr-2" />
                <span>{t("filter")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="mr-11">
              <div>
                <Label className="mb-2">{t("date")}</Label>
                <DatePicker
                  date={new Date(date)}
                  onChange={(date) =>
                    setQParams({
                      date: dateQueryString(date),
                      slot: undefined,
                    })
                  }
                />
              </div>
              <div className="flex justify-end bg-gray-100 mt-6 -m-4 py-3 px-4 rounded-md">
                <Button variant="outline" onClick={() => _setQParams({})}>
                  <ReloadIcon className="mr-2" />
                  {t("clear_all_filters")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {viewMode === "board" ? (
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
                practitioner={qParams.practitioner}
                date={date}
                search={qParams.search?.toLowerCase()}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <AppointmentRow
          facilityId={facilityId}
          practitioner={qParams.practitioner}
          slot={qParams.slot}
          date={date}
          search={qParams.search?.toLowerCase()}
        />
      )}
    </Page>
  );
}

function AppointmentColumn(props: {
  facilityId: string;
  status: Appointment["status"];
  practitioner?: string;
  slot?: string;
  date: string;
  search?: string;
}) {
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: [
      "appointments",
      props.facilityId,
      props.status,
      props.practitioner,
      props.slot,
      props.date,
    ],
    queryFn: query(ScheduleAPIs.appointments.list, {
      pathParams: { facility_id: props.facilityId },
      queryParams: {
        status: props.status,
        limit: 100,
        slot: props.slot,
        resource: props.practitioner,
        date: props.date,
      },
    }),
  });

  let appointments = data?.results ?? [];

  if (props.search) {
    appointments = appointments.filter(({ patient }) =>
      patient.name.toLowerCase().includes(props.search!),
    );
  }

  return (
    <div
      className={cn(
        "bg-gray-100 py-4 rounded-lg w-[20rem] overflow-y-hidden",
        !data && "animate-pulse",
      )}
    >
      <div className="flex px-3 items-center gap-3 mb-4">
        <h2 className="font-semibold capitalize text-base px-1">
          {t(props.status)}
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
          <ul className="space-y-3 px-3 pb-4 pt-1 h-[calc(100vh-18rem)]">
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
function AppointmentRow(props: {
  facilityId: string;
  practitioner?: string;
  slot?: string;
  date: string;
  search?: string;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Appointment["status"]>("booked");

  const { data } = useQuery({
    queryKey: [
      "appointments",
      props.facilityId,
      status,
      props.practitioner,
      props.slot,
      props.date,
    ],
    queryFn: query(ScheduleAPIs.appointments.list, {
      pathParams: { facility_id: props.facilityId },
      queryParams: {
        status: status,
        limit: 100,
        slot: props.slot,
        resource: props.practitioner,
        date: props.date,
      },
    }),
  });

  let appointments = data?.results ?? [];

  if (props.search) {
    appointments = appointments.filter(({ patient }) =>
      patient.name.toLowerCase().includes(props.search!),
    );
  }
  return (
    <>
      <div className={cn(!data && "animate-pulse")}>
        <Tabs
          value={status}
          onValueChange={(value) => setStatus(value as Appointment["status"])}
        >
          <TabsList>
            <TabsTrigger value="booked">{t("booked")}</TabsTrigger>
            <TabsTrigger value="checked_in">{t("checked_in")}</TabsTrigger>
            <TabsTrigger value="in_consultation">
              {t("in_consultation")}
            </TabsTrigger>
            <TabsTrigger value="fulfilled">{t("fulfilled")}</TabsTrigger>
            <TabsTrigger value="noshow">{t("noshow")}</TabsTrigger>
          </TabsList>
        </Tabs>
        {appointments.length === 0 ? (
          <div className="flex mt-2 bg-white justify-center items-center h-[calc(100vh-22rem)]">
            <p className="text-gray-500">{t("no_appointments")}</p>
          </div>
        ) : (
          <Table className="p-2 border-separate border-spacing-y-3 min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-8 font-semibold text-black text-xs">
                  {t("patient")}
                </TableHead>
                <TableHead className="font-semibold text-black text-xs">
                  {t("room_apt")}
                </TableHead>
                <TableHead className="font-semibold text-black text-xs">
                  {t("consulting_doctor")}
                </TableHead>
                <TableHead className="font-semibold text-black text-xs">
                  {t("labels")}
                </TableHead>
                <TableHead className="font-semibold text-black text-xs">
                  {t("triage_category")}
                </TableHead>
                <TableHead className="font-semibold text-black text-xs">
                  {t("current_status")}
                </TableHead>
                <TableHead className="font-semibold text-black text-xs">
                  {t("token_no")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {appointments.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  className="shadow rounded-lg cursor-pointer group"
                  onClick={() =>
                    navigate(
                      `/facility/${props.facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}`,
                    )
                  }
                >
                  <AppointmentRowItem
                    appointment={appointment}
                    facilityId={props.facilityId}
                  />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

function AppointmentRowItem({
  appointment,
  facilityId,
}: {
  appointment: Appointment;
  facilityId: string;
}) {
  const { patient } = appointment;
  const { t } = useTranslation();

  return (
    <>
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white rounded-l-lg">
        <span className="flex flex-row items-center gap-2">
          <CareIcon
            icon="l-draggabledots"
            className="size-4 invisible group-hover:visible"
          />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{patient.name}</span>
            <span className="text-xs text-gray-500">
              {formatPatientAge(patient as any, true)},{" "}
              {t(`GENDER__${patient.gender}`)}
            </span>
          </span>
        </span>
      </TableCell>
      {/* TODO: Replace with relevant information */}
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white">
        <p>{"Need Room Information"}</p>
      </TableCell>
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white">
        {formatName(appointment.resource)}
      </TableCell>
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white">
        <p>{"Need Labels"}</p>
      </TableCell>
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white">
        <p>{"Need Triage Category"}</p>
      </TableCell>
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white">
        <AppointmentStatusDropdown
          appointment={appointment}
          facilityId={facilityId}
        />
      </TableCell>
      {/* TODO: replace this with token number once that's ready... */}
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white rounded-r-lg">
        {getFakeTokenNumber(appointment)}
      </TableCell>
    </>
  );
}

const AppointmentStatusDropdown = ({
  appointment,
  facilityId,
}: {
  appointment: Appointment;
  facilityId: string;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentStatus = appointment.status;
  const hasStarted = isPast(appointment.token_slot.start_datetime);

  const { mutate: updateAppointment } = useMutation({
    mutationFn: mutate(ScheduleAPIs.appointments.update, {
      pathParams: {
        facility_id: facilityId,
        id: appointment.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointment.id],
      });
    },
  });

  // Get available status options based on current status
  const getAvailableStatuses = () => {
    if (
      ["fulfilled", "cancelled", "entered_in_error"].includes(currentStatus)
    ) {
      return [currentStatus];
    }

    if (currentStatus === "booked") {
      return ["booked", "checked_in", "in_consultation", "noshow", "cancelled"];
    }

    if (currentStatus === "checked_in") {
      return ["checked_in", "in_consultation", "noshow", "cancelled"];
    }

    if (currentStatus === "in_consultation") {
      return ["in_consultation", "fulfilled", "cancelled"];
    }

    return AppointmentStatuses;
  };

  return (
    <div className="w-32">
      <Select
        value={currentStatus}
        onValueChange={(value) =>
          updateAppointment({ status: value as Appointment["status"] })
        }
      >
        <SelectTrigger>
          <CareIcon icon="l-schedule" className="size-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getAvailableStatuses().map((status) => (
            <SelectItem
              key={status}
              value={status}
              disabled={
                !hasStarted &&
                ["checked_in", "in_consultation", "fulfilled"].includes(status)
              }
            >
              {t(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface SlotFilterProps {
  slots: SlotAvailability[];
  disableInline?: boolean;
  disabled?: boolean;
  selectedSlot: string | undefined;
  onSelect: (slot: string) => void;
}

export const SlotFilter = ({
  selectedSlot,
  onSelect,
  ...props
}: SlotFilterProps) => {
  const { t } = useTranslation();
  const slots = props.slots.filter((slot) => slot.allocated > 0);

  const resolvedSlot =
    selectedSlot && slots.find((slot) => slot.id === selectedSlot);

  if (slots.length <= 3 && !props.disableInline) {
    return (
      <Tabs value={selectedSlot ?? "all"} onValueChange={onSelect}>
        <TabsList>
          <TabsTrigger
            value="all"
            className="uppercase"
            disabled={props.disabled}
          >
            {t("all")}
          </TabsTrigger>
          {slots.map((slot) => (
            <TabsTrigger
              key={slot.id}
              value={slot.id}
              disabled={props.disabled}
            >
              {format(slot.start_datetime, "h:mm a").replace(":00", "")}
              {" - "}
              {format(slot.end_datetime, "h:mm a").replace(":00", "")}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }

  const slotsByAvailability = groupSlotsByAvailability(slots);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="min-w-60 justify-start"
          disabled={props.disabled}
        >
          {resolvedSlot ? (
            <div className="flex items-center gap-2">
              <span>{formatSlotTimeRange(resolvedSlot)}</span>
            </div>
          ) : (
            <span>{t("show_all_slots")}</span>
          )}
          <CaretDownIcon className="ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t("search")}
            className="outline-none border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>{t("no_slots_found")}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => onSelect("all")}
                className="cursor-pointer"
              >
                <span>{t("show_all")}</span>
                {selectedSlot === undefined && (
                  <CheckIcon className="ml-auto" />
                )}
              </CommandItem>
            </CommandGroup>
            {slotsByAvailability.map(({ availability, slots }) => (
              <>
                <CommandSeparator />
                <CommandGroup
                  key={availability.name}
                  heading={availability.name}
                >
                  {slots.map((slot) => (
                    <CommandItem
                      key={slot.id}
                      value={formatSlotTimeRange(slot)}
                      onSelect={() => onSelect(slot.id)}
                      className="cursor-pointer"
                    >
                      <span>{formatSlotTimeRange(slot)}</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {slot.allocated} / {availability.tokens_per_slot}
                      </span>
                      {selectedSlot === slot.id && (
                        <CheckIcon className="ml-auto" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

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
};
