import { Popover, PopoverPanel } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";

import {
  AssetStatus,
  AvailabilityRecord,
} from "@/components/Assets/AssetTypes";

import dayjs from "@/Utils/dayjs";
import { PaginatedResponse, QueryRoute } from "@/Utils/request/types";
import useQuery from "@/Utils/request/useQuery";
import { classNames } from "@/Utils/utils";

const STATUS_COLORS = {
  Operational: "bg-green-500",
  "Not Monitored": "bg-secondary-400",
  Down: "bg-red-500",
  "Under Maintenance": "bg-blue-500",
};

const STATUS_COLORS_TEXT = {
  Operational: "text-green-500",
  "Not Monitored": "text-secondary-400",
  Down: "text-red-500",
  "Under Maintenance": "text-blue-500",
};

const now = dayjs();
const formatDateBeforeDays = Array.from({ length: 100 }, (_, index) =>
  now.subtract(index, "days").format("DD MMMM YYYY"),
);

const uptimeScore: number[] = Array.from({ length: 100 }, () => 0);

const formatDurationMins = (mins: number) => {
  const hours = Math.floor(mins / 60);
  const minutes = Math.floor(mins % 60);
  return `${hours}h ${minutes}m`;
};

function UptimeInfo({
  records,
  date,
}: {
  records: AvailabilityRecord[];
  date: string;
}) {
  const incidents =
    records?.filter((record) => record.status !== AssetStatus.not_monitored) ||
    [];

  let totalMinutes = 0;

  return (
    <div className="absolute z-50 w-full rounded-lg shadow-lg ring-1 ring-secondary-400">
      <div className="rounded-lg bg-white px-6 py-4">
        <div className="flow-root rounded-md">
          <div className="block text-center text-sm text-secondary-800">
            <span className="font-bold">{date}</span>
            <div className="my-2 border-t border-secondary-200"></div>
            {incidents.length === 0 ? (
              <>
                <span>No status for the day</span>
              </>
            ) : (
              <>
                <span className="my-2 block font-bold">Status Updates</span>
                <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
                  {incidents.reverse().map((incident, index) => {
                    const prevIncident = incidents[index - 1];
                    let endTimestamp;
                    let ongoing = false;

                    if (prevIncident?.linked_id) {
                      endTimestamp = dayjs(prevIncident.timestamp);
                    } else if (dayjs(incident.timestamp).isSame(now, "day")) {
                      endTimestamp = dayjs();
                      ongoing = true;
                    } else {
                      endTimestamp = dayjs(incident.timestamp)
                        .set("hour", 23)
                        .set("minute", 59)
                        .set("second", 59);
                    }
                    const duration = !ongoing
                      ? formatDurationMins(
                          dayjs
                            .duration(
                              dayjs(endTimestamp).diff(
                                dayjs(incident.timestamp),
                              ),
                            )
                            .asMinutes(),
                        )
                      : "Ongoing";
                    if (
                      incident.status === AssetStatus.down ||
                      incident.status === AssetStatus.maintenance
                    )
                      totalMinutes += dayjs(endTimestamp).diff(
                        dayjs(incident.timestamp),
                        "minutes",
                      );

                    return (
                      <>
                        <span
                          className={`break-words capitalize ${
                            STATUS_COLORS_TEXT[
                              incident.status as keyof typeof STATUS_COLORS_TEXT
                            ]
                          }`}
                        >
                          {incident.status}
                        </span>
                        <span className="md:col-span-2">
                          {dayjs(incident.timestamp).format("h:mmA")} -{" "}
                          {dayjs(endTimestamp).format("h:mmA")}
                        </span>
                        <span className="border-b md:border-b-0">
                          {duration}
                        </span>
                      </>
                    );
                  })}
                </div>
                <div className="my-2 border-t border-secondary-200"></div>
                <div className="mt-1 flex justify-between">
                  <span className="font-bold">Total downtime</span>
                  <span>
                    {incidents.length > 0 && formatDurationMins(totalMinutes)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UptimeInfoPopover({
  records,
  day,
  date,
  numDays,
}: {
  records: AvailabilityRecord[];
  day: number;
  date: string;
  numDays: number;
}) {
  return (
    <Popover className="relative mt-10 hidden sm:block">
      <PopoverPanel
        className={classNames(
          "absolute z-50 w-64 px-4 sm:px-0 lg:w-96",
          day > numDays - 10
            ? "-translate-x-6"
            : day < 10
              ? "-translate-x-full"
              : "-translate-x-1/2",
        )}
        static
      >
        <UptimeInfo records={records} date={date} />
      </PopoverPanel>
    </Popover>
  );
}

export default function Uptime(
  props: Readonly<{
    route: QueryRoute<PaginatedResponse<AvailabilityRecord>>;
    params?: Record<string, string | number>;
    header?: React.ReactNode;
    parentClassNames?: string;
    centerInfoPanel?: boolean;
  }>,
) {
  const [summary, setSummary] = useState<{
    [key: number]: AvailabilityRecord[];
  }>([]);
  const { data, loading } = useQuery(props.route, {
    pathParams: props.params,
    onResponse: ({ data }) => setUptimeRecord(data?.results.reverse() ?? []),
  });
  const availabilityData = data?.results ?? [];
  const graphElem = useRef<HTMLDivElement>(null);
  const [numDays, setNumDays] = useState(
    Math.floor((window.innerWidth - 1024) / 20),
  );
  const [hoveredDay, setHoveredDay] = useState(-1);

  const handleResize = () => {
    const containerWidth = graphElem.current?.clientWidth ?? window.innerWidth;
    const newNumDays = Math.floor(containerWidth / 20);
    setNumDays(Math.min(newNumDays, 100));
  };

  const centerInfoPanel = props.centerInfoPanel ?? false;

  const setUptimeRecord = (records: AvailabilityRecord[]): void => {
    const recordsByDayBefore: { [key: number]: AvailabilityRecord[] } = {};

    records.forEach((record) => {
      const timestamp = dayjs(record.timestamp).startOf("day");
      const today = dayjs().startOf("day");
      const diffDays = today.diff(timestamp, "days");
      if (diffDays <= 100) {
        const recordsForDay = recordsByDayBefore[diffDays] || [];
        recordsForDay.push(record);
        recordsByDayBefore[diffDays] = recordsForDay;
      }
    });

    // Carry over status for days with no records
    let statusToCarryOver = AssetStatus.not_monitored;
    for (let i = 100; i >= 0; i--) {
      if (!recordsByDayBefore[i]) {
        recordsByDayBefore[i] = [];
        if (statusToCarryOver) {
          recordsByDayBefore[i].push({
            linked_id: "",
            linked_model: "",
            status: statusToCarryOver,
            timestamp: dayjs()
              .subtract(i, "days")
              .startOf("day")
              .format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ"),
          });
        }
      } else {
        if (
          recordsByDayBefore[i].filter(
            (r) => dayjs(r.timestamp).get("hour") < 8,
          ).length === 0
        ) {
          recordsByDayBefore[i].unshift({
            linked_id: "",
            linked_model: "",
            status: statusToCarryOver,
            timestamp: dayjs()
              .subtract(i, "days")
              .startOf("day")
              .format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ"),
          });
        }
        statusToCarryOver =
          recordsByDayBefore[i][recordsByDayBefore[i].length - 1].status;
      }
    }

    setSummary(recordsByDayBefore);
  };

  function getUptimePercent(displayDays: number) {
    let upStatus = 0;

    const oldestRecord = availabilityData[0];
    const daysAvailable = dayjs().diff(
      dayjs(oldestRecord?.timestamp)
        .set("hour", 0)
        .set("minute", 0)
        .set("second", 0),
      "days",
    );

    const days = Math.max(1, Math.min(daysAvailable, displayDays));

    for (let i = 0; i < days; i++) {
      const index = days - i - 1;
      upStatus += uptimeScore[index];
    }

    return Math.round((upStatus / (days * 3)) * 100);
  }

  useEffect(() => {
    setTimeout(() => {
      handleResize();
    }, 100);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [graphElem, loading]);

  useEffect(() => {
    handleResize();
  }, []);

  const getStatusColor = (day: number) => {
    if (summary[day]) {
      const dayRecords = summary[day];
      const statusColors: (typeof STATUS_COLORS)[keyof typeof STATUS_COLORS][] =
        [];
      let dayUptimeScore = 0;
      const recordsInPeriodCache: { [key: number]: AvailabilityRecord[] } = {};
      for (let i = 0; i < 3; i++) {
        const start = i * 8;
        const end = (i + 1) * 8;
        const recordsInPeriod = dayRecords.filter(
          (record) =>
            dayjs(record.timestamp).hour() >= start &&
            dayjs(record.timestamp).hour() < end,
        );
        recordsInPeriodCache[i] = recordsInPeriod;
        if (recordsInPeriod.length === 0) {
          const previousLatestRecord =
            recordsInPeriodCache[i - 1]?.[
              recordsInPeriodCache[i - 1]?.length - 1
            ];
          if (
            dayjs(previousLatestRecord?.timestamp)
              .hour(end)
              .minute(0)
              .second(0)
              .isBefore(dayjs())
          ) {
            if (previousLatestRecord?.status === AssetStatus["operational"]) {
              dayUptimeScore += 1;
            }
            statusColors.push(
              STATUS_COLORS[
                previousLatestRecord?.status as keyof typeof STATUS_COLORS
              ] ?? STATUS_COLORS["Not Monitored"],
            );
            recordsInPeriodCache[i] = [previousLatestRecord];
          } else {
            statusColors.push(STATUS_COLORS["Not Monitored"]);
          }
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["down"],
          )
        ) {
          statusColors.push(STATUS_COLORS["Down"]);
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["maintenance"],
          )
        ) {
          statusColors.push(STATUS_COLORS["Under Maintenance"]);
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["operational"],
          )
        ) {
          statusColors.push(STATUS_COLORS["Operational"]);
          dayUptimeScore += 1;
        } else {
          statusColors.push(STATUS_COLORS["Not Monitored"]);
        }
      }
      uptimeScore[day] = dayUptimeScore;
      return statusColors;
    } else {
      uptimeScore[day] = 0;
      return [
        STATUS_COLORS["Not Monitored"],
        STATUS_COLORS["Not Monitored"],
        STATUS_COLORS["Not Monitored"],
      ];
    }
  };
  if (loading) {
    return (
      <div className="mt-8 flex w-full flex-col bg-white p-4 shadow-sm sm:rounded-lg">
        <p>Loading status...</p>
      </div>
    );
  } else if (summary) {
    return (
      <div className={props.parentClassNames}>
        <div className="w-full">
          <div className="grid grid-cols-1">
            {props.header}
            <div>
              <div className="mt-2 overflow-x-clip px-5">
                <div className="mb-1 mt-2 flex justify-center text-xs text-secondary-700 opacity-70">
                  {getUptimePercent(numDays)}% uptime
                </div>
                <div
                  className="flex flex-row"
                  ref={graphElem}
                  onMouseLeave={() => setHoveredDay(-1)}
                >
                  {Array.from({ length: numDays }, (_, revIndex) => {
                    const index = numDays - revIndex - 1;
                    const dayStatus = getStatusColor(index);
                    return (
                      <>
                        <span
                          onMouseEnter={() => setHoveredDay(index)}
                          key={index}
                          className="mx-1 h-8 w-3 flex-1"
                        >
                          <div
                            className={`h-[11px] w-3 rounded-t-sm ${
                              hoveredDay === index
                                ? "bg-secondary-700"
                                : dayStatus[0]
                            }`}
                          ></div>
                          <div
                            className={`h-[11px] w-3 ${
                              hoveredDay === index
                                ? "bg-secondary-700"
                                : dayStatus[1]
                            }`}
                          ></div>
                          <div
                            className={`h-[11px] w-3 rounded-b-sm ${
                              hoveredDay === index
                                ? "bg-secondary-700"
                                : dayStatus[2]
                            }`}
                          ></div>
                        </span>
                        {hoveredDay === index && !centerInfoPanel && (
                          <UptimeInfoPopover
                            records={summary[index]}
                            day={index}
                            date={formatDateBeforeDays[index]}
                            numDays={numDays}
                          />
                        )}
                      </>
                    );
                  })}
                </div>
                <div
                  className={`flex text-xs text-secondary-700 opacity-70 ${
                    hoveredDay == -1 && "mt-2"
                  }`}
                >
                  <span className="ml-0 mr-auto">{numDays} days ago</span>
                  <span className="ml-auto mr-0">Today</span>
                </div>
              </div>
            </div>
            {hoveredDay !== -1 && (
              <div className={`relative ${!centerInfoPanel && "sm:hidden"}`}>
                <UptimeInfo
                  records={summary[hoveredDay]}
                  date={formatDateBeforeDays[hoveredDay]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="mt-8 flex w-full flex-col bg-white p-4 shadow-sm sm:rounded-lg">
        <p>No status information available.</p>
      </div>
    );
  }
}
