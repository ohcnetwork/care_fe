import loadable from "@loadable/component";
import { navigate, useQueryParams } from "raviger";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { SelectField } from "../Common/HelperInputFields";
import { InputLabel } from "@material-ui/core";
import moment from "moment";
import { Button, CircularProgress } from "@material-ui/core";
import { NOTIFICATION_EVENTS } from "../../Common/constants";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const RESULT_LIMIT = 15;
const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function ResultList() {
  const dispatch: any = useDispatch();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reload, setReload] = useState(false);
  const [eventFilter, setEventFilter] = useState("");

  let manageResults: any = null;

  useEffect(() => {
    setIsLoading(true);
    if (showNotifications) {
      dispatch(getNotifications({ offset, event: eventFilter }))
        .then((res: any) => {
          if (res && res.data) {
            setData((prev) => [...prev, ...res.data.results]);
            setTotalCount(res.data.count);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setOffset((prev) => prev - RESULT_LIMIT);
        });
    }
  }, [dispatch, reload, showNotifications, offset, eventFilter]);

  // const handlePagination = (page: number, limit: number) => {
  //   updateQuery({ page, limit });
  // };

  let resultUrl = (event: string, data: any) => {
    switch (event) {
      case "PATIENT_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_CONSULTATION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATE_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "PATIENT_CONSULTATION_UPDATE_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "INVESTIGATION_SESSION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/investigation/${data.session}`;
      default:
        return "#";
    }
  };

  let resultList: any[] = [];
  if (data && data.length) {
    resultList = data.map((result: any, idx: number) => {
      return (
        <div
          key={`usr_${result.id}`}
          onClick={() =>
            navigate(resultUrl(result.event, result.caused_objects))
          }
          className="relative py-5 px-4 lg:px-8 hover:bg-gray-200 focus:bg-gray-200 transition ease-in-out duration-150 cursor-pointer"
        >
          <div className="text-lg font-bold">{result.event}</div>
          <div className="text-sm">{result.message}</div>
          <div className="text-xs">
            {moment(result.created_date).format("lll")}
          </div>
          <a className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0">
            <i className="fas fa-eye mr-2 text-primary-500" />
            Visit Link
          </a>
        </div>
      );
    });
  }
  if (!offset && isLoading) {
    manageResults = (
      <div className="flex items-center justify-center">
        <CircularProgress color="primary" />
      </div>
    );
  } else if (data && data.length) {
    manageResults = (
      <>
        {resultList}
        {isLoading && (
          <div className="flex items-center justify-center">
            <CircularProgress color="primary" />
          </div>
        )}
        {totalCount > RESULT_LIMIT && offset < totalCount - RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center py-5 px-4 lg:px-8">
            <Button
              disabled={isLoading}
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                setOffset((prev) => prev + RESULT_LIMIT);
              }}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    manageResults = (
      <div>
        <h5> No Results Found</h5>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="mt-2 group flex w-full items-center px-2 py-2 text-base leading-5 font-medium text-green-300 rounded-md hover:text-white hover:bg-green-700 focus:outline-none focus:bg-green-900 transition ease-in-out duration-150"
      >
        <i
          className={
            "fas fa-bell text-green-400 mr-3 text-lg group-hover:text-green-300 group-focus:text-green-300 transition ease-in-out duration-150"
          }
        ></i>
        Notifications
      </button>

      <SlideOver show={showNotifications} setShow={setShowNotifications}>
        <div className="bg-white h-full">
          <div className="w-full bg-gray-100 border-b sticky top-0 z-30 px-4 pb-1 lg:px-8">
            <div className="flex justify-between items-end pt-4 py-2 space-x-2">
              <div className="font-bold text-xl">Notifications</div>
              <div className="">
                <button
                  onClick={(_) => {
                    setReload(!reload);
                    setData([]);
                    setOffset(0);
                  }}
                  className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0"
                >
                  <i className="fa-fw fas fa-sync cursor-pointer mr-2" /> Reload
                </button>
                <button
                  onClick={(_) => setShowNotifications(false)}
                  className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0"
                >
                  <i className="fa-fw fas fa-times cursor-pointer mr-2" /> Close
                </button>
              </div>
            </div>

            <div>
              <div className="w-2/3">
                <span className="text-sm font-semibold">
                  Filter by category
                </span>
                <SelectField
                  name="event_filter"
                  variant="outlined"
                  margin="dense"
                  value={eventFilter}
                  options={[
                    { id: "", text: "Show All" },
                    ...NOTIFICATION_EVENTS,
                  ]}
                  onChange={(e: any) => setEventFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>{manageResults}</div>
        </div>
      </SlideOver>
    </div>
  );
}
