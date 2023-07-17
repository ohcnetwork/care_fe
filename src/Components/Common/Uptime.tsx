import { Popover } from "@headlessui/react";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { listAssetAvailability } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications.js";

const STATUS_COLORS = {
  operational: "bg-green-500",
  not_monitored: "bg-gray-400",
  down: "bg-red-500",
  maintenance: "bg-blue-500",
};

const now = moment();
const formatDateBeforeDays = Array.from({ length: 120 }, (_, index) =>
  now.clone().subtract(index, "days").format("Do MMMM YYYY")
);

const getDayStatusColor = (_day) => {
  const statusKeys = Object.keys(STATUS_COLORS);
  const randomStatusKey =
    Math.random() < 0.5
      ? "operational"
      : statusKeys[Math.floor(Math.random() * (statusKeys.length - 1)) + 1];
  return STATUS_COLORS[randomStatusKey];
};

function StatusPopover({
  data,
  day,
  date,
  numDays,
}: {
  data: any;
  day: number;
  date: string;
  numDays: number;
}) {
  return (
    <Popover className="mt-10 relative">
      <Popover.Panel
        className={`absolute z-50 w-80 transform px-4 sm:px-0 ${
          day < 4
            ? "-translate-x-6"
            : day > numDays - 7
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
                {data.current[day] === "bg-green-500" ? (
                  <span>No incidents for the day</span>
                ) : (
                  <>
                    <span className="font-bold ">Incidents</span>
                    <div className="flex justify-between">
                      <span className="font-bold ">Status</span>
                      <span className="font-bold ">Duration</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500">Down</span>
                      <span>3:03PM - 8:12PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-500">Maintenance</span>
                      <span>9:03PM - 11:12PM</span>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="flex justify-between mt-1">
                      <span className="font-bold">Total</span>
                      <span>8 hours 18 minutes</span>
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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const graphElem = useRef<HTMLDivElement>(null);
  const [numDays, setNumDays] = useState(
    Math.floor((window.innerWidth - 1024) / 20)
  );
  const [hoveredDay, setHoveredDay] = useState(-1);
  const dispatch = useDispatch<any>();

  const cachedDemo = useRef(
    Array.from({ length: 120 }, (_, index) => getDayStatusColor(index))
  );

  const handleResize = () => {
    const containerWidth = graphElem.current?.clientWidth ?? window.innerWidth;
    const newNumDays = Math.floor(containerWidth / 20);
    setNumDays(newNumDays);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoading(false);

    const availabilityData = await dispatch(
      listAssetAvailability({
        external_id: props.assetId,
      })
    );
    if (availabilityData?.data) {
      setSummary(availabilityData.data.results);
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

  if (loading) {
    return <p>Loading status...</p>;
  } else if (summary) {
    return (
      <div className="mt-8 flex flex-col bg-white w-full sm:rounded-lg shadow-sm p-4">
        <div className="mx-2 w-full">
          <div className="grid grid-cols-1">
            <div className="text-xl font-semibold">Availability History</div>
            <div key={summary.id} className="">
              <div className="mt-2 px-5 overflow-x-clip">
                <div className="flex text-gray-700 text-xs mt-2 opacity-70 justify-center mb-1">
                  98.8% uptime
                </div>
                <div
                  className="flex flex-row"
                  ref={graphElem}
                  onMouseLeave={() => setHoveredDay(-1)}
                >
                  {Array.from({ length: numDays }, (_, index) => (
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
                              : cachedDemo.current[index]
                          }`}
                        ></div>
                        <div
                          className={`h-[11px] w-3 ${
                            hoveredDay === index
                              ? "bg-gray-700"
                              : cachedDemo.current[Math.round(index / 2) + 1]
                          }`}
                        ></div>
                        <div
                          className={`h-[11px] w-3 rounded-b-sm ${
                            hoveredDay === index
                              ? "bg-gray-700"
                              : cachedDemo.current[Math.round(index / 2) + 1] ==
                                "operational"
                              ? cachedDemo.current[Math.round(index / 2) + 1]
                              : cachedDemo.current[Math.round(index / 3) + 1]
                          }`}
                        ></div>
                      </span>
                      {hoveredDay === index && (
                        <>
                          <StatusPopover
                            data={cachedDemo}
                            day={index}
                            date={formatDateBeforeDays[numDays - index]}
                            numDays={numDays}
                          />
                        </>
                      )}
                    </>
                  ))}
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
    return <p>No status information available.</p>;
  }
}
