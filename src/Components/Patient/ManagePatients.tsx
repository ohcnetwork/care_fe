/* eslint-disable @typescript-eslint/no-unused-vars */
import loadable from "@loadable/component";
import { Link, navigate, useQueryParams } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import moment from "moment";
import React, { useEffect, useState, useCallback } from "react";
import { CSVLink } from "react-csv";
import { useDispatch } from "react-redux";
import SwipeableViews from "react-swipeable-views";
import FacilitiesSelectDialogue from "../ExternalResult/FacilitiesSelectDialogue";
import { Tooltip } from "@material-ui/core";

import {
  getAllPatient,
  getDistrict,
  getLocalBody,
  getAnyFacility,
} from "../../Redux/actions";
import { PhoneNumberField } from "../Common/HelperInputFields";
import NavTabs from "../Common/NavTabs";
import Pagination from "../Common/Pagination";
import { InputSearchBox } from "../Common/SearchBox";
import {
  ADMITTED_TO,
  GENDER_TYPES,
  TELEMEDICINE_ACTIONS,
  PATIENT_FILTER_ADMITTED_TO,
  KASP_STRING,
} from "../../Common/constants";
import { make as SlideOver } from "../Common/SlideOver.gen";
import PatientFilterV2 from "./PatientFilterV2";
import { parseOptionId } from "../../Common/utils";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { FacilityModel, PatientCategory } from "../Facility/models";
import clsx from "clsx";
import { Badge } from "../Common/Badge";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: any;
  value: any;
}

type ParamsTypes = Record<string, number | boolean | string>;

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <div>{children}</div>}
    </div>
  );
}

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

const RESULT_LIMIT = 12;

const PatientCategoryDisplayText: Record<PatientCategory | "unknown", string> =
  {
    "Comfort Care": "COMFORT CARE",
    Stable: "STABLE",
    "Slightly Abnormal": "ABNORMAL",
    Critical: "CRITICAL",
    unknown: "UNKNOWN",
  };

const PatientCategoryTailwindClass: Record<
  PatientCategory | "unknown",
  string
> = {
  "Comfort Care": "patient-comfort",
  Stable: "patient-stable",
  "Slightly Abnormal": "patient-abnormal",
  Critical: "patient-critical",
  unknown: "patient-unknown",
};

