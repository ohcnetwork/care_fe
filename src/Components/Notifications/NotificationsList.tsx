import loadable from "@loadable/component";
import { navigate, useQueryParams } from "raviger";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { make as SlideOver } from "../Common/SlideOver.gen";
import moment from "moment";
import axios from "axios";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const RESULT_LIMIT = 15;
const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function ResultList() {
  const dispatch: any = useDispatch();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reload, setReload] = useState(false);

  let manageResults: any = null;

  const urlB64ToUint8Array = (urlSafeBase64: any) => {
    const decoded = atob(urlSafeBase64);
    // var cleaned = decoded.replace("-----BEGIN PUBLIC KEY-----", "");
    // cleaned = cleaned.replace("-----END PUBLIC KEY-----", "").trim();
    // console.log(cleaned);
    // const outputArray = new Uint8Array(decoded.length);
    // for (let i = 0; i < decoded.length; ++i) {
    //   outputArray[i] = decoded.charCodeAt(i);
    // }
    let bytes: any = [];
    for (var i = 0; i < decoded.length; ++i) {
      let code = decoded.charCodeAt(i);
      bytes = bytes.concat([code & 0xff, (code / 256) >>> 0]);
    }
    // console.log(bytes);
    const outputArray = new Uint8Array(bytes);
    return outputArray;
  };

  async function subscribe() {
    const apiUrl =
      "https://careapi.coronasafe.in/api/v1/notification/public_key/";
    const reponse = await axios.get(apiUrl);
    const public_key = reponse.data.public_key;
    const sw = await navigator.serviceWorker.ready;
    const key = urlB64ToUint8Array(public_key);
    const push = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
    console.log("Subscription Info: ", push);
  }

  useEffect(() => {
    setIsLoading(true);
    if (showNotifications) {
      dispatch(getNotifications({ offset }))
        .then((res: any) => {
          if (res && res.data) {
            setData(res.data.results);
            setTotalCount(res.data.count);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [dispatch, reload, showNotifications]);

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
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/`;
      case "PATIENT_CONSULTATION_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/`;
      case "PATIENT_CONSULTATION_UPDATE_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "PATIENT_CONSULTATION_UPDATE_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "INVESTIGATION_SESSION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/investigation/${data.investigation}`;
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
          className="relative py-5 px-4 lg:px-8 hover:bg-gray-200 focus:bg-gray-200 transition ease-in-out duration-150 "
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

  if (isLoading || !data) {
    manageResults = (
      <tr className="bg-white">
        <td colSpan={4}>
          <Loading />
        </td>
      </tr>
    );
  } else if (data && data.length) {
    manageResults = (
      <>
        {resultList}
        {totalCount > RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center">
            {/* <Pagination
              cPage={qParams.page}
              defaultPerPage={RESULT_LIMIT}
              data={{ totalCount }}
              onChange={handlePagination}
            /> */}
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
          <div className="flex justify-between items-end pt-4 w-full bg-gray-100 border-b sticky top-0 z-30 px-4 lg:px-8 py-3 space-x-2">
            <div className="font-bold text-xl">Notifications</div>
            <div className="">
              <button
                onClick={(_) => setReload(!reload)}
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
              <button
                onClick={subscribe}
                className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0"
              >
                Subscribe
              </button>
            </div>
          </div>
          <div>{manageResults}</div>
        </div>
      </SlideOver>
    </div>
  );
}
