import React, { useState, useEffect } from "react";
import loadable from "@loadable/component";
import { InputSearchBox } from "../Common/SearchBox";
import { navigate, useQueryParams } from "raviger";
import { useDispatch } from "react-redux";
import moment from "moment";
import GetAppIcon from "@material-ui/icons/GetApp";
import { CSVLink } from "react-csv";
import {
  listShiftRequests,
  completeTransfer,
  downloadShiftRequests,
} from "../../Redux/actions";
import { make as SlideOver } from "../Common/SlideOver.gen";
import ListFilter from "./ListFilter";
import Pagination from "../Common/Pagination";
import { Modal, Button } from "@material-ui/core";

import { limit, formatFilter, badge } from "./Commons";

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

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  const triggerDownload = async () => {
    const res = await dispatch(
      downloadShiftRequests({ ...formatFilter(qParams), csv: 1 })
    );
    setDownloadFile(res.data);
    document.getElementById(`shiftRequests-ALL`)?.click();
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

  const searchByName = (patient_name: string) => {
    const filter = { ...qParams, patient_name };
    updateQuery(filter);
  };

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const onBoardViewBtnClick = () => {
    navigate("/shifting/board-view", qParams);
    localStorage.setItem("defaultShiftView", "board");
  };

  const handleTransferComplete = (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    dispatch(completeTransfer({ externalId: modalFor })).then(() => {
      navigate(
        `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`
      );
    });
  };

  const appliedFilters = formatFilter(qParams);

  const refreshList = () => {
    fetchData();
  };

  const fetchData = () => {
    setIsLoading(true);
    dispatch(
      listShiftRequests(formatFilter({ ...qParams, offset }), "shift-list-call")
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
    qParams.shifting_approving_facility,
    qParams.assigned_facility,
    qParams.emergency,
    qParams.is_up_shift,
    qParams.patient_name,
    qParams.created_date_before,
    qParams.created_date_after,
    qParams.modified_date_before,
    qParams.modified_date_after,
    qParams.patient_phone_number,
    qParams.ordering,
    qParams.is_kasp,
    offset,
  ]);

  let showShiftingCardList = (data: any) => {
    if (data && !data.length) {
      return (
        <div className="flex flex-1 justify-center text-gray-600 mt-64">
          No patients to show.
        </div>
      );
    }

    return data.map((shift: any) => (
      <div key={`shift_${shift.id}`} className="w-1/2 mt-6 md:px-4">
        <div className="overflow-hidden shadow rounded-lg bg-white h-full">
          <div
            className={
              "p-4 h-full flex flex-col justify-between " +
              (shift.patient_object.disease_status == "POSITIVE"
                ? "bg-red-50"
                : "")
            }
          >
            <div>
              <div className="flex justify-between">
                <div className="font-bold text-xl capitalize mb-2">
                  {shift.patient_object.name} - {shift.patient_object.age}
                </div>
                <div>
                  {shift.emergency && (
                    <span className="flex-shrink-0 inline-block px-2 py-0.5 text-red-800 text-xs leading-4 font-medium bg-red-100 rounded-full">
                      Emergency
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 col-gap-1 row-gap-2 sm:grid-cols-1">
                <div className="sm:col-span-1">
                  <dt
                    title="Shifting status"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-truck mr-2" />
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {shift.status}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title="Phone Number"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-mobile mr-2" />
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {shift.patient_object.phone_number || ""}
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
                      {(shift.orgin_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
                <div className="sm:col-span-1">
                  <dt
                    title="Shifting approving facility"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-user-check mr-2"></i>
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {(shift.shifting_approving_facility_object || {}).name}
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
                      {(shift.assigned_facility_object || {}).name ||
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
                        .isBefore(shift.modified_date)
                        ? "text-gray-900"
                        : "rounded p-1 bg-red-400 text-white")
                    }
                  >
                    <i className="fas fa-stopwatch mr-2"></i>
                    <dd className="font-bold text-sm leading-5">
                      {moment(shift.modified_date).format("LLL") || "--"}
                    </dd>
                  </dt>
                </div>

                <div className="sm:col-span-1">
                  <dt
                    title="Patient Address"
                    className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                  >
                    <i className="fas fa-home mr-2"></i>
                    <dd className="font-bold text-sm leading-5 text-gray-900">
                      {shift.patient_object.address || "--"}
                    </dd>
                  </dt>
                </div>
              </dl>
            </div>

            <div className="mt-2 flex">
              <button
                onClick={(_) => navigate(`/shifting/${shift.external_id}`)}
                className="btn w-full btn-default bg-white mr-2"
              >
                <i className="fas fa-eye mr-2" /> All Details
              </button>
            </div>
            {shift.status === "TRANSFER IN PROGRESS" &&
              shift.assigned_facility && (
                <div className="mt-2">
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    onClick={() => setModalFor(shift.external_id)}
                  >
                    TRANSFER TO RECEIVING FACILITY
                  </Button>

                  <Modal
                    open={modalFor === shift.external_id}
                    onClose={(_) =>
                      setModalFor({ externalId: undefined, loading: false })
                    }
                  >
                    <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
                      <div className="bg-white rounded shadow p-8 m-4 max-w-sm max-h-full text-center">
                        <div className="mb-4">
                          <h1 className="text-2xl">
                            Confirm Transfer Complete!
                          </h1>
                        </div>
                        <div className="mb-8">
                          <p>
                            Are you sure you want to mark this transfer as
                            complete? The Origin facility will no longer have
                            access to this patient
                          </p>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            onClick={() => {
                              setModalFor({
                                externalId: undefined,
                                loading: false,
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            onClick={(_) => handleTransferComplete(shift)}
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Modal>
                </div>
              )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="flex items-end justify-between px-4">
        <div className="flex items-center">
          <PageTitle title={"Shifting"} hideBack={true} />
          <GetAppIcon
            className="cursor-pointer mt-4"
            onClick={triggerDownload}
          />
        </div>
        <div className="md:px-4">
          <InputSearchBox
            value={qParams.patient_name}
            search={searchByName}
            placeholder="Patient Name"
            errors=""
          />
        </div>
        <div className="w-32">
          {/* dummy div to align space as per board view */}
        </div>
        <div>
          <button
            className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-32 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-green-600 hover:border-gray-400 focus:text-green-600 focus:border-gray-400"
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
            className="flex leading-none border-2 border-gray-200 bg-white rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-green-600 focus:text-green-600 focus:border-gray-400 hover:border-gray-400 rounded-r-full px-4 py-2 text-sm"
            onClick={(_) => setShowFilters((show) => !show)}
          >
            <i className="fa fa-filter mr-1" aria-hidden="true"></i>
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-2 mt-2 ml-2">
        {badge(
          "status",
          appliedFilters.status != "--" && appliedFilters.status
        )}
        {badge(
          "Emergency",
          appliedFilters.emergency === "true"
            ? "yes"
            : appliedFilters.emergency === "false"
            ? "no"
            : undefined
        )}
        {badge(
          "Is KASP",
          appliedFilters.is_kasp === "true"
            ? "yes"
            : appliedFilters.is_kasp === "false"
            ? "no"
            : undefined
        )}
        {badge(
          "Up Shift",
          appliedFilters.is_up_shift === "true"
            ? "yes"
            : appliedFilters.is_up_shift === "false"
            ? "no"
            : undefined
        )}
        {badge("Phone Number", appliedFilters.patient_phone_number)}
        {badge("Patient Name", appliedFilters.patient_name)}
        {badge("Modified After", appliedFilters.modified_date_after)}
        {badge("Modified Before", appliedFilters.modified_date_before)}
        {badge("Created Before", appliedFilters.created_date_before)}
        {badge("Created After", appliedFilters.created_date_after)}
        {badge(
          "Filtered By",
          appliedFilters.assigned_facility && "Assigned Facility"
        )}
        {badge(
          "Filtered By",
          appliedFilters.orgin_facility && "Origin Facility"
        )}
        {badge(
          "Filtered By",
          appliedFilters.shifting_approving_facility &&
            "Shifting Approving Facility"
        )}
      </div>

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
              {showShiftingCardList(data)}
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
        filename={`shift-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={`shiftRequests-ALL`}
      />
      <SlideOver show={showFilters} setShow={setShowFilters}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter
            filter={qParams}
            showShiftingStatus={true}
            onChange={applyFilter}
            closeFilter={() => setShowFilters(false)}
          />
        </div>
      </SlideOver>
    </div>
  );
}
