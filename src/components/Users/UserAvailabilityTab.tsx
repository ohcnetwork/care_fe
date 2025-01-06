import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import Loading from "@/components/Common/Loading";
import ScheduleExceptionForm from "@/components/Schedule/ScheduleExceptionForm";
import ScheduleExceptionsList from "@/components/Schedule/ScheduleExceptionsList";
import ScheduleTemplateForm from "@/components/Schedule/ScheduleTemplateForm";
import ScheduleTemplatesList from "@/components/Schedule/ScheduleTemplatesList";
import { ScheduleAPIs } from "@/components/Schedule/api";
import {
  filterAvailabilitiesByDayOfWeek,
  getSlotsPerSession,
  isDateInRange,
} from "@/components/Schedule/helpers";
import { ScheduleAvailability } from "@/components/Schedule/types";

import useSlug from "@/hooks/useSlug";

import query from "@/Utils/request/query";
import { formatTimeShort } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

type Props = {
  userData: UserBase;
};

export default function UserAvailabilityTab({ userData: user }: Props) {
  const [view, setView] = useState<"schedule" | "exceptions">("schedule");
  const [month, setMonth] = useState(new Date());

  const facilityId = useSlug("facility");

  // TODO: remove this once we have a way to get the facilityId
  useEffect(() => {
    if (!facilityId) {
      toast.error("User needs to be linked to a home facility");
    }
  }, [facilityId]);

  const templatesQuery = useQuery({
    queryKey: ["user-availability-templates", user.username],
    queryFn: query(ScheduleAPIs.templates.list, {
      pathParams: { facility_id: facilityId! },
      queryParams: { user: user.id },
    }),
    enabled: !!facilityId,
  });

  const exceptionsQuery = useQuery({
    queryKey: ["user-availability-exceptions", user.username],
    queryFn: query(ScheduleAPIs.exceptions.list, {
      pathParams: { facility_id: facilityId! },
      queryParams: { user: user.id },
    }),
  });

  if (!templatesQuery.data || !exceptionsQuery.data) {
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 py-4 md:grid-cols-2">
      <Calendar
        className="md:order-last"
        month={month}
        onMonthChange={setMonth}
        renderDay={(date: Date) => {
          const isToday = date.toDateString() === new Date().toDateString();

          // TODO: handle for "Closed" schedule type once we have it...
          const templates = templatesQuery.data?.results.filter(
            (template) =>
              isDateInRange(date, template.valid_from, template.valid_to) &&
              filterAvailabilitiesByDayOfWeek(template.availabilities, date)
                .length > 0,
          );

          const unavailableExceptions =
            exceptionsQuery.data?.results.filter((exception) =>
              isDateInRange(date, exception.valid_from, exception.valid_to),
            ) ?? [];

          const isFullDayUnavailable = unavailableExceptions.some(
            (exception) =>
              exception.start_time.startsWith("00:00") &&
              exception.end_time.startsWith("23:59"),
          );

          return (
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "grid h-full cursor-pointer grid-rows-[1fr_auto_1fr] rounded-lg transition-all bg-gray-100 hover:bg-white data-[state=open]:bg-white",
                    templatesQuery.isLoading &&
                      "opacity-50 pointer-events-none",
                    "transition-all duration-200 ease-in-out",
                    "relative overflow-hidden",
                  )}
                >
                  {unavailableExceptions.length > 0 && (
                    <div
                      className={cn(
                        "absolute top-0 left-0 right-0 z-10",
                        isFullDayUnavailable ? "h-full" : "h-1/4",
                      )}
                      style={diagonalStripes}
                    />
                  )}
                  <div />
                  <div className="flex flex-col items-center gap-2 relative z-20">
                    <span
                      className={cn(
                        "text-base",
                        isToday ? "text-gray-900" : "text-gray-500",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="flex justify-center gap-0.5">
                      {templates
                        ?.slice(0, 5)
                        .map((template) => (
                          <ColoredIndicator
                            key={template.id}
                            id={template.id}
                            className="size-1.5 rounded-full"
                          />
                        ))}
                    </div>
                  </div>
                  <div />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-[24rem] p-6"
                align="center"
                side="bottom"
                sideOffset={5}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {date.toLocaleDateString("default", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <Button variant="outline" size="sm">
                    Add Exception
                  </Button>
                </div>

                <ScrollArea className="h-[22rem]">
                  {templates.map((template) => (
                    <div key={template.id} className="border-t pt-3 mt-3">
                      <div className="flex items-center">
                        <ColoredIndicator
                          className="mr-2 size-3 rounded"
                          id={template.id}
                        />
                        <h3 className="text-lg font-semibold">
                          {template.name}
                        </h3>
                      </div>

                      <div className="pl-5 py-2 space-y-4">
                        {template.availabilities.map(
                          ({
                            id,
                            name,
                            slot_type,
                            availability,
                            slot_size_in_minutes,
                          }) => (
                            <div key={id}>
                              <h4 className="font-medium text-base">{name}</h4>
                              <p className="text-sm text-gray-600">
                                <span>{slot_type}</span>
                                <span className="px-2 text-gray-300">|</span>
                                <span className="text-sm">
                                  {/* TODO: handle multiple days of week */}
                                  {formatAvailabilityTime(availability)}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                {Math.floor(
                                  getSlotsPerSession(
                                    availability[0].start_time,
                                    availability[0].end_time,
                                    slot_size_in_minutes,
                                  ) ?? 0,
                                )}{" "}
                                slots of {slot_size_in_minutes} mins.
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          );
        }}
      />

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1 max-w-min">
            <Button
              variant={view === "schedule" ? "outline" : "ghost"}
              onClick={() => setView("schedule")}
              className={cn(view === "schedule" && "shadow", "hover:bg-white")}
            >
              Schedule
            </Button>
            <Button
              variant={view === "exceptions" ? "outline" : "ghost"}
              onClick={() => setView("exceptions")}
              className={cn(
                view === "exceptions" && "shadow",
                "hover:bg-white",
              )}
            >
              Exceptions
            </Button>
          </div>
          {view === "schedule" && (
            <ScheduleTemplateForm
              onRefresh={templatesQuery.refetch}
              user={user}
            />
          )}
          {view === "exceptions" && (
            <ScheduleExceptionForm
              onRefresh={exceptionsQuery.refetch}
              user={user}
            />
          )}
        </div>

        <div>
          <ScrollArea className="h-[calc(100vh-24rem)] -mr-3 pr-3 pb-4">
            {view === "schedule" && (
              <ScheduleTemplatesList
                items={
                  templatesQuery.isLoading
                    ? undefined
                    : templatesQuery.data.results
                }
              />
            )}

            {view === "exceptions" && (
              <ScheduleExceptionsList
                items={
                  exceptionsQuery.isLoading
                    ? undefined
                    : exceptionsQuery.data?.results
                }
              />
            )}

            <div className="h-10" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

const diagonalStripes = {
  backgroundImage: `repeating-linear-gradient(
      -45deg,
      rgb(243 244 246), /* gray-100 */
      rgb(243 244 246) 4px,
      rgb(229 231 235) 4px, /* gray-200 */
      rgb(229 231 235) 8px
    )`,
};

// TODO: remove this in favour of supporting flexible day of week availability
export const formatAvailabilityTime = (
  availability: ScheduleAvailability["availability"],
) => {
  const startTime = availability[0].start_time;
  const endTime = availability[0].end_time;
  return `${formatTimeShort(startTime)} - ${formatTimeShort(endTime)}`;
};
