import React, { useState, useEffect, useMemo } from "react";
import loadable from "@loadable/component";
import { InputSearchBox } from "../Common/SearchBox";
import { navigate, useQueryParams } from "raviger";
import { useDispatch } from "react-redux";
import moment from "moment";
import GetAppIcon from "@material-ui/icons/GetApp";
import { CSVLink } from "react-csv";
import {
  listResourceRequests,
  downloadResourceRequests,
} from "../../Redux/actions";
import { make as SlideOver } from "../Common/SlideOver.gen";
import ListFilter from "./ListFilter";
import Pagination from "../Common/Pagination";
import { Modal, Button } from "@material-ui/core";

import { limit, formatFilter } from "./Commons";
import BadgesList from "./BadgesList";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function ListView() {
  const dispatch: any = useDispatch();
  const [qParams, setQueryParams] = useQueryParams();
  const [downloadFile, setDownloadFile] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [modalFor, setModalFor] = useState({
    externalId: undefined,
    loading: false,
  });

  const local = useMemo(
    () => JSON.parse(localStorage.getItem("resource-filters") || "{}"),
    []
  );

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  useEffect(() => {
    applyFilter(local);
  }, []);

  const triggerDownload = async () => {
    const res = await dispatch(
      downloadResourceRequests({ ...formatFilter(qParams), csv: 1 })
    );
    setDownloadFile(res.data);
    document.getElementById("resourceRequests-ALL")?.click();
  };

  const updateQuery = (filter: any) => {
    // prevent empty filters from cluttering the url
    const nParams = Object.keys(filter).reduce(
      (a, k) =>
        filter[k] && filter[k] !== "--"
          ? Object.assign(a, { [k]: filter[k] })
          : a,
      {}
    );
    setQueryParams(nParams, true);
  };

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const onBoardViewBtnClick = () => {
    navigate("/resource/board-view", qParams);
    localStorage.setItem("defaultResourceView", "board");
  };

  const appliedFilters = formatFilter(qParams);
  const updateFilter = (params: any, local: any) => {
    updateQuery(params);
    localStorage.setItem("resource-filters", JSON.stringify(local));
  };

  const refreshList = () => {
    fetchData();
  };

  const fetchData = () => {
    setIsLoading(true);
    dispatch(
      listResourceRequests(
        formatFilter({ ...qParams, offset }),
        "resource-list-call"
      )
    ).then((res: any) => {
      if (res && res.data) {
        setData(res.data.results);
        setTotalCount(res.data.count);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [
    qParams.status,
    qParams.facility,
    qParams.orgin_facility,
    qParams.approving_facility,
    qParams.assigned_facility,
    qParams.emergency,
    qParams.created_date_before,
    qParams.created_date_after,
    qParams.modified_date_before,
    qParams.modified_date_after,
    qParams.ordering,
    offset,
  ]);

  let showResourceCardList = (data: any) => {
    if (data && !data.length) {
      return (
        <div className="flex flex-1 justify-center text-gray-600 mt-64">
          No requests to show.
        </div>
      );
    }

    return data.map((resource: any) => (
      <div key={`resource_${resource.id}`} className="w-1/2 mt-6 md:px-4">
        <div className="overflow-hidden shadow rounded-lg bg-white h-full">
          <div className={"p-4 h-full flex flex-col justify-between"}>
            <div>
              <div className="flex justify-between">
                <div className="font-bold text-xl capitalize mb-2">
                  {resource.title}
                </div>
                <div>
                  {resource.emergency && (
                    <span className="flex-shrink-0 inline-block px-2 py-0.5 text-red-800 text-xs leading-4 font-medium bg-red-100 rounded-full">
                      Emergency
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 col-gap-1 row-gap-2 sm:grid-cols-1">
                <div className="sm:col-span-1">
                  <dt
                    title="Resource status"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-truck mr-2" />
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {resource.status}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title=" Origin facility"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-plane-departure mr-2"></i>
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {(resource.orgin_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title="Resource approving facility"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-user-check mr-2"></i>
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {(resource.approving_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title=" Assigned facility"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-plane-arrival mr-2"></i>

                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {(resource.assigned_facility_object || {}).name ||
                        "Yet to be decided"}
                    </dd>
                  </dt>
                </div>

                <div className="sm:col-span-1">
                  <dt
                    title="  Last Modified"
                    className={
                      "text-sm leading-5 font-medium flex items-center " +
                      (moment()
                        .subtract(2, "hours")
                        .isBefore(resource.modified_date)
                        ? "text-gray-900"
                        : "rounded p-1 bg-red-400 text-white")
                    }
                  >
                    <i className="fas fa-stopwatch mr-2"></i>
                    <dd className="font-bold text-sm leading-5">
                      {moment(resource.modified_date).format("LLL") || "--"}
                    </dd>
                  </dt>
                </div>
              </dl>
            </div>

            <div className="mt-2 flex">
              <button
                onClick={(_) => navigate(`/resource/${resource.external_id}`)}
                className="btn w-full btn-default bg-white mr-2"
              >
                <i className="fas fa-eye mr-2" /> All Details
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="flex items-end justify-between px-4">
        <PageTitle
          title={"Resource"}
          hideBack={true}
          componentRight={
            <GetAppIcon
              className="cursor-pointer ml-2 mt-2"
              onClick={triggerDownload}
            />
          }
          breadcrumbs={false}
        />

        <div className="w-32">
          {/* dummy div to align space as per board view */}
        </div>
        <div>
          <button
            className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-32 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
            onClick={onBoardViewBtnClick}
          >
            <i
              className="fa fa-list mr-1 transform rotate-90"
              aria-hidden="true"
            ></i>
            Board View
          </button>
        </div>
        <div className="flex items-start gap-2">
          <button
            className="flex leading-none border-2 border-gray-200 bg-white rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 focus:text-primary-600 focus:border-gray-400 hover:border-gray-400 rounded-r-full px-4 py-2 text-sm"
            onClick={(_) => setShowFilters((show) => !show)}
          >
            <i className="fa fa-filter mr-1" aria-hidden="true"></i>
            <span>Filters</span>
          </button>
        </div>
      </div>

      <BadgesList
        appliedFilters={appliedFilters}
        local={local}
        updateFilter={updateFilter}
      />

      <div className="px-4">
        {isLoading ? (
          <Loading />
        ) : (
          <div>
            <div className="flex justify-end mt-4 mr-2 -mb-4">
              <button
                className="text-xs hover:text-blue-800"
                onClick={refreshList}
              >
                <i className="fa fa-refresh mr-1" aria-hidden="true"></i>
                Refresh List
              </button>
            </div>

            <div className="flex flex-wrap md:-mx-4 mb-5">
              {showResourceCardList(data)}
            </div>
            <div>
              {totalCount > limit && (
                <div className="mt-4 flex w-full justify-center">
                  <Pagination
                    cPage={currentPage}
                    defaultPerPage={limit}
                    data={{ totalCount }}
                    onChange={handlePagination}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CSVLink
        data={downloadFile}
        filename={`resource-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={"resourceRequests-ALL"}
      />
      <SlideOver show={showFilters} setShow={setShowFilters}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter
            filter={qParams}
            local={local}
            showResourceStatus={true}
            onChange={applyFilter}
            closeFilter={() => setShowFilters(false)}
          />
        </div>
      </SlideOver>
    </div>
  );
}