export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const dispatch: any = useDispatch();

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [DownloadFile, setDownloadFile] = useState("");
  const [qParams, setQueryParams] = useQueryParams();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const [showDialog, setShowDialog] = useState(false);

  const [districtName, setDistrictName] = useState("");
  const [localbodyName, setLocalbodyName] = useState("");
  const [facilityBadgeName, setFacilityBadgeName] = useState("");
  const [facilityCrumbName, setFacilityCrumbName] = useState("");

  const tabValue = qParams.is_active === "False" ? 1 : 0;

  const params = {
    page: qParams.page || 1,
    limit: RESULT_LIMIT,
    name: qParams.name || undefined,
    is_active: qParams.is_active || "True",
    disease_status: qParams.disease_status || undefined,
    phone_number: qParams.phone_number
      ? parsePhoneNumberFromString(qParams.phone_number)?.format("E.164")
      : undefined,
    emergency_phone_number: qParams.emergency_phone_number
      ? parsePhoneNumberFromString(qParams.emergency_phone_number)?.format(
          "E.164"
        )
      : undefined,
    local_body: qParams.lsgBody || undefined,
    facility: facilityId || qParams.facility,
    facility_type: qParams.facility_type || undefined,
    district: qParams.district || undefined,
    offset: (qParams.page ? qParams.page - 1 : 0) * RESULT_LIMIT,
    created_date_before: qParams.created_date_before || undefined,
    created_date_after: qParams.created_date_after || undefined,
    modified_date_before: qParams.modified_date_before || undefined,
    modified_date_after: qParams.modified_date_after || undefined,
    ordering: qParams.ordering || undefined,
    category: qParams.category || undefined,
    gender: qParams.gender || undefined,
    age_min: qParams.age_min || undefined,
    age_max: qParams.age_max || undefined,
    date_declared_positive_before:
      qParams.date_declared_positive_before || undefined,
    date_declared_positive_after:
      qParams.date_declared_positive_after || undefined,
    date_of_result_before: qParams.date_of_result_before || undefined,
    date_of_result_after: qParams.date_of_result_after || undefined,
    last_consultation_admission_date_before:
      qParams.last_consultation_admission_date_before || undefined,
    last_consultation_admission_date_after:
      qParams.last_consultation_admission_date_after || undefined,
    last_consultation_discharge_date_before:
      qParams.last_consultation_discharge_date_before || undefined,
    last_consultation_discharge_date_after:
      qParams.last_consultation_discharge_date_after || undefined,
    last_consultation_admitted_to_list:
      qParams.last_consultation_admitted_to_list || undefined,
    srf_id: qParams.srf_id || undefined,
    number_of_doses: qParams.number_of_doses || undefined,
    covin_id: qParams.covin_id || undefined,
    is_kasp: qParams.is_kasp || undefined,
    is_declared_positive: qParams.is_declared_positive || undefined,
    last_consultation_symptoms_onset_date_before:
      qParams.last_consultation_symptoms_onset_date_before || undefined,
    last_consultation_symptoms_onset_date_after:
      qParams.last_consultation_symptoms_onset_date_after || undefined,
    last_vaccinated_date_before:
      qParams.last_vaccinated_date_before || undefined,
    last_vaccinated_date_after: qParams.last_vaccinated_date_after || undefined,
    last_consultation_is_telemedicine:
      qParams.last_consultation_is_telemedicine || undefined,
    is_antenatal: qParams.is_antenatal || undefined,
  };

  const date_range_fields = [
    [params.created_date_before, params.created_date_after],
    [params.modified_date_before, params.modified_date_after],
    [params.date_declared_positive_before, params.date_declared_positive_after],
    [params.date_of_result_before, params.date_of_result_after],
    [params.last_vaccinated_date_before, params.last_vaccinated_date_after],
    [
      params.last_consultation_admission_date_before,
      params.last_consultation_admission_date_after,
    ],
    [
      params.last_consultation_discharge_date_before,
      params.last_consultation_discharge_date_after,
    ],
    [
      params.last_consultation_symptoms_onset_date_before,
      params.last_consultation_symptoms_onset_date_after,
    ],
  ];

  const durations = date_range_fields.map((field: string[]) => {
    // XOR (checks if only one of the dates is set)
    if (!field[0] !== !field[1]) {
      return -1;
    }
    if (field[0] && field[1]) {
      return moment(field[0]).diff(moment(field[1]), "days");
    }
    return 0;
  });

  const isDownloadAllowed =
    durations.every((x) => x >= 0 && x <= 7) &&
    !durations.every((x) => x === 0);

  let managePatients: any = null;
  const handleDownload = async (isFiltered: boolean) => {
    const filters = {
      ...params,
      csv: true,
      facility: facilityId,
    };
    if (!isFiltered) delete filters.is_active;
    const res = await dispatch(getAllPatient(filters, "downloadPatients"));
    if (res && res.data && res.status === 200) {
      setDownloadFile(res.data);
      document.getElementById("downloadlink")?.click();
    }
  };
  const handleDownloadAll = async () => {
    await handleDownload(false);
  };
  const handleDownloadFiltered = async () => {
    await handleDownload(true);
  };

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatch(getAnyFacility(facilityId));

        setFacilityCrumbName(res?.data?.name || "");
      } else {
        setFacilityCrumbName("");
      }
    }
    fetchFacilityName();
  }, [dispatch, facilityId]);

  useEffect(() => {
    setIsLoading(true);
    dispatch(getAllPatient(params, "listPatients"))
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
  }, [
    dispatch,
    facilityId,
    qParams.last_consultation_admission_date_before,
    qParams.last_consultation_admission_date_after,
    qParams.last_consultation_discharge_date_before,
    qParams.last_consultation_discharge_date_after,
    qParams.age_max,
    qParams.age_min,
    qParams.last_consultation_admitted_to_list,
    qParams.facility,
    qParams.facility_type,
    qParams.district,
    qParams.category,
    qParams.gender,
    qParams.ordering,
    qParams.created_date_before,
    qParams.created_date_after,
    qParams.modified_date_before,
    qParams.modified_date_after,
    qParams.is_active,
    qParams.disease_status,
    qParams.name,
    qParams.page,
    qParams.phone_number,
    qParams.emergency_phone_number,
    qParams.srf_id,
    qParams.covin_id,
    qParams.number_of_doses,
    qParams.lsgBody,
    qParams.is_kasp,
    qParams.is_declared_positive,
    qParams.date_declared_positive_before,
    qParams.date_declared_positive_after,
    qParams.date_of_result_before,
    qParams.date_of_result_after,
    qParams.last_consultation_symptoms_onset_date_before,
    qParams.last_consultation_symptoms_onset_date_after,
    qParams.last_vaccinated_date_before,
    qParams.last_vaccinated_date_after,
    qParams.last_consultation_is_telemedicine,
    qParams.is_antenatal,
  ]);

  const fetchDistrictName = useCallback(
    async (status: statusType) => {
      const res =
        Number(qParams.district) &&
        (await dispatch(getDistrict(qParams.district)));
      if (!status.aborted) {
        setDistrictName(res?.data?.name);
      }
    },
    [dispatch, qParams.district]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDistrictName(status);
    },
    [fetchDistrictName]
  );

  const fetchLocalbodyName = useCallback(
    async (status: statusType) => {
      const res =
        Number(qParams.lsgBody) &&
        (await dispatch(getLocalBody({ id: qParams.lsgBody })));
      if (!status.aborted) {
        setLocalbodyName(res?.data?.name);
      }
    },
    [dispatch, qParams.lsgBody]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchLocalbodyName(status);
    },
    [fetchLocalbodyName]
  );

  const fetchFacilityBadgeName = useCallback(
    async (status: statusType) => {
      const res =
        qParams.facility && (await dispatch(getAnyFacility(qParams.facility)));

      if (!status.aborted) {
        setFacilityBadgeName(res?.data?.name);
      }
    },
    [dispatch, qParams.facility]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchFacilityBadgeName(status);
    },
    [fetchFacilityBadgeName]
  );

  const updateQuery = (params: ParamsTypes) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, { replace: true });
  };

  const handleTabChange = async (tab: number) => {
    updateQuery({
      ...qParams,
      is_active: tab ? "False" : "True",
      page: 1,
    });
  };

  const handlePagination = (page: number, limit: number) => {
    updateQuery({ page, limit });
  };

  const searchByName = (value: string) => {
    updateQuery({ name: value, page: 1 });
  };

  const searchByPhone = (value: string, name: string) => {
    updateQuery({ [name]: value, page: 1 });
  };

  const applyFilter = (data: ParamsTypes) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };
  const removeFilter = (paramKey: string) => {
    updateQuery({
      ...qParams,
      [paramKey]: "",
    });
  };

  const removeMultipleFilters = (paramKeys: string[]) => {
    const filter = { ...qParams };
    paramKeys.forEach((key) => {
      filter[key] = "";
    });
    updateQuery(filter);
  };

  const badge = (key: string, value: string, paramKey: string | string[]) => {
    return (
      value && (
        <span className="inline-flex items-center px-3 py-1 mt-2 ml-2 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
          {key}
          {": "}
          {value}
          <i
            className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
            onClick={() =>
              Array.isArray(paramKey)
                ? removeMultipleFilters(paramKey)
                : removeFilter(paramKey)
            }
          ></i>
        </span>
      )
    );
  };

  const LastAdmittedToTypeBadges = () => {
    const badge = (key: string, value: any, id: string) => {
      return (
        value && (
          <span className="inline-flex items-center px-3 py-1 mt-2 ml-2 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
            {key}
            {": "}
            {value}
            <i
              className="fas fa-times ml-2 rounded-full cursor-pointer hover:bg-gray-500 px-1 py-0.5"
              onClick={(_) => {
                const lcat = qParams.last_consultation_admitted_to_list
                  .split(",")
                  .filter((x: string) => x != id)
                  .join(",");
                updateQuery({
                  ...qParams,
                  last_consultation_admitted_to_list: lcat,
                });
              }}
            ></i>
          </span>
        )
      );
    };

    return qParams.last_consultation_admitted_to_list
      .split(",")
      .map((id: string) => {
        const text = PATIENT_FILTER_ADMITTED_TO.find(
          (obj) => obj.id == id
        )?.text;
        return badge("Bed Type", text, id);
      });
  };

  const showReviewAlert = (patient: any) => {
    return (
      patient.review_time &&
      !patient.last_consultation?.discharge_date &&
      moment(patient.review_time).isAfter(
        patient.last_consultation?.last_daily_round?.modified_date
      )
    );
  };

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      let patientUrl = "";
      if (
        patient.last_consultation &&
        patient.last_consultation?.facility === patient.facility
      ) {
        patientUrl = `/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation.id}`;
      } else if (patient.facility) {
        patientUrl = `/facility/${patient.facility}/patient/${patient.id}`;
      } else {
        patientUrl = `/patient/${patient.id}`;
      }

      const category: PatientCategory | "unknown" =
        patient?.last_consultation?.category || "unknown";

      const categoryClass = PatientCategoryTailwindClass[category];

      return (
        <Link
          key={`usr_${patient.id}`}
          href={patientUrl}
          className={`relative w-full cursor-pointer p-4 pl-5 hover:pl-9 rounded-lg bg-white shadow text-black ring-2 ring-opacity-0 hover:ring-opacity-100 transition-all duration-200 ease-in-out group ring-${categoryClass}`}
        >
          <div
            className={`rounded-l-lg absolute top-0 bottom-0 left-0 h-full w-1 group-hover:w-5 transition-all duration-200 ease-in-out flex items-center ${
              category === "unknown" ? "group-hover:" : ""
            }bg-${categoryClass} text-${categoryClass}-fore`}
          >
            <span className="absolute -left-32 -right-32 top-0 bottom-0 flex justify-center items-center text-center transform -rotate-90 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out">
              {PatientCategoryDisplayText[category]}
            </span>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 min-w-[5rem] bg-gray-50 rounded-lg border border-gray-300">
              {patient?.last_consultation &&
              patient?.last_consultation?.current_bed ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Tooltip
                    title={
                      patient?.last_consultation?.current_bed?.bed_object
                        ?.location_object?.name
                    }
                  >
                    <p className="text-gray-900 text-sm text-center text-ellipsis overflow-hidden px-1 whitespace-nowrap w-full">
                      {
                        patient?.last_consultation?.current_bed?.bed_object
                          ?.location_object?.name
                      }
                    </p>
                  </Tooltip>
                  <Tooltip
                    title={
                      patient?.last_consultation?.current_bed?.bed_object?.name
                    }
                  >
                    <p className="text-base font-bold text-center text-ellipsis overflow-hidden px-1 whitespace-nowrap w-full">
                      {patient?.last_consultation?.current_bed?.bed_object.name}
                    </p>
                  </Tooltip>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[5rem]">
                  <i className="fas fa-user-injured text-3xl text-gray-500"></i>
                </div>
              )}
            </div>
            <div className="pl-2 sm:flex md:block lg:flex gap-2 w-full">
              <div>
                <div className="md:flex justify-between w-full">
                  <div className="text-xl font-bold capitalize">
                    {patient.name} - {patient.age}
                    {patient.action && patient.action != 10 && (
                      <span className="font-semibold ml-2 text-gray-700">
                        -{" "}
                        {
                          TELEMEDICINE_ACTIONS.find(
                            (i) => i.id === patient.action
                          )?.desc
                        }
                      </span>
                    )}
                  </div>
                </div>
                {patient.facility_object && (
                  <div className="mb-2">
                    <div className="flex flex-wrap items-center">
                      <p className="text-sm font-medium text-gray-700 mr-2">
                        {" "}
                        {patient.facility_object.name}
                      </p>
                      <p className="text-base">
                        <span className="text-sm text-gray-600">
                          last updated
                        </span>{" "}
                        <span className="font-medium text-gray-900">
                          {" "}
                          {moment(patient.modified_date).fromNow()}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex w-full">
                  <div className="flex flex-wrap gap-2 flex-row justify-start">
                    {patient.allow_transfer ? (
                      <Badge
                        color="yellow"
                        startIcon="unlock"
                        text="Transfer Allowed"
                      />
                    ) : (
                      <Badge
                        color="primary"
                        startIcon="lock"
                        text="Transfer Blocked"
                      />
                    )}
                    {patient.disease_status === "POSITIVE" && (
                      <Badge
                        color="red"
                        startIcon="radiation"
                        text="Positive"
                      />
                    )}
                    {patient.gender === 2 &&
                      patient.is_antenatal &&
                      patient.is_active && (
                        <Badge
                          color="blue"
                          startIcon="baby-carriage"
                          text="Antenatal"
                        />
                      )}
                    {patient.is_medical_worker && patient.is_active && (
                      <Badge
                        color="blue"
                        startIcon="user-md"
                        text="Medical Worker"
                      />
                    )}
                    {patient.disease_status === "EXPIRED" && (
                      <Badge
                        color="yellow"
                        startIcon="exclamation-triangle"
                        text="Patient Expired"
                      />
                    )}
                    {(!patient.last_consultation ||
                      patient.last_consultation?.facility !==
                        patient.facility) && (
                      <span className="relative inline-flex">
                        <Badge
                          color="red"
                          startIcon="notes-medical"
                          text="No Consultation Filed"
                        />
                        <span className="flex absolute h-3 w-3 -top-1 -right-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                      </span>
                    )}
                    {showReviewAlert(patient) &&
                      moment().isBefore(patient.review_time) && (
                        <span
                          className={
                            "m-1 inline-block items-center px-3 py-1 rounded-full text-xs leading-4 font-semibold " +
                            (moment().isBefore(patient.review_time)
                              ? " bg-gray-100"
                              : "rounded p-1 bg-red-400 text-white")
                          }
                        >
                          Review Missed
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    });
  }

  if (isLoading || !data) {
    managePatients = (
      <div className="w-full text-center col-span-3 py-8">
        <Loading />
      </div>
    );
  } else if (data && data.length) {
    managePatients = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {patientList}
        </div>
        {totalCount > RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={qParams.page}
              defaultPerPage={RESULT_LIMIT}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    managePatients = (
      <div className="w-full bg-white rounded-lg p-2 text-center col-span-3 py-8 pt-4">
        <p className="text-2xl font-bold text-gray-600">No Patients Found</p>
      </div>
    );
  }

  return (
    <div>
      {showDialog && (
        <FacilitiesSelectDialogue
          setSelected={(e) => setSelectedFacility(e)}
          selectedFacility={selectedFacility}
          handleOk={() => navigate(`facility/${selectedFacility.id}/patient`)}
          handleCancel={() => setShowDialog(false)}
        />
      )}
      <PageTitle
        title="Patients"
        hideBack={!facilityId}
        breadcrumbs={!!facilityId}
        crumbsReplacements={{ [facilityId]: { name: facilityCrumbName } }}
      />
      <div className="mt-5 manualGrid grid-cols-1 gap-3 sm:grid-cols-3 my-4 px-2 md:px-0 relative">
        <div className="title-text sm:flex align-center gap-2">
          <div className="text-center">
            <button
              onClick={handleDownloadFiltered}
              disabled={!isDownloadAllowed}
              className="btn text-green-500 disabled:text-gray-500 disabled:hover:bg-gray-50 font-medium hover:bg-green-50 border border-solid w-full sm:w-fit mb-2 sm:mb-0 sm:mr-2"
            >
              <i className="fa-solid fa-arrow-down-long mr-2"></i>DOWNLOAD{" "}
              {tabValue === 0 ? "LIVE" : "DISCHARGED"} LIST
            </button>
            <CSVLink
              id="downloadlink"
              className="hidden"
              data={DownloadFile}
              filename={`patients-${now}.csv`}
              target="_blank"
            ></CSVLink>
          </div>
          <div className="flex flex-col gap-2">
            <button
              disabled={!isDownloadAllowed}
              onClick={handleDownloadAll}
              className="btn text-green-500 disabled:text-gray-500 disabled:hover:bg-gray-50 hover:bg-green-50 font-medium border border-solid"
            >
              <i className="fa-solid fa-arrow-down-long mr-2"></i>DOWNLOAD ALL
              PATIENTS
            </button>
            {!isDownloadAllowed && (
              <p className="self-end text-sm italic text-red-400">
                * Select a 7 day period
              </p>
            )}
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Patients
              </dt>
              {/* Show spinner until count is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </dd>
              ) : (
                <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
        <div className="col-span-2 mt-2">
          <div>
            <div>
              <div className="md:flex flex-wrap items-end gap-2 lg:mb-2">
                <div className="grow">
                  <div className="text-sm font-semibold mb-2">
                    Search by Name
                  </div>
                  <InputSearchBox
                    search={searchByName}
                    value={qParams.name}
                    placeholder="Search by Patient Name"
                    errors=""
                  />
                </div>
                <button
                  className="btn btn-primary-ghost w-full md:w-fit mt-2"
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
                <button
                  className="btn-primary btn mt-2 w-full md:w-fit"
                  onClick={() => {
                    if (facilityId) {
                      navigate(`/facility/${facilityId}/patient`);
                    } else {
                      setShowDialog(true);
                    }
                  }}
                  data-testid="add-patient-button"
                >
                  <i className="fas fa-plus mr-2 text-white"></i>
                  Add Details of a Patient
                </button>
              </div>
            </div>
          </div>
          <div className="md:flex md:gap-4">
            <div className="grow">
              <div className="text-sm font-semibold mt-2">
                Search by Primary Number
              </div>
              <PhoneNumberField
                value={qParams.phone_number || "+91"}
                onChange={(value: string) =>
                  searchByPhone(value, "phone_number")
                }
                turnOffAutoFormat={false}
                errors=""
              />
            </div>
            <div className="grow">
              <div className="text-sm font-semibold mt-2">
                Search by Emergency Number
              </div>
              <PhoneNumberField
                value={qParams.emergency_phone_number || "+91"}
                onChange={(value: string) =>
                  searchByPhone(value, "emergency_phone_number")
                }
                turnOffAutoFormat={false}
                errors=""
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap w-full col-span-3">
          {qParams.phone_number?.trim().split(" ").length - 1
            ? badge("Primary Number", qParams.phone_number, "phone_number")
            : null}
          {qParams.emergency_phone_number?.trim().split(" ").length - 1
            ? badge(
                "Emergency Number",
                qParams.emergency_phone_number,
                "emergency_phone_number"
              )
            : null}
          {badge("Patient Name", qParams.name, "name")}
          {badge(
            "Modified After",
            qParams.modified_date_after,
            "modified_date_after"
          )}
          {badge(
            "Modified Before",
            qParams.modified_date_before,
            "modified_date_before"
          )}
          {badge(
            "Created Before",
            qParams.created_date_before,
            "created_date_before"
          )}
          {badge(
            "Created After",
            qParams.created_date_after,
            "created_date_after"
          )}
          {qParams.last_consultation_admission_date_before ===
          qParams.last_consultation_admission_date_after ? (
            badge(
              "Admission Date",
              qParams.last_consultation_admission_date_before,
              [
                "last_consultation_admission_date_before",
                "last_consultation_admission_date_after",
              ]
            )
          ) : (
            <>
              {badge(
                "Admitted Before",
                qParams.last_consultation_admission_date_before,
                "last_consultation_admission_date_before"
              )}
              {badge(
                "Admitted After",
                qParams.last_consultation_admission_date_after,
                "last_consultation_admission_date_after"
              )}
            </>
          )}
          {badge(
            "Discharged Before",
            qParams.last_consultation_discharge_date_before,
            "last_consultation_discharge_date_before"
          )}
          {badge(
            "Discharged After",
            qParams.last_consultation_discharge_date_after,
            "last_consultation_discharge_date_after"
          )}
          {qParams.last_consultation_admitted_to_list &&
            LastAdmittedToTypeBadges()}
          {qParams.number_of_doses &&
            badge(
              "Number of Vaccination Doses",
              qParams.number_of_doses,
              "number_of_doses"
            )}
          {qParams.is_kasp &&
            badge(
              KASP_STRING,
              qParams.is_kasp === "true" ? KASP_STRING : `Non ${KASP_STRING}`,
              "is_kasp"
            )}
          {badge("COWIN ID", qParams.covin_id, "covin_id")}
          {badge("Is Antenatal", qParams.is_antenatal, "is_antenatal")}
          {badge("Facility", facilityBadgeName, "facility")}
          {badge("Facility Type", qParams.facility_type, "facility_type")}
          {badge("District", districtName, "district")}
          {badge("Ordering", qParams.ordering, "ordering")}
          {badge("Category", qParams.category, "category")}
          {badge("Disease Status", qParams.disease_status, "disease_status")}
          {badge(
            "Gender",
            parseOptionId(GENDER_TYPES, qParams.gender),
            "gender"
          )}
          {badge(
            "Admitted to",
            ADMITTED_TO[qParams.last_consultation_admitted_to],
            "last_consultation_admitted_to"
          )}
          {badge("Age min", qParams.age_min, "age_min")}
          {badge("Age max", qParams.age_max, "age_max")}
          {badge("SRF ID", qParams.srf_id, "srf_id")}
          {badge("LSG Body", localbodyName, "lsgBody")}
          {badge(
            "Declared Status",
            qParams.is_declared_positive,
            "is_declared_positive"
          )}
          {badge(
            "Result before",
            qParams.date_of_result_before,
            "date_of_result_before"
          )}
          {badge(
            "Result after",
            qParams.date_of_result_after,
            "date_of_result_after"
          )}

          {badge(
            "Declared positive before",
            qParams.date_declared_positive_before,
            "date_declared_positive_before"
          )}

          {badge(
            "Declared positive after",
            qParams.date_declared_positive_after,
            "date_declared_positive_after"
          )}

          {badge(
            "Onset of symptoms before",
            qParams.last_consultation_symptoms_onset_date_before,
            "last_consultation_symptoms_onset_date_before"
          )}

          {badge(
            "Onset of symptoms after",
            qParams.last_consultation_symptoms_onset_date_after,
            "last_consultation_symptoms_onset_date_after"
          )}
          {badge(
            "Vaccinated Date before",
            qParams.last_vaccinated_date_before,
            "last_vaccinated_date_before"
          )}

          {badge(
            "Vaccinated Date after",
            qParams.last_vaccinated_date_after,
            "last_vaccinated_date_after"
          )}
          {badge(
            "Telemedicine",
            qParams.last_consultation_is_telemedicine,
            "last_consultation_is_telemedicine"
          )}
        </div>
      </div>
      <div>
        <SlideOver show={showFilters} setShow={setShowFilters}>
          <div className="bg-white min-h-screen p-4">
            <PatientFilterV2
              filter={qParams}
              onChange={applyFilter}
              closeFilter={() => setShowFilters(false)}
            />
          </div>
        </SlideOver>
        <NavTabs
          onChange={handleTabChange}
          options={[
            { value: 0, label: "Live" },
            { value: 1, label: "Discharged" },
          ]}
          active={tabValue}
        />
        <SwipeableViews index={tabValue}>
          <TabPanel value={tabValue} index={0}>
            <div className="mb-4">{managePatients}</div>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <div className="mb-4">{managePatients}</div>
          </TabPanel>
        </SwipeableViews>
      </div>
    </div>
  );
};
