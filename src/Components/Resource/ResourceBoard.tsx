import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { listResourceRequests, downloadResourceRequests } from "../../Redux/actions";
import Button from "@material-ui/core/Button";
import { navigate } from "raviger";
import moment from "moment";
import { Modal } from '@material-ui/core';
import { CSVLink } from 'react-csv';
import GetAppIcon from '@material-ui/icons/GetApp';

const limit = 30;

interface boardProps {
  board: string,
  filterProp: any,
  formatFilter: any
}

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

const renderBoardTitle = (board: string) => board

const reduceLoading = (action: string, current: any) => {
  switch (action) {
    case "MORE":
      return { ...current, more: true }
    case "BOARD":
      return { ...current, board: true }
    case "COMPLETE":
      return { board: false, more: false }

  }
}

export default function ResourceBoard({ board, filterProp, formatFilter }: boardProps) {

  const dispatch: any = useDispatch();
  const [data, setData] = useState<any[]>([]);
  const [downloadFile, setDownloadFile] = useState("");
  const [totalCount, setTotalCount] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState({ board: false, more: false });

  const fetchData = () => {
    setIsLoading(loading => reduceLoading("BOARD", loading));
    dispatch(listResourceRequests(formatFilter({ ...filterProp, status: board }), board)).then((res: any) => {
      if (res && res.data) {
        setData(res.data.results);
        setTotalCount(res.data.count);
        setCurrentPage(1);
      }
      setIsLoading(loading => reduceLoading("COMPLETE", loading));
    });
  }
  const triggerDownload = async () => {
    const res = await dispatch(downloadResourceRequests({ ...formatFilter({ ...filterProp, status: board }), csv: 1 }));
    setDownloadFile(res.data);
    document.getElementById(`resourceRequests-${board}`)?.click();
  }

  useEffect(() => {
    fetchData();
  },
    [board, dispatch, filterProp.facility, filterProp.orgin_facility, filterProp.approving_facility, filterProp.assigned_facility, filterProp.emergency, filterProp.created_date_before, filterProp.created_date_after, filterProp.modified_date_before, filterProp.modified_date_after, filterProp.ordering]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setIsLoading(loading => reduceLoading("MORE", loading));
    dispatch(listResourceRequests(formatFilter({ ...filterProp, status: board, offset: offset }), board)).then((res: any) => {
      if (res && res.data) {
        setData(data => [...data, ...res.data.results]);
        setTotalCount(res.data.count);
      }
      setIsLoading(loading => reduceLoading("COMPLETE", loading));
    });
  };

  let boardFilter = (filter: string) => {
    return data
      .filter(({ status }) => status === filter)
      .map((resource: any, idx: number) =>
        <div key={`resource_${resource.id}`} className="w-full mt-2 ">
          <div className="overflow-hidden shadow rounded-lg bg-white h-full mx-2">
            <div className={"p-4 h-full flex flex-col justify-between"}>
              <div>
                <div className="flex justify-between">
                  <div className="font-bold text-xl capitalize mb-2">
                    {resource.reason}
                  </div>
                  <div>
                    {resource.emergency && (
                      <span className="flex-shrink-0 inline-block px-2 py-0.5 text-red-800 text-xs leading-4 font-medium bg-red-100 rounded-full">Emergency</span>
                    )}
                  </div>
                </div>
                <dl className="grid grid-cols-1 col-gap-1 row-gap-2 sm:grid-cols-1">
                  <div className="sm:col-span-1">
                    <dt title=" Origin facility" className="text-sm leading-5 font-medium text-gray-500 flex items-center">
                      <i className="fas fa-plane-departure mr-2"></i>
                      <dd className="font-bold text-sm leading-5 text-gray-900">
                        {(resource.orgin_facility_object || {}).name}
                      </dd>
                    </dt>
                  </div>
                  <div className="sm:col-span-1">
                    <dt title="Resource approving facility" className="text-sm leading-5 font-medium text-gray-500 flex items-center">
                      <i className="fas fa-user-check mr-2"></i>
                      <dd className="font-bold text-sm leading-5 text-gray-900">
                        {(resource.approving_facility_object || {}).name}
                      </dd>
                    </dt>
                  </div>
                  <div className="sm:col-span-1">
                    <dt title=" Assigned facility" className="text-sm leading-5 font-medium text-gray-500 flex items-center">
                      <i className="fas fa-plane-arrival mr-2"></i>

                      <dd className="font-bold text-sm leading-5 text-gray-900">
                        {(resource.assigned_facility_object || {}).name || "Yet to be decided"}
                      </dd>
                    </dt>
                  </div>

                  <div className="sm:col-span-1">

                    <dt title="  Last Modified" className={
                      "text-sm leading-5 font-medium flex items-center " + (moment().subtract(2, 'hours').isBefore(resource.modified_date) ? "text-gray-900" : "rounded p-1 bg-red-400 text-white")}>
                      <i className="fas fa-stopwatch mr-2"></i>
                      <dd className="font-bold text-sm leading-5">
                        {moment(resource.modified_date).format("LLL") || "--"}
                      </dd>
                    </dt>
                  </div>

                  {resource.assigned_to_object && <div className="sm:col-span-1">
                    <dt title="Assigned to" className="text-sm leading-5 font-medium text-gray-500 flex items-center">
                      <i className="fas fa-user mr-2"></i>
                      <dd className="font-bold text-sm leading-5 text-gray-900">
                        {resource.assigned_to_object.first_name} {resource.assigned_to_object.last_name} - {resource.assigned_to_object.user_type}
                      </dd>
                    </dt>
                  </div>}
                </dl>
              </div>

              <div className="mt-2 flex">
                <button onClick={_ => navigate(`/resource/${resource.external_id}`)} className="btn w-full btn-default bg-white mr-2" >
                  <i className="fas fa-eye mr-2" /> All Details
                </button>
              </div>
            </div>
          </div >
        </div >
      );
  }
  return (
    <div className="bg-gray-200 py-2 mr-2 flex-shrink-0 w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 pb-4 h-full overflow-y-auto rounded-md">
      <div className="flex justify-between p-4 rounded mx-2 bg-white shadow items-center">
        <h3 className="text-xs flex items-center h-8">{renderBoardTitle(board)} <GetAppIcon className="cursor-pointer" onClick={triggerDownload} />
        </h3>
        <span className="rounded-lg ml-2 bg-green-500 text-white px-2">
          {totalCount || "0"}
        </span>
      </div>
      <div className="text-sm mt-2 pb-2 flex flex-col">
        {isLoading.board ?
          <div className="m-1">
            <div className="border border-gray-300 bg-white shadow rounded-md p-4 max-w-sm w-full mx-auto">
              <div className="animate-pulse flex space-x-4 ">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-400 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-400 rounded"></div>
                    <div className="h-4 bg-gray-400 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div> : data?.length > 0 ? boardFilter(board) : <p className="mx-auto p-4">No requests to show.</p>}
        {!isLoading.board && data?.length < (totalCount || 0) &&
          (isLoading.more ? <div className="mx-auto my-4 p-2 px-4 bg-gray-100 rounded-md hover:bg-white">Loading</div> :
            <button onClick={_ => handlePagination(currentPage + 1, limit)} className="mx-auto my-4 p-2 px-4 bg-gray-100 rounded-md hover:bg-white">More...</button>)}
      </div>
      <CSVLink
        data={downloadFile}
        filename={`resource-requests-${board}-${now}.csv`}
        target="_blank"
        className="hidden"
        id={`resourceRequests-${board}`}
      />
    </div>
  );
}
