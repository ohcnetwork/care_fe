import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import { make as SlideOver } from "../Common/SlideOver.gen";
import SampleFilter from "./SampleFilters";
import { navigate, useQueryParams } from "raviger";
import moment from "moment";
import loadable from "@loadable/component";
import React, { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  SAMPLE_TEST_STATUS,
  SAMPLE_TEST_RESULT,
  ROLE_STATUS_MAP,
  SAMPLE_FLOW_RULES,
  SAMPLE_TYPE_CHOICES,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getTestList,
  patchSample,
  downloadSampleTests,
  getFacilityV2,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import Pagination from "../Common/Pagination";
import { SampleTestModel } from "./models";
import { InputSearchBox } from "../Common/SearchBox";
import UpdateStatusDialog from "./UpdateStatusDialog";
import { CSVLink } from "react-csv";
import GetAppIcon from "@material-ui/icons/GetApp";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const statusChoices = [...SAMPLE_TEST_STATUS];

const statusFlow = { ...SAMPLE_FLOW_RULES };

const roleStatusMap = { ...ROLE_STATUS_MAP };

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function SampleViewAdmin(props: any) {
  const [qParams, setQueryParams] = useQueryParams();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageSamples: any = null;
  const [sample, setSample] = useState<Array<SampleTestModel>>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [downloadFile, setDownloadFile] = useState("");
  const [fetchFlag, callFetchData] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [statusDialog, setStatusDialog] = useState<{
    show: boolean;
    sample: SampleTestModel;
  }>({ show: false, sample: {} });
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const userType: "Staff" | "DistrictAdmin" | "StateLabAdmin" =
    currentUser.data.user_type;

  const limit = 10;

  useEffect(() => {
    async function fetchData() {
      if (qParams.facility) {
        const res = await dispatch(getFacilityV2(qParams.facility));

        setFacilityName(res?.data?.name);
      } else {
        setFacilityName("");
      }
    }
    fetchData();
  }, [dispatch, qParams.facility]);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getTestList({
          limit,
          offset,
          patient_name: qParams.patient_name || undefined,
          district_name: qParams.district_name || undefined,
          status: qParams.status || undefined,
          result: qParams.result || undefined,
          facility: qParams.facility || "",
          sample_type: qParams.sample_type || undefined,
        })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setSample(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [
      dispatch,
      offset,
      qParams.district_name,
      qParams.patient_name,
      qParams.status,
      qParams.result,
      qParams.facility,
      qParams.sample_type,
    ]
  );

  const triggerDownload = async () => {
    const res = await dispatch(downloadSampleTests({ ...qParams }));
    setDownloadFile(res.data);
    document.getElementById("download-sample-tests")?.click();
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData, fetchFlag]
  );

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, true);
  };

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const searchByName = async (patient_name: string) => {
    updateQuery({ patient_name, page: 1 });
  };

  const searchByDistrict = async (district_name: string) => {
    updateQuery({ district_name, page: 1 });
  };

  // const searchByPhone = async (searchValue: string) => {
  //   setIsLoading(true);
  //   const res = await dispatch(sampleSearch({ limit, offset, phone_number: encodeURI(searchValue) }));
  //   if (res && res.data) {
  //     setSample(res.data.results);
  //     setTotalCount(res.data.count);
  //   }
  //   setIsLoading(false);
  // }
  // const handleChange = (e: any) => {
  //   let results = { ...result };
  //   results[e.target.name] = e.target.value;
  //   setResult(results);
  // };

  const handleApproval = async (
    sample: SampleTestModel,
    status: number,
    result: number
  ) => {
    let sampleData: any = {
      id: sample.id,
      status,
      consultation: sample.consultation,
    };
    if (status === 7) {
      sampleData.result = result;
      sampleData.date_of_result = new Date().toISOString();
    }
    const statusName = SAMPLE_TEST_STATUS.find((i) => i.id === status)?.desc;
    const res = await dispatch(patchSample(sampleData, { id: sample.id }));
    if (res && (res.status === 201 || res.status === 200)) {
      Notification.Success({
        msg: `Success - ${statusName}`,
      });
      callFetchData(!fetchFlag);
    }
    dismissUpdateStatus();
  };

  const showUpdateStatus = (sample: SampleTestModel) => {
    setStatusDialog({
      show: true,
      sample,
    });
  };

  const dismissUpdateStatus = () => {
    setStatusDialog({
      show: false,
      sample: {},
    });
  };

  let sampleList: any[] = [];
  if (sample && sample.length) {
    sampleList = sample.map((item) => {
      const status = String(item.status) as keyof typeof SAMPLE_FLOW_RULES;
      const statusText = SAMPLE_TEST_STATUS.find(
        (i) => i.text === status
      )?.desc;
      const validStatusChoices = statusChoices.filter(
        (i) =>
          status && statusFlow[status] && statusFlow[status].includes(i.text)
      );
      // .filter(i => roleStatusMap[userType] && roleStatusMap[userType].includes(i.text))
      return (
        <div key={`usr_${item.id}`} className="w-full md:w-1/2 mt-6 md:px-4">
          <div
            className={`block border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black ${
              item.result === "POSITIVE" ? "border-red-700 bg-red-100" : ""
            } ${
              item.result === "NEGATIVE"
                ? "border-primary-700 bg-primary-100"
                : ""
            }`}
          >
            <div className="px-6 py-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between">
                  <div className="font-bold text-xl capitalize mb-2">
                    {item.patient_name}
                  </div>
                  <div>
                    {item.sample_type && (
                      <span className="bg-blue-200 text-blue-800 text-sm rounded-md font-bold px-2 py-1 mx-1 text-wrap">
                        type: {item.sample_type}
                      </span>
                    )}
                  </div>
                </div>
                {item.result !== "AWAITING" && (
                  <div className="capitalize">
                    <span className="font-semibold leading-relaxed">
                      Result:{" "}
                    </span>
                    {item.result ? item.result.toLocaleLowerCase() : "-"}
                  </div>
                )}
                <div>
                  <span className="font-semibold leading-relaxed">
                    Status:{" "}
                  </span>
                  {statusText}
                </div>
                {item.facility_object && (
                  <div>
                    <span className="font-semibold leading-relaxed">
                      Facility:{" "}
                    </span>
                    {item.facility_object.name}
                  </div>
                )}
                {item.fast_track && (
                  <div>
                    <span className="font-semibold leading-relaxed">
                      Fast track:{" "}
                    </span>
                    {item.fast_track}
                  </div>
                )}
                {item.patient_has_confirmed_contact && (
                  <div>
                    <span className="font-semibold leading-relaxed">
                      Contact:{" "}
                    </span>
                    Confirmed carrier
                    <WarningRoundedIcon className="text-red-500"></WarningRoundedIcon>
                  </div>
                )}
                {item.patient_has_suspected_contact &&
                  !item.patient_has_confirmed_contact && (
                    <div>
                      <span className="font-semibold leading-relaxed">
                        Contact:{" "}
                      </span>
                      Suspected carrier
                      <WarningRoundedIcon className="text-yellow-500"></WarningRoundedIcon>
                    </div>
                  )}
                {item.has_sari && (
                  <div>
                    <span className="font-semibold leading-relaxed">
                      SARI:{" "}
                    </span>
                    Severe Acute Respiratory illness
                    <WarningRoundedIcon className="text-orange-500"></WarningRoundedIcon>
                  </div>
                )}
                {item.has_ari && !item.has_sari && (
                  <div>
                    <span className="font-semibold leading-relaxed">ARI: </span>
                    Acute Respiratory illness
                    <WarningRoundedIcon className="text-yellow-500"></WarningRoundedIcon>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="text-gray-600 text-sm font-bold">
                  <span className="text-gray-800">Date of Sample:</span>{" "}
                  {item.date_of_sample
                    ? moment(item.date_of_sample).format("lll")
                    : "Not Available"}
                </div>

                <div className="text-gray-600 text-sm font-bold">
                  <span className="text-gray-800">Date of Result:</span>{" "}
                  {item.date_of_result
                    ? moment(item.date_of_result).format("lll")
                    : "Not Available"}
                </div>
              </div>

              <div className="mt-2">
                {item.result === "AWAITING" && (
                  <div className="mt-2">
                    <button
                      onClick={(e) => showUpdateStatus(item)}
                      className="w-full text-sm bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow text-center"
                    >
                      UPDATE SAMPLE TEST STATUS
                    </button>
                  </div>
                )}

                <button
                  onClick={(e) => navigate(`/sample/${item.id}`)}
                  className="mt-2 w-full text-sm bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow text-center"
                >
                  Sample Details
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !sample) {
    manageSamples = <Loading />;
  } else if (sample && sample.length) {
    manageSamples = (
      <>
        {sampleList}
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
      </>
    );
  } else if (sample && sample.length === 0) {
    manageSamples = (
      <Grid item xs={12} md={12} className="textMarginCenter">
        <h5 style={{ color: "red" }}>
          Its looks like samples are empty, please visit once you submit a
          sample request
        </h5>
      </Grid>
    );
  }

  const removeFilter = (paramKey: any) => {
    updateQuery({
      ...qParams,
      [paramKey]: "",
    });
  };

  const badge = (key: string, value: any, paramKey: string) => {
    return (
      value && (
        <span className="inline-flex h-full items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
          {key}
          {": "}
          {value}
          <i
            className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
            onClick={(e) => removeFilter(paramKey)}
          ></i>
        </span>
      )
    );
  };

  return (
    <div>
      {statusDialog.show && (
        <UpdateStatusDialog
          sample={statusDialog.sample}
          handleOk={handleApproval}
          handleCancel={dismissUpdateStatus}
          userType={userType}
        />
      )}
      <PageTitle
        title="Sample Management System"
        hideBack={true}
        className="mx-3 md:mx-8"
        breadcrumbs={false}
        componentRight={
          <GetAppIcon 
            className="cursor-pointer mt-5" 
            onClick={triggerDownload} 
          />
        }
      />
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 m-4 md:px-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Samples Taken
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
            </dl>
          </div>
        </div>

        <div>
          <div>
            <div className="text-sm font-semibold mb-2">
              Search by District Name
            </div>
            <InputSearchBox
              value={qParams.district_name}
              search={searchByDistrict}
              placeholder="District Name"
              errors=""
            />
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Search by Name</div>
            <InputSearchBox
              value={qParams.patient_name}
              search={searchByName}
              placeholder="Search by Patient Name"
              errors=""
            />
          </div>
        </div>

        <div>
          <div className="flex items-start mb-2">
            <button
              className="btn btn-primary-ghost md:mt-7 "
              onClick={(_) => setShowFilters((show) => !show)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="fill-current w-4 h-4 mr-2"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12">
                  {" "}
                </line>
                <line x1="8" y1="18" x2="21" y2="18">
                  {" "}
                </line>
                <line x1="3" y1="6" x2="3.01" y2="6">
                  {" "}
                </line>
                <line x1="3" y1="12" x2="3.01" y2="12">
                  {" "}
                </line>
                <line x1="3" y1="18" x2="3.01" y2="18">
                  {" "}
                </line>
              </svg>
              <span>Advanced Filters</span>
            </button>
          </div>
          <SlideOver show={showFilters} setShow={setShowFilters}>
            <div className="bg-white min-h-screen p-4">
              <SampleFilter
                filter={qParams}
                onChange={applyFilter}
                closeFilter={() => setShowFilters(false)}
              />
            </div>
          </SlideOver>
        </div>
        {/*<div>*/}
        {/*  <div className="text-sm font-semibold mb-2">*/}
        {/*    Search by number*/}
        {/*  </div>*/}
        {/*  <InputSearchBox*/}
        {/*      search={searchByPhone}*/}
        {/*      placeholder='+919876543210'*/}
        {/*      errors=''*/}
        {/*  />*/}
        {/*</div>*/}
        <div className="flex items-center space-x-2 mt-2 flex-wrap w-full col-span-3">
          {badge("Patient Name", qParams.patient_name, "patient_name")}
          {badge("District Name", qParams.district_name, "district_name")}
          {badge(
            "Status",
            SAMPLE_TEST_STATUS.find(
              (status) => status.id == qParams.status
            )?.text.replaceAll("_", " "),
            "status"
          )}
          {badge(
            "Result",
            SAMPLE_TEST_RESULT.find((result) => result.id == qParams.result)
              ?.text,
            "result"
          )}
          {badge(
            "Sample Test Type",
            SAMPLE_TYPE_CHOICES.find(
              (type) => type.id.toString() === qParams.sample_type
            )?.text,
            "sample_type"
          )}
          {qParams.facility &&
            sample[0] &&
            sample[0].facility_object &&
            badge("Facility", sample[0].facility_object.name, "facility")}
          {badge("Facility", facilityName, "facility")}
        </div>
      </div>
      <div className="px-3 md:px-8">
        <div className="flex flex-wrap md:-mx-4">{manageSamples}</div>
      </div>

      <CSVLink
        data={downloadFile}
        filename={`shift-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={`download-sample-tests`}
      />
    </div>
  );
}
