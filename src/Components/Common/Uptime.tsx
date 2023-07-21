import { Popover } from "@headlessui/react";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { listAssetAvailability } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";
import { AssetStatus, AssetUptimeRecord } from "../Assets/AssetTypes";
import { reverse } from "lodash";

const STATUS_COLORS = {
  Operational: "bg-green-500",
  "Not Monitored": "bg-gray-400",
  Down: "bg-red-500",
  "Under Maintenance": "bg-blue-500",
};

const STATUS_COLORS_TEXT = {
  Operational: "text-green-500",
  "Not Monitored": "text-gray-400",
  Down: "text-red-500",
  "Under Maintenance": "text-blue-500",
};

const now = moment();
const formatDateBeforeDays = Array.from({ length: 100 }, (_, index) =>
  now.clone().subtract(index, "days").format("Do MMMM YYYY")
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
  records: AssetUptimeRecord[];
  date: string;
}) {
  const incidents =
    records?.filter((record) => record.status !== AssetStatus.not_monitored) ||
    [];

  let totalMinutes = 0;

  return (
    <div className="z-50 absolute rounded-lg shadow-lg ring-1 ring-gray-400 w-full">
      <div className="rounded-lg bg-white px-6 py-4">
        <div className="flow-root rounded-md">
          <div className="block text-sm text-gray-800 text-center">
            <span className="font-bold ">{date}</span>
            <div className="border-t border-gray-200 my-2"></div>
            {incidents.length === 0 ? (
              <>
                <span>No status for the day</span>
              </>
            ) : (
              <>
                <span className="font-bold my-2 block">Status Updates</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
                  {reverse(incidents)?.map((incident, index) => {
                    const prevIncident = incidents[index - 1];
                    let endTimestamp;
                    let ongoing = false;

                    if (prevIncident?.id) {
                      endTimestamp = moment(prevIncident.timestamp);
                    } else if (moment(incident.timestamp).isSame(now, "day")) {
                      endTimestamp = moment();
                      ongoing = true;
                    } else {
                      endTimestamp = moment(incident.timestamp)
                        .set("hour", 23)
                        .set("minute", 59)
                        .set("second", 59);
                    }
                    const duration = !ongoing
                      ? formatDurationMins(
                          moment
                            .duration(
                              moment(endTimestamp).diff(
                                moment(incident.timestamp)
                              )
                            )
                            .asMinutes()
                        )
                      : "Ongoing";
                    if (
                      incident.status === AssetStatus.down ||
                      incident.status === AssetStatus.maintenance
                    )
                      totalMinutes += moment(endTimestamp).diff(
                        moment(incident.timestamp),
                        "minutes"
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
                          {moment(incident.timestamp).format("h:mmA")} -{" "}
                          {moment(endTimestamp).format("h:mmA")}
                        </span>
                        <span className="border-b md:border-b-0">
                          {duration}
                        </span>
                      </>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between mt-1">
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
  records: AssetUptimeRecord[];
  day: number;
  date: string;
  numDays: number;
}) {
  return (
    <Popover className="mt-10 relative hidden sm:block">
      <Popover.Panel
        className={`absolute z-50 w-64 lg:w-96 transform px-4 sm:px-0 ${
          day > numDays - 10
            ? "-translate-x-6"
            : day < 10
            ? "-translate-x-full"
            : "-translate-x-1/2"
        }`}
        static
      >
        <UptimeInfo records={records} date={date} />
      </Popover.Panel>
    </Popover>
  );
}

export default function Uptime(props: { assetId: string }) {
  const [summary, setSummary] = useState<{
    [key: number]: AssetUptimeRecord[];
  }>([]);
  const [availabilityData, setAvailabilityData] = useState<AssetUptimeRecord[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const graphElem = useRef<HTMLDivElement>(null);
  const [numDays, setNumDays] = useState(
    Math.floor((window.innerWidth - 1024) / 20)
  );
  const [hoveredDay, setHoveredDay] = useState(-1);
  const dispatch = useDispatch<any>();

  const handleResize = () => {
    const containerWidth = graphElem.current?.clientWidth ?? window.innerWidth;
    const newNumDays = Math.floor(containerWidth / 20);
    setNumDays(Math.min(newNumDays, 100));
  };

  const setUptimeRecord = (records: AssetUptimeRecord[]): void => {
    const recordsByDayBefore: { [key: number]: AssetUptimeRecord[] } = {};

    records.forEach((record) => {
      const timestamp = moment(record.timestamp).startOf("day");
      const today = moment().startOf("day");
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
            id: "",
            asset: { id: "", name: "" },
            created_date: "",
            modified_date: "",
            status: statusToCarryOver,
            timestamp: moment()
              .subtract(i, "days")
              .startOf("day")
              .toISOString(),
          });
        }
      } else {
        statusToCarryOver =
          recordsByDayBefore[i][recordsByDayBefore[i].length - 1].status;
      }
    }

    setSummary(recordsByDayBefore);
  };

  function getUptimePercent(displayDays: number) {
    let upStatus = 0;

    const oldestRecord = availabilityData[0];
    const daysAvailable = moment().diff(
      moment(oldestRecord?.timestamp)
        .set("hour", 0)
        .set("minute", 0)
        .set("second", 0),
      "days"
    );

    const days = Math.max(1, Math.min(daysAvailable, displayDays));

    for (let i = 0; i < days; i++) {
      const index = days - i - 1;
      upStatus += uptimeScore[index];
    }

    return Math.round((upStatus / (days * 3)) * 100);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoading(false);

    const availabilityData = await dispatch(
      listAssetAvailability({
        external_id: props.assetId,
      })
    );
    if (availabilityData?.data) {
      setAvailabilityData(availabilityData.data.results);
      setUptimeRecord(reverse(availabilityData.data.results));
    } else {
      Notification.Error({
        msg: "Error fetching availability history",
      });
    }
  }, [dispatch, props.assetId]);

  useEffect(() => {
    setTimeout(() => {
      handleResize();
    }, 100);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [graphElem, loading]);

  useEffect(() => {
    handleResize();
    fetchData();
  }, [props.assetId, fetchData]);

  const getStatusColor = (day: number) => {
    if (summary[day]) {
      const dayRecords = summary[day];
      const statusColors: (typeof STATUS_COLORS)[keyof typeof STATUS_COLORS][] =
        [];
      let dayUptimeScore = 0;
      const recordsInPeriodCache: { [key: number]: AssetUptimeRecord[] } = {};
      for (let i = 0; i < 3; i++) {
        const start = i * 8;
        const end = (i + 1) * 8;
        const recordsInPeriod = dayRecords.filter(
          (record) =>
            moment(record.timestamp).hour() >= start &&
            moment(record.timestamp).hour() < end
        );
        recordsInPeriodCache[i] = recordsInPeriod;
        if (recordsInPeriod.length === 0) {
          const previousLatestRecord =
            recordsInPeriodCache[i - 1]?.[dayRecords.length - 1];
          if (
            moment(previousLatestRecord?.timestamp)
              .hour(end)
              .minute(0)
              .second(0)
              .isBefore(moment())
          ) {
            if (previousLatestRecord?.status === AssetStatus["operational"]) {
              dayUptimeScore += 1;
            }
            statusColors.push(
              STATUS_COLORS[
                previousLatestRecord?.status as keyof typeof STATUS_COLORS
              ] ?? STATUS_COLORS["Not Monitored"]
            );
          } else {
            statusColors.push(STATUS_COLORS["Not Monitored"]);
          }
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["down"]
          )
        ) {
          statusColors.push(STATUS_COLORS["Down"]);
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["maintenance"]
          )
        ) {
          statusColors.push(STATUS_COLORS["Under Maintenance"]);
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["operational"]
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
      <div className="mt-8 flex flex-col bg-white w-full sm:rounded-lg shadow-sm p-4">
        <p>Loading status...</p>
      </div>
    );
  } else if (summary) {
    return (
      <div className="mt-8 flex flex-col bg-white w-full sm:rounded-lg shadow-sm p-4">
        <div className="mx-2 w-full">
          <div className="grid grid-cols-1">
            <div className="text-xl font-semibold">Availability History</div>
            <div>
              <div className="mt-2 px-5 overflow-x-clip">
                <div className="flex text-gray-700 text-xs mt-2 opacity-70 justify-center mb-1">
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
                          className="h-8 w-3 flex-1 mx-1"
                        >
                          <div
                            className={`h-[11px] w-3 rounded-t-sm ${
                              hoveredDay === index
                                ? "bg-gray-700"
                                : dayStatus[0]
                            }`}
                          ></div>
                          <div
                            className={`h-[11px] w-3 ${
                              hoveredDay === index
                                ? "bg-gray-700"
                                : dayStatus[1]
                            }`}
                          ></div>
                          <div
                            className={`h-[11px] w-3 rounded-b-sm ${
                              hoveredDay === index
                                ? "bg-gray-700"
                                : dayStatus[2]
                            }`}
                          ></div>
                        </span>
                        {hoveredDay === index && (
                          <>
                            <UptimeInfoPopover
                              records={summary[index]}
                              day={index}
                              date={formatDateBeforeDays[index]}
                              numDays={numDays}
                            />
                          </>
                        )}
                      </>
                    );
                  })}
                </div>
                <div
                  className={`flex text-gray-700 text-xs opacity-70 ${
                    hoveredDay == -1 && "mt-2"
                  }`}
                >
                  <span className="ml-0 mr-auto">{numDays} days ago</span>
                  <span className="mr-0 ml-auto">Today</span>
                </div>
              </div>
            </div>
            {hoveredDay !== -1 && (
              <div className="sm:hidden relative">
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
      <div className="mt-8 flex flex-col bg-white w-full sm:rounded-lg shadow-sm p-4">
        <p>No status information available.</p>
      </div>
    );
  }
}
