import { Popover } from "@headlessui/react";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { listAssetAvailability } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";
import { AssetStatus, AssetUptimeRecord } from "../Assets/AssetTypes";

const STATUS_COLORS = {
  operational: "bg-green-500",
  not_monitored: "bg-gray-400",
  down: "bg-red-500",
  maintenance: "bg-blue-500",
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

function StatusPopover({
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
  const incidents =
    records?.filter((record) => record.status !== AssetStatus.not_monitored) ||
    [];

  let totalMinutes = 0;

  return (
    <Popover className="mt-10 relative">
      <Popover.Panel
        className={`absolute z-50 w-80 transform px-4 sm:px-0 ${
          day > numDays - 7
            ? "-translate-x-6"
            : day < 7
            ? "-translate-x-full"
            : "-translate-x-1/2"
        }`}
        static
      >
        <div className="rounded-lg shadow-lg ring-1 ring-gray-400">
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
                    {incidents.map((incident, index) => {
                      const nextIncident = incidents[index + 1];
                      let endTimestamp;
                      let ongoing = false;

                      if (nextIncident?.id) {
                        endTimestamp = moment(nextIncident.timestamp);
                      } else if (
                        moment(incident.timestamp).isSame(now, "day")
                      ) {
                        endTimestamp = moment();
                        ongoing = true;
                      } else {
                        endTimestamp = moment(incident.timestamp)
                          .add(1, "day")
                          .startOf("day");
                      }
                      const duration = !ongoing
                        ? moment
                            .duration(
                              moment(endTimestamp).diff(
                                moment(incident.timestamp)
                              )
                            )
                            .humanize()
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
                        <div className="flex justify-between" key={index}>
                          <span
                            className={`capitalize ${
                              STATUS_COLORS_TEXT[
                                incident.status as keyof typeof STATUS_COLORS_TEXT
                              ]
                            }`}
                          >
                            {incident.status}
                          </span>
                          <span>
                            {moment(incident.timestamp).format("h:mmA")} -{" "}
                            {moment(endTimestamp).format("h:mmA")}
                          </span>
                          <span>{duration}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="flex justify-between mt-1">
                      <span className="font-bold">Total downtime</span>
                      <span>
                        {incidents.length > 0 &&
                          `${Math.round(totalMinutes / 60)} hrs ${
                            totalMinutes % 60
                          } mins`}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Popover.Panel>
    </Popover>
  );
}

export default function Uptime(props: { assetId: string }) {
  const [summary, setSummary] = useState<{
    [key: number]: AssetUptimeRecord[];
  }>([]);
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
        statusToCarryOver = recordsByDayBefore[i][0].status;
      }
    }

    setSummary(recordsByDayBefore);
  };

  function getUptimePercent(totalDays: number) {
    let upStatus = 0;

    for (let i = 0; i < totalDays; i++) {
      const index = numDays - i - 1;
      const dayRecords = summary[index];
      if (
        dayRecords &&
        dayRecords[dayRecords.length - 1].status === AssetStatus.operational
      ) {
        upStatus++;
      }
    }

    return Math.round((upStatus / totalDays) * 100);
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
      setUptimeRecord(availabilityData.data.results);
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
      for (let i = 0; i < 3; i++) {
        const start = i * 8;
        const end = (i + 1) * 8;
        const recordsInPeriod = dayRecords.filter(
          (record) =>
            moment(record.timestamp).hour() >= start &&
            moment(record.timestamp).hour() < end
        );
        if (recordsInPeriod.length === 0) {
          if (moment().set("hour", end).isBefore(moment())) {
            statusColors.push(
              statusColors[statusColors.length - 1] ??
                STATUS_COLORS["not_monitored"]
            );
          } else {
            statusColors.push(STATUS_COLORS["not_monitored"]);
          }
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["down"]
          )
        ) {
          statusColors.push(STATUS_COLORS["down"]);
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["maintenance"]
          )
        ) {
          statusColors.push(STATUS_COLORS["maintenance"]);
        } else if (
          recordsInPeriod.some(
            (record) => record.status === AssetStatus["operational"]
          )
        ) {
          statusColors.push(STATUS_COLORS["operational"]);
        } else {
          statusColors.push(STATUS_COLORS["not_monitored"]);
        }
      }
      return statusColors;
    } else {
      return [
        STATUS_COLORS["not_monitored"],
        STATUS_COLORS["not_monitored"],
        STATUS_COLORS["not_monitored"],
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
                            <StatusPopover
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
