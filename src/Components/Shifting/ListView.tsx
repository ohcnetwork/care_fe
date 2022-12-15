import { useState, useEffect } from "react";
import loadable from "@loadable/component";
import { navigate } from "raviger";
import { useDispatch } from "react-redux";
import moment from "moment";
import {
  listShiftRequests,
  completeTransfer,
  downloadShiftRequests,
} from "../../Redux/actions";
import { make as SlideOver } from "../Common/SlideOver.gen";
import ListFilter from "./ListFilter";
import { Modal, Button } from "@material-ui/core";
import { formatFilter } from "./Commons";
import { formatDate } from "../../Utils/utils";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import BadgesList from "./BadgesList";
import useExport from "../../Common/hooks/useExport";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ListView() {
  const dispatch: any = useDispatch();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({});
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [modalFor, setModalFor] = useState({
    externalId: undefined,
    loading: false,
  });
  const { ExportButton } = useExport();

  const handleTransferComplete = (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    dispatch(completeTransfer({ externalId: modalFor })).then(() => {
      navigate(
        `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`
      );
    });
  };

  const refreshList = () => {
    fetchData();
  };

  const fetchData = () => {
    setIsLoading(true);
    dispatch(
      listShiftRequests(
        formatFilter({
          ...qParams,
          offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        }),
        "shift-list-call"
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
    qParams.assigned_to,
    qParams.disease_status,
    qParams.is_antenatal,
    qParams.breathlessness_level,
    qParams.page,
  ]);

  const showShiftingCardList = (data: any) => {
    if (data && !data.length) {
      return (
        <div className="flex flex-1 justify-center text-gray-600 mt-64">
          No patients to show.
        </div>
      );
    }

    return data.map((shift: any) => (
      <div key={`shift_${shift.id}`} className="w-full md:w-1/2 mt-6 md:px-7">
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
                    <span className="shrink-0 inline-block px-2 py-0.5 text-red-800 text-xs leading-4 font-medium bg-red-100 rounded-full">
                      Emergency
                    </span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-x-1 gap-y-2 sm:grid-cols-1">
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
                      {formatDate(shift.modified_date) || "--"}
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
      <div className="md:flex md:items-center md:justify-between px-4">
        <PageTitle
          title="Shifting"
          hideBack
          componentRight={
            <ExportButton
              action={() =>
                downloadShiftRequests({ ...formatFilter(qParams), csv: 1 })
              }
              filenamePrefix="shift_requests"
            />
          }
          breadcrumbs={false}
        />

        <div className="md:px-4">
          <SearchInput
            name="patient_name"
            value={qParams.patient_name}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder="Search patient"
          />
        </div>
        <div className="w-32">
          {/* dummy div to align space as per board view */}
        </div>
        <div className="my-2 md:my-0">
          <button
            className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-32 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
            onClick={() => navigate("/shifting/board-view", { query: qParams })}
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
            onClick={() => advancedFilter.setShow(true)}
          >
            <i className="fa fa-filter mr-1" aria-hidden="true"></i>
            <span>Filters</span>
          </button>
        </div>
      </div>
      <BadgesList {...{ qParams, FilterBadges }} />
      <div className="px-1">
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
              <Pagination totalCount={totalCount} />
            </div>
          </div>
        )}
      </div>
      <SlideOver {...advancedFilter}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter showShiftingStatus={true} {...advancedFilter} />
        </div>
      </SlideOver>
    </div>
  );
}
