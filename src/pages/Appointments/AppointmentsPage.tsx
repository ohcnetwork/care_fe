import careConfig from "@careConfig";
import { CaretDownIcon, CheckIcon } from "@radix-ui/react-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  addDays,
  differenceInDays,
  format,
  formatDate,
  isToday,
  isTomorrow,
  isYesterday,
  subDays,
} from "date-fns";
import dayjs from "dayjs";
import { TFunction } from "i18next";
import { Edit3Icon, FilterIcon } from "lucide-react";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
import { useSidebar } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import {
  CardListSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import PatientEncounterOrIdentifierFilter from "@/components/Patient/PatientEncounterOrIdentifierFilter";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";
import useFilters, { FilterState } from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
import {
  dateQueryString,
  formatDateTime,
  formatName,
  formatPatientAge,
} from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import {
  formatSlotTimeRange,
  groupSlotsByAvailability,
} from "@/pages/Appointments/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import {
  APPOINTMENT_STATUS_COLORS,
  Appointment,
  AppointmentRead,
  AppointmentStatus,
  SchedulableResourceType,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { UserReadMinimal } from "@/types/user/user";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { NonEmptyArray } from "@/Utils/types";
import { useFacilityShortcuts } from "@/hooks/useFacilityShortcuts";
import { MultiPractitionerSelector } from "./components/MultiPractitionerSelect";

interface DateRangeDisplayProps {
  dateFrom: string | null;
  dateTo: string | null;
}

type AppointmentStatusGroup = {
  label: string;
  statuses: AppointmentStatus[];
};

const getStatusGroups = (t: TFunction): AppointmentStatusGroup[] => {
  return [
    {
      label: t("booked"),
      statuses: ["booked"],
    },
    {
      label: t("checked_in"),
      statuses: ["checked_in"],
    },
    {
      label: t("in_consultation"),
      statuses: ["in_consultation"],
    },
    {
      label: t("fulfilled"),
      statuses: ["fulfilled"],
    },
    {
      label: t("non_fulfilled"),
      statuses: ["noshow", "cancelled", "entered_in_error", "rescheduled"],
    },
  ];
};

function AppointmentsEmptyState() {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-calendar-slash" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t("no_appointments")}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("adjust_appointments_filters")}
      </p>
    </Card>
  );
}

