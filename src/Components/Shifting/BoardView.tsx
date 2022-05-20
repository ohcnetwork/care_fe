import React, { useState, useEffect } from "react";
import { useQueryParams, navigate } from "raviger";
import ListFilter from "./ListFilter";
import ShiftingBoard from "./ShiftingBoard";
import BadgesList from "./BadgesList";
import { SHIFTING_CHOICES } from "../../Common/constants";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { InputSearchBox } from "../Common/SearchBox";
import { downloadShiftRequests } from "../../Redux/actions";
import loadable from "@loadable/component";
import { CSVLink } from "react-csv";
import { useDispatch } from "react-redux";
import moment from "moment";
import CircularProgress from "@material-ui/core/CircularProgress";
import GetAppIcon from "@material-ui/icons/GetApp";

import { formatFilter } from "./Commons";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const shiftStatusOptions = SHIFTING_CHOICES.map((obj) => obj.text);

const COMPLETED = ["COMPLETED", "REJECTED", "DESTINATION REJECTED"];
const ACTIVE = shiftStatusOptions.filter(
  (option) => !COMPLETED.includes(option)
);

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function BoardView() {
  const [qParams, setQueryParams] = useQueryParams();
  const dispatch: any = useDispatch();
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  const [downloadFile, setDownloadFile] = useState("");
  const [isLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // state to change download button to loading while file is not ready
  const [downloadLoading, setDownloadLoading] = useState(false);
  const local = JSON.parse(localStorage.getItem("shift-filters") || "{}");

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

  const searchByName = (patient_name: string) => {
    const filter = { ...qParams, patient_name };
    updateQuery(filter);
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  useEffect(() => {
    applyFilter(local);
  }, []);

  const appliedFilters = formatFilter(qParams);

  const triggerDownload = async () => {
    // while is getting ready
    setDownloadLoading(true);
    const res = await dispatch(
      downloadShiftRequests({ ...formatFilter(qParams), csv: 1 })
    );
    // file ready to download
    setDownloadLoading(false);
    setDownloadFile(res.data);
    document.getElementById("shiftRequests-ALL")?.click();
  };

  const onListViewBtnClick = () => {
    navigate("/shifting/list-view", qParams);
    localStorage.setItem("defaultShiftView", "list");
  };

  const updateFilter = (params: any, local: any) => {
    updateQuery(params);
    localStorage.setItem("shift-filters", JSON.stringify(local));
  };

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="w-full flex items-center justify-between space-x-4">
        <div className="w-1/3 lg:w-1/4">
          <PageTitle
            title={"Shifting"}
            hideBack={true}
            componentRight={
              downloadLoading ? (
                <CircularProgress className="mt-2 ml-2 w-6 h-6 text-black" />
              ) : (
                <GetAppIcon
                  className="cursor-pointer mt-2 ml-2"
                  onClick={triggerDownload}
                />
              )
            }
            breadcrumbs={false}
          />
        </div>
        <div className="w-2/3 md:w-full flex items-end pt-2 space-y-2 lg:space-x-4 lg:items-center flex-end flex-col lg:flex-row">
          <InputSearchBox
            value={qParams.patient_name || ""}
            search={searchByName}
            placeholder="Patient Name"
            errors=""
          />
          <div className="bg-gray-200 text-sm text-gray-500 leading-none border-2 border-gray-200 rounded-full inline-flex mt-1">
            <button
              className={
                "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
                (boardFilter === ACTIVE
                  ? " bg-white text-gray-800"
                  : " bg-gray-200 text-sm text-gray-500")
              }
              onClick={() => setBoardFilter(ACTIVE)}
            >
              <span>Active</span>
            </button>
            <button
              className={
                "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
                (boardFilter === COMPLETED
                  ? " bg-white text-gray-800"
                  : " bg-gray-200 text-sm text-gray-500")
              }
              onClick={() => setBoardFilter(COMPLETED)}
            >
              <span>Completed</span>
            </button>
          </div>
          <div className="mt-1 w-fit inline-flex space-x-1 lg:space-x-4">
            <button
              className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-28 md:w-36 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
              onClick={onListViewBtnClick}
            >
              <i className="fa fa-list-ul mr-1" aria-hidden="true"></i>
              List View
            </button>
            <button
              className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-28 md:w-36 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
              onClick={() => setShowFilters((show) => !show)}
            >
              <i className="fa fa-filter mr-1" aria-hidden="true"></i>
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>
      <BadgesList
        filterParams={qParams}
        appliedFilters={appliedFilters}
        local={local}
        updateFilter={updateFilter}
      />
      <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll px-4">
        {isLoading ? (
          <Loading />
        ) : (
          boardFilter.map((board) => (
            <ShiftingBoard
              key={board}
              filterProp={qParams}
              board={board}
              formatFilter={formatFilter}
            />
          ))
        )}
      </div>
      <CSVLink
        data={downloadFile}
        filename={`shift-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={"shiftRequests-ALL"}
      />
      <SlideOver show={showFilters} setShow={setShowFilters}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter
            local={local}
            filter={qParams}
            onChange={applyFilter}
            closeFilter={() => setShowFilters(false)}
          />
        </div>
      </SlideOver>
    </div>
  );
}
