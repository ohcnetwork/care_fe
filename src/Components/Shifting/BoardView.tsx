import React, { useState } from "react";
import { navigate } from "raviger";
import ListFilter from "./ListFilter";
import ShiftingBoard from "./ShiftingBoard";
import BadgesList from "./BadgesList";
import { SHIFTING_CHOICES } from "../../Common/constants";
import { downloadShiftRequests } from "../../Redux/actions";
import loadable from "@loadable/component";
import { CSVLink } from "react-csv";
import { useDispatch } from "react-redux";
import moment from "moment";
import CircularProgress from "@material-ui/core/CircularProgress";
import GetAppIcon from "@material-ui/icons/GetApp";
import withScrolling from "react-dnd-scrolling";
import { formatFilter } from "./Commons";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const ScrollingComponent = withScrolling("div");
const shiftStatusOptions = SHIFTING_CHOICES.map((obj) => obj.text);

const COMPLETED = ["COMPLETED", "REJECTED", "DESTINATION REJECTED"];
const ACTIVE = shiftStatusOptions.filter(
  (option) => !COMPLETED.includes(option)
);

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function BoardView() {
  const { qParams, updateQuery, FilterBadges, AdvancedFilters } = useFilters({
    limit: -1,
  });
  const dispatch: any = useDispatch();
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  const [downloadFile, setDownloadFile] = useState("");
  const [isLoading] = useState(false);
  // state to change download button to loading while file is not ready
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="w-full flex flex-col md:flex-row items-center justify-between">
        <div className="w-1/3 lg:w-1/4">
          <PageTitle
            title={"Shifting"}
            className="mx-3 md:mx-5"
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
        <div className="w-full flex pt-2 lg:space-x-4 items-center flex-col lg:flex-row justify-between">
          <SearchInput
            name="patient_name"
            value={qParams.patient_name}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder="Search patient"
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
              onClick={() => navigate("/shifting/list-view", qParams)}
            >
              <i className="fa fa-list-ul mr-1" aria-hidden="true"></i>
              List View
            </button>
            <AdvancedFilters.Button />
          </div>
        </div>
      </div>
      <BadgesList {...{ qParams, FilterBadges }} />
      <ScrollingComponent className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll px-4">
        <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll px-2">
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
      </ScrollingComponent>
      <CSVLink
        data={downloadFile}
        filename={`shift-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={"shiftRequests-ALL"}
      />
      <ListFilter {...AdvancedFilters.props} />
    </div>
  );
}