function DateRangeDisplay({ dateFrom, dateTo }: DateRangeDisplayProps) {
  const { t } = useTranslation();

  if (!dateFrom && !dateTo) {
    return (
      <span className="text-gray-500">{t("showing_all_appointments")}</span>
    );
  }

  const today = new Date();

  // Case 1: Today only or Yesterday only
  if (
    (dateFrom === dateQueryString(today) &&
      dateTo === dateQueryString(today)) ||
    (dateFrom === dateQueryString(subDays(today, 1)) &&
      dateTo === dateQueryString(subDays(today, 1)))
  ) {
    <>
      {dateFrom === dateQueryString(today) ? (
        <>
          <span className="text-black">{t("today")}</span>
          <span className="pl-1 text-gray-500">
            ({formatDate(dateFrom, "dd MMM yyyy")})
          </span>
        </>
      ) : (
        <>
          <span className="text-black">{t("yesterday")}</span>
          <span className="pl-1 text-gray-500">
            ({formatDate(dateFrom, "dd MMM yyyy")})
          </span>
        </>
      )}
    </>;
  }

  // Case 2: Pre-defined ranges
  const ranges = [
    {
      label: t("last_week_short"),
      from: subDays(today, 7),
      to: today,
    },
    {
      label: t("next_week_short"),
      from: today,
      to: addDays(today, 7),
    },
    {
      label: t("next_month"),
      from: today,
      to: addDays(today, 30),
    },
  ];

  const matchingRange = ranges.find(
    (range) =>
      dateFrom &&
      dateTo &&
      dateQueryString(range.from) === dateFrom &&
      dateQueryString(range.to) === dateTo,
  );

  if (matchingRange && dateFrom && dateTo) {
    return (
      <>
        <span className="text-black">{matchingRange.label}</span>
        <span className="pl-1 text-gray-500">
          ({formatDate(dateFrom, "dd MMM yyyy")} -{" "}
          {formatDate(dateTo, "dd MMM yyyy")})
        </span>
      </>
    );
  }

  // Case 3: Same date with relative labels
  if (dateFrom && dateFrom === dateTo) {
    const date = new Date(dateFrom);
    let relativeDay = null;

    if (isToday(date)) {
      relativeDay = t("today");
    } else if (isTomorrow(date)) {
      relativeDay = t("tomorrow");
    } else if (isYesterday(date)) {
      relativeDay = t("yesterday");
    }

    if (relativeDay) {
      return (
        <>
          <span className="text-black">{relativeDay}</span>
          <span className="pl-1 text-gray-500">
            ({formatDate(dateFrom, "dd MMM yyyy")})
          </span>
        </>
      );
    }

    return (
      <>
        <span className="capitalize text-gray-500">{t("on")} </span>
        <span className="pl-1 text-black ">
          {formatDate(dateFrom, "dd MMM yyyy")}
        </span>
      </>
    );
  }

  // Case 4: Single date (before or after)
  if (dateFrom && !dateTo) {
    return (
      <>
        <span className="capitalize text-gray-500">{t("after")} </span>
        <span className="pl-1 text-black">
          {formatDate(dateFrom, "dd MMM yyyy")}
        </span>
      </>
    );
  }

  if (!dateFrom && dateTo) {
    return (
      <>
        <span className=" capitalize text-gray-500">{t("before")} </span>
        <span className="pl-1 text-black">
          {formatDate(dateTo, "dd MMM yyyy")}
        </span>
      </>
    );
  }

  // Case 5: Date range
  return (
    <span className="text-black">
      {formatDate(dateFrom!, "dd MMM yyyy")} -{" "}
      {formatDate(dateTo!, "dd MMM yyyy")}
    </span>
  );
}

interface Props {
  resourceType: SchedulableResourceType;
  resourceId?: string;
}

export default function AppointmentsPage({ resourceType, resourceId }: Props) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const { qParams, updateQuery, resultsPerPage, Pagination } = useFilters({
    limit: 15,
  });

  useFacilityShortcuts("charge-items-table");
  const practitionerFilterEnabled =
    resourceType === SchedulableResourceType.Practitioner && !resourceId;

  const [activeTab, setActiveTab] = useView("appointments", "board");
  const { open: isSidebarOpen } = useSidebar();
  const { facility, facilityId, isFacilityLoading } = useCurrentFacility();
  const selectedTagIds = qParams.tags?.split(",") ?? [];
  const tagConfigsQuery = useTagConfigs({ ids: selectedTagIds, facilityId });
  const selectedTags = tagConfigsQuery
    .map((q) => q.data)
    .filter(Boolean) as TagConfig[];

  const { hasPermission } = usePermissions();
  const { goBack } = useAppHistory();

  const { canViewAppointments } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  const schedulableUsersQuery = useQuery({
    queryKey: ["practitioners", facilityId],
    queryFn: query(scheduleApis.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
    enabled: practitionerFilterEnabled,
  });

  const schedulableUserResources = schedulableUsersQuery.data?.users;
  const practitionerIds = qParams.practitioners?.split(",") ?? [authUser.id];
  const practitioners = schedulableUserResources?.filter((r) =>
    practitionerIds.includes(r.id),
  ) as NonEmptyArray<UserReadMinimal>;

  useEffect(() => {
    // Set default date range if no dates are present
    if (!qParams.date_from && !qParams.date_to) {
      const today = new Date();
      const defaultDays = careConfig.appointments.defaultDateFilter;

      if (defaultDays === 0) {
        // Today only
        qParams.date_from = dateQueryString(today);
        qParams.date_to = dateQueryString(today);
      } else {
        // Past or future days based on configuration
        const fromDate = defaultDays > 0 ? today : addDays(today, defaultDays);
        const toDate = defaultDays > 0 ? addDays(today, defaultDays) : today;
        qParams.date_from = dateQueryString(fromDate);
        qParams.date_to = dateQueryString(toDate);
      }
    }

    // Only update if there are changes
    if (Object.keys(qParams).length > 0) {
      updateQuery({ ...qParams });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParams.date_from, qParams.date_to]);

  // Enabled only if filtered by a practitioner and a single day
  const slotsFilterEnabled =
    !!qParams.date_from &&
    !!(resourceId ?? practitioners) &&
    (resourceId ? 1 : practitioners?.length) === 1 &&
    (qParams.date_from === qParams.date_to || !qParams.date_to);

  const slotsQuery = useQuery({
    queryKey: ["slots", facilityId, qParams.practitioners, qParams.date_from],
    queryFn: query(scheduleApis.slots.getSlotsForDay, {
      pathParams: { facilityId },
      body: {
        // voluntarily coalesce to empty string since we know query would be
        // enabled only if practitioner and date_from are present
        resource_type: resourceType,
        resource_id:
          resourceId ?? practitioners?.map((p) => p.id).join(",") ?? "",
        day: qParams.date_from ?? "",
      },
    }),
    enabled: slotsFilterEnabled,
  });

  const slots = slotsQuery.data?.results?.filter((s) => s.allocated > 0);
  const slot = slots?.find((s) => s.id === qParams.slot);

  useEffect(() => {
    if (!isFacilityLoading && !canViewAppointments && !facility) {
      toast.error(t("no_permission_to_view_page"));
      goBack("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAppointments, facility, isFacilityLoading]);

  if (
    (practitionerFilterEnabled && schedulableUsersQuery.isLoading) ||
    !facility
  ) {
    return <Loading />;
  }

  return (
    <Page
      title={t("appointments")}
      options={
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "board" | "list")}
        >
          <TabsList>
            <TabsTrigger value="board">
              <CareIcon icon="l-kanban" />
              <span>{t("board")}</span>
            </TabsTrigger>
            <TabsTrigger value="list">
              <CareIcon icon="l-list-ul" />
              <span>{t("list")}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <div className="mt-4 py-4 flex flex-col lg:flex-row gap-4 justify-between border-t border-gray-200">
        <div className="flex flex-col xl:flex-row gap-4 items-start md:items-start md:w-xs">
          {practitionerFilterEnabled && (
            <div className="mt-1 w-full">
              <Label className="mb-2 text-black">
                {t("practitioner", { count: 2 })}
              </Label>
              <MultiPractitionerSelector
                facilityId={facilityId}
                selected={practitioners}
                onSelect={(users) => {
                  if (users) {
                    updateQuery({
                      practitioners: users.map((user) => user.id),
                      slot: null,
                    });
                  } else {
                    updateQuery({
                      practitioners: [],
                      slot: null,
                    });
                  }
                }}
              />
            </div>
          )}

          {/* Tags Filter */}
          <div>
            <Label className="mt-1 text-black">{t("filter_by_tags")}</Label>
            <TagSelectorPopover
              asFilter
              selected={selectedTags}
              onChange={(tags) => {
                updateQuery({
                  tags: tags.map((tag) => tag.id).join(","),
                });
              }}
              resource={TagResource.APPOINTMENT}
            />
          </div>
          <div>
            <div className="flex items-center gap-1 -mt-2">
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button variant="ghost">
                    <Label>
                      <DateRangeDisplay
                        dateFrom={qParams.date_from}
                        dateTo={qParams.date_to}
                      />
                    </Label>
                    <Edit3Icon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto" align="start">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between">
                      <Button
                        variant="link"
                        size="xs"
                        onClick={() => {
                          const today = new Date();
                          updateQuery({
                            date_from: dateQueryString(subDays(today, 7)),
                            date_to: dateQueryString(today),
                            slot: null,
                          });
                        }}
                      >
                        {t("last_week_short")}
                      </Button>

                      <Button
                        variant="link"
                        size="xs"
                        onClick={() => {
                          const today = new Date();
                          updateQuery({
                            date_from: dateQueryString(subDays(today, 1)),
                            date_to: dateQueryString(subDays(today, 1)),
                            slot: null,
                          });
                        }}
                      >
                        {t("yesterday")}
                      </Button>

                      <Button
                        variant="link"
                        size="xs"
                        onClick={() => {
                          const today = new Date();
                          updateQuery({
                            date_from: dateQueryString(today),
                            date_to: dateQueryString(today),
                            slot: null,
                          });
                        }}
                      >
                        {t("today")}
                      </Button>
                      {/* Tomorrow */}
                      <Button
                        variant="link"
                        size="xs"
                        onClick={() => {
                          const today = new Date();
                          updateQuery({
                            date_from: dateQueryString(addDays(today, 1)),
                            date_to: dateQueryString(addDays(today, 1)),
                            slot: null,
                          });
                        }}
                      >
                        {t("tomorrow")}
                      </Button>

                      <Button
                        variant="link"
                        size="xs"
                        onClick={() => {
                          const today = new Date();
                          updateQuery({
                            date_from: dateQueryString(today),
                            date_to: dateQueryString(addDays(today, 7)),
                            slot: null,
                          });
                        }}
                      >
                        {t("next_week_short")}
                      </Button>

                      <Button
                        variant="link"
                        size="xs"
                        onClick={() => {
                          const today = new Date();
                          updateQuery({
                            date_from: dateQueryString(today),
                            date_to: dateQueryString(addDays(today, 30)),
                            slot: null,
                          });
                        }}
                      >
                        {t("next_month")}
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium">
                        {t("start_date")}
                      </Label>
                      <CombinedDatePicker
                        value={
                          qParams.date_from
                            ? new Date(qParams.date_from)
                            : undefined
                        }
                        onChange={(date) => {
                          if (qParams.date_to && date) {
                            if (
                              dayjs(date).isAfter(dayjs(qParams.date_to), "day")
                            ) {
                              updateQuery({
                                date_from: date ? dateQueryString(date) : null,
                                date_to: null,
                                slot: null,
                              });
                              return;
                            }
                          }
                          updateQuery({
                            date_from: date ? dateQueryString(date) : null,
                            slot: null,
                          });
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium">
                        {t("end_date")}
                      </Label>
                      <CombinedDatePicker
                        value={
                          qParams.date_to
                            ? new Date(qParams.date_to)
                            : undefined
                        }
                        onChange={(date) => {
                          updateQuery({
                            date_to: date ? dateQueryString(date) : null,
                            slot: null,
                          });
                        }}
                        blockDate={(date) =>
                          qParams.date_from
                            ? dayjs(date).isBefore(
                                dayjs(qParams.date_from),
                                "day",
                              )
                            : false
                        }
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {slotsFilterEnabled && !!slots?.length && (
              <SlotFilter
                slots={slots}
                selectedSlot={slot}
                onSelect={(slot) => {
                  if (slot === "all") {
                    updateQuery({ slot: null });
                  } else {
                    updateQuery({ slot });
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Button
            variant="primary"
            data-shortcut-id="print-button"
            disabled={
              differenceInDays(qParams.date_to, qParams.date_from) >= 31
            }
            onClick={() => {
              const queryString = new URLSearchParams({
                ...qParams,
                tags: selectedTags.map((tag) => tag.id).join(","),
              }).toString();
              navigate(
                `/facility/${facilityId}/appointments/print?${queryString}`,
              );
            }}
          >
            <CareIcon icon="l-print" className="text-lg" />
            {t("print")}
            <ShortcutBadge actionId="print-button" className="bg-white" />
          </Button>
          <PatientEncounterOrIdentifierFilter
            onSelect={(patientId) => updateQuery({ patient: patientId })}
            placeholder={t("search_patients")}
            className="w-full sm:w-auto"
            patientId={qParams.patient}
          />
        </div>
      </div>

      {activeTab === "board" ? (
        <ScrollArea
          className={cn(
            "transition-all duration-200",
            isSidebarOpen
              ? "ease-out md:w-[calc(100vw-21.5rem)]"
              : "ease-in md:w-[calc(100vw-8rem)]",
          )}
        >
          <div className="flex w-max space-x-4">
            {getStatusGroups(t).map((statusGroup) => (
              <AppointmentColumn
                key={statusGroup.label}
                statusGroup={statusGroup}
                slot={slot?.id}
                resourceType={resourceType}
                resourceIds={resourceId ? [resourceId] : practitionerIds}
                date_from={qParams.date_from}
                date_to={qParams.date_to}
                canViewAppointments={canViewAppointments}
                tags={selectedTags.map((tag) => tag.id)}
                patient={qParams.patient}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <AppointmentRow
          updateQuery={updateQuery}
          practitioners={qParams.practitioners || null}
          slot={qParams.slot}
          page={qParams.page}
          date_from={qParams.date_from}
          date_to={qParams.date_to}
          canViewAppointments={canViewAppointments}
          resultsPerPage={resultsPerPage}
          status={qParams.status}
          Pagination={Pagination}
          tags={selectedTags.map((tag) => tag.id)}
          patient={qParams.patient}
          resourceType={resourceType}
          resourceIds={resourceId ? [resourceId] : practitionerIds}
        />
      )}
    </Page>
  );
}

function AppointmentColumn(props: {
  statusGroup: AppointmentStatusGroup;
  slot?: string | null;
  tags?: string[];
  date_from: string | null;
  date_to: string | null;
  canViewAppointments: boolean;
  patient?: string;
  resourceType: SchedulableResourceType;
  resourceIds: NonEmptyArray<string>;
}) {
  const { facilityId } = useCurrentFacility();
  const { t } = useTranslation();
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>(
    [],
  );
  const { ref, inView } = useInView();

  const {
    data: appointmentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "infinite-appointments",
      facilityId,
      selectedStatuses.length === 0
        ? props.statusGroup.statuses
        : selectedStatuses,
      props.resourceIds.join(","),
      props.slot,
      props.date_from,
      props.date_to,
      props.tags,
      props.patient,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(scheduleApis.appointments.list, {
        pathParams: { facilityId },
        queryParams: {
          offset: pageParam,
          status:
            selectedStatuses.length === 0
              ? props.statusGroup.statuses.join(",")
              : selectedStatuses.join(","),
          tags: props.tags?.join(","),
          limit: 10,
          slot: props.slot,
          resource_type: props.resourceType,
          resource_ids: props.resourceIds.join(","),
          date_after: props.date_from,
          date_before: props.date_to,
          ordering: "token_slot__start_datetime",
          patient: props.patient,
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * 10;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!props.resourceIds,
  });

  const appointments =
    appointmentsData?.pages.flatMap((page) => page.results) ?? [];

  const toggleStatus = (status: AppointmentStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div
      className={cn(
        "bg-gray-100 py-4 rounded-lg w-[20rem] overflow-y-hidden",
        !appointmentsData && "animate-pulse",
      )}
    >
      <div className="flex flex-row justify-between px-3 gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold capitalize text-base px-1">
            {props.statusGroup.label}
          </h2>
          <span className="bg-gray-200 px-2 py-1 rounded-md text-xs font-medium">
            {appointmentsData?.pages[0]?.count == null ? (
              "..."
            ) : appointmentsData?.pages[0]?.count === appointments.length ? (
              appointmentsData?.pages[0]?.count
            ) : (
              <Trans
                i18nKey="showing_x_of_y"
                values={{
                  x: appointments.length,
                  y: appointmentsData?.pages[0]?.count,
                }}
                components={{
                  strong: <span className="font-bold" />,
                }}
              />
            )}
          </span>
        </div>
        {props.statusGroup.statuses.length > 1 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <FilterIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="end">
              <Command>
                <CommandList>
                  <CommandEmpty>{t("no_status_found")}</CommandEmpty>
                  <CommandGroup>
                    {props.statusGroup.statuses.map((status) => (
                      <CommandItem
                        key={status}
                        onSelect={() => toggleStatus(status)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={
                              "size-4 rounded flex items-center justify-center border border-gray-300"
                            }
                          >
                            {selectedStatuses.includes(status) && <CheckIcon />}
                          </div>
                          <span>{t(status)}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="px-3 mb-3">
        {selectedStatuses.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedStatuses.map((status) => (
              <Badge
                key={status}
                variant="outline"
                onClick={() => toggleStatus(status)}
                className="bg-white"
              >
                {t(status)}
                <Button variant="ghost" size="icon" className="size-6 -mr-2">
                  <CareIcon icon="l-times" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      {appointments.length === 0 ? (
        <div className="flex justify-center items-center h-[calc(100vh-18rem)]">
          <p className="text-gray-500">{t("no_appointments")}</p>
        </div>
      ) : (
        <ScrollArea>
          <ul className="space-y-3 px-3 pb-4 pt-1 h-[calc(100vh-18rem)]">
            {appointments.map((appointment, index) => (
              <li
                key={appointment.id}
                ref={index === appointments.length - 1 ? ref : undefined}
              >
                <Link
                  href={`/facility/${facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}`}
                  className="text-inherit"
                >
                  <AppointmentCard
                    appointment={appointment}
                    showStatus={props.statusGroup.statuses.length > 1}
                  />
                </Link>
              </li>
            ))}
            {isFetchingNextPage && <CardListSkeleton count={5} />}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  showStatus,
}: {
  appointment: AppointmentRead;
  showStatus: boolean;
}) {
  const { patient } = appointment;
  const { t } = useTranslation();

  return (
    <div className="bg-white p-3 rounded shadow-sm group hover:ring-1 hover:ring-primary-700 hover:ring-offset-1 hover:ring-offset-white hover:shadow-md transition-all duration-100 ease-in-out">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-base group-hover:text-primary-700 transition-all duration-200 ease-in-out">
            {patient.name}
          </h3>
          <p className="text-sm text-gray-700">
            {formatPatientAge(patient, true)}, {t(`GENDER__${patient.gender}`)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDateTime(
              appointment.token_slot.start_datetime,
              "ddd, DD MMM YYYY, HH:mm",
            )}
          </p>
        </div>

        <div className="flex">
          <div className="flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar
                  name={formatName(appointment.user)}
                  imageUrl={appointment.user.profile_picture_url}
                  className="size-14 rounded-r-none"
                />
              </TooltipTrigger>
              <TooltipContent className="flex flex-col gap-0">
                <span className="text-sm font-medium">
                  {formatName(appointment.user)}
                </span>
                <span className="text-xs text-gray-300 truncate">
                  {appointment.user.username}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="bg-gray-100 px-2 py-1 rounded-l-none rounded-r-md ml-px text-center">
            <p className="text-[10px] uppercase">{t("token")}</p>
            <p className="font-bold text-2xl uppercase">
              {appointment.token?.number ?? "--"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {appointment.tags.map((tag) => (
          <Badge variant="primary" className="text-xs" key={tag.id}>
            {tag.display}
          </Badge>
        ))}
        {showStatus && (
          <Badge
            variant={APPOINTMENT_STATUS_COLORS[appointment.status]}
            className="text-xs"
          >
            {t(appointment.status)}
          </Badge>
        )}
      </div>
    </div>
  );
}

function AppointmentRow(props: {
  page: number | null;
  practitioners: string | null;
  Pagination: ({
    totalCount,
    noMargin,
  }: {
    totalCount: number;
    noMargin?: boolean;
  }) => React.ReactNode;
  updateQuery: (filter: FilterState) => void;
  resultsPerPage: number;
  slot: string | null;
  status: AppointmentStatus;
  date_from: string | null;
  date_to: string | null;
  canViewAppointments: boolean;
  tags?: string[];
  patient?: string;
  resourceType: SchedulableResourceType;
  resourceIds: NonEmptyArray<string>;
}) {
  const { facilityId } = useCurrentFacility();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: [
      "appointments",
      facilityId,
      props.status,
      props.page,
      props.practitioners,
      props.slot,
      props.date_from,
      props.date_to,
      props.tags,
      props.patient,
    ],
    queryFn: query(scheduleApis.appointments.list, {
      pathParams: { facilityId },
      queryParams: {
        status: props.status ?? "booked",
        slot: props.slot,
        user: props.practitioners ?? undefined,
        date_after: props.date_from,
        date_before: props.date_to,
        tags: props.tags,
        limit: props.resultsPerPage,
        offset: ((props.page ?? 1) - 1) * props.resultsPerPage,
        ordering: "token_slot__start_datetime",
        patient: props.patient,
        resource_type: props.resourceType,
        resource_ids: props.resourceIds.join(","),
      },
    }),
    enabled:
      !!props.resourceIds &&
      !!props.date_from &&
      !!props.date_to &&
      props.canViewAppointments,
  });

  const appointments = data?.results ?? [];

  return (
    <div className="overflow-x-auto">
      <div className={cn(!data && "animate-pulse")}>
        <div className="hidden md:flex">
          <Tabs
            value={props.status ?? "booked"}
            className="overflow-x-auto"
            onValueChange={(value) => props.updateQuery({ status: value })}
          >
            <TabsList>
              {getStatusGroups(t).map((group) => {
                return (
                  <TabsTrigger
                    key={group.label}
                    value={group.statuses.join(",")}
                  >
                    {group.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Status Filter - Mobile */}
        <div className="md:hidden">
          <Select
            value={props.status || "booked"}
            onValueChange={(value) => props.updateQuery({ status: value })}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              {getStatusGroups(t).map((group) => (
                <SelectItem key={group.label} value={group.statuses.join(",")}>
                  <div className="flex items-center">{group.label}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2">
          {isLoading ? (
            <TableSkeleton count={5} />
          ) : appointments.length === 0 ? (
            <AppointmentsEmptyState />
          ) : (
            <Table className="p-2 border-separate border-gray-200 border-spacing-y-3">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-8 font-semibold text-black text-xs">
                    {t("patient")}
                  </TableHead>
                  <TableHead className="font-semibold text-black text-xs">
                    {t("practitioner", { count: 1 })}
                  </TableHead>
                  <TableHead className="font-semibold text-black text-xs">
                    {t("current_status")}
                  </TableHead>
                  <TableHead className="font-semibold text-black text-xs">
                    {t("token_no")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="shadow-sm rounded-lg cursor-pointer group"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}`,
                      )
                    }
                  >
                    <AppointmentRowItem appointment={appointment} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {props.Pagination({ totalCount: data?.count ?? 0 })}
      </div>
    </div>
  );
}

function AppointmentRowItem({ appointment }: { appointment: Appointment }) {
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
              {formatPatientAge(patient, true)},{" "}
              {t(`GENDER__${patient.gender}`)}
            </span>
          </span>
        </span>
      </TableCell>
      {/* TODO: Replace with relevant information */}
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white">
        {formatName(appointment.user)}
      </TableCell>
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white">
        {t(appointment.status)}
      </TableCell>
      <TableCell className="py-6 group-hover:bg-gray-100 bg-white rounded-r-lg">
        {appointment.token?.number ?? "--"}
      </TableCell>
    </>
  );
}

interface SlotFilterProps {
  slots: TokenSlot[];
  disableInline?: boolean;
  disabled?: boolean;
  selectedSlot: TokenSlot | undefined;
  onSelect: (slot: string) => void;
}

export const SlotFilter = ({
  slots,
  selectedSlot,
  onSelect,
  ...props
}: SlotFilterProps) => {
  const { t } = useTranslation();

  if (slots.length <= 3 && !props.disableInline) {
    return (
      <Tabs value={selectedSlot?.id ?? "all"} onValueChange={onSelect}>
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
          {selectedSlot ? (
            <div className="flex items-center gap-2">
              <span>{formatSlotTimeRange(selectedSlot)}</span>
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
            className="outline-hidden border-none ring-0 shadow-none"
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
                      {selectedSlot?.id === slot.id && (
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
};
