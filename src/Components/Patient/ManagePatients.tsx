import loadable from "@loadable/component";
import { Link, navigate } from "raviger";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import moment from "moment";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import SwipeableViews from "react-swipeable-views";
import FacilitiesSelectDialogue from "../ExternalResult/FacilitiesSelectDialogue";
import { CircularProgress, Tooltip } from "@material-ui/core";

import {
  getAllPatient,
  getDistrict,
  getLocalBody,
  getAnyFacility,
} from "../../Redux/actions";
import { PhoneNumberField } from "../Common/HelperInputFields";
import NavTabs from "../Common/NavTabs";
import {
  ADMITTED_TO,
  GENDER_TYPES,
  TELEMEDICINE_ACTIONS,
  PatientCategoryTailwindClass,
} from "../../Common/constants";
import { make as SlideOver } from "../Common/SlideOver.gen";
import PatientFilterV2 from "./PatientFilterV2";
import { parseOptionId } from "../../Common/utils";
import { statusType, useAbortableEffect } from "../../Common/utils";
import Chip from "../../CAREUI/display/Chip";
import { FacilityModel, PatientCategory } from "../Facility/models";
import SearchInput from "../Form/SearchInput";
import useFilters from "../../Common/hooks/useFilters";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import { DropdownItem } from "../Common/components/Menu";
import useExport from "../../Common/hooks/useExport";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: any;
  value: any;
}

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

const PatientCategoryDisplayText: Record<PatientCategory, string> = {
  "Comfort Care": "COMFORT CARE",
  Stable: "STABLE",
  "Slightly Abnormal": "ABNORMAL",
  Critical: "CRITICAL",
  unknown: "UNKNOWN",
};

export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const dispatch: any = useDispatch();

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { exportCSV, ExportMenu } = useExport();
  const {
    qParams,
    updateQuery,
    advancedFilter,
    Pagination,
    FilterBadges,
    resultsPerPage,
  } = useFilters({
    limit: 12,
  });
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const [showDialog, setShowDialog] = useState(false);

  const [districtName, setDistrictName] = useState("");
  const [localbodyName, setLocalbodyName] = useState("");
  const [facilityBadgeName, setFacilityBadge] = useState("");
  const [facilityCrumbName, setFacilityCrumbName] = useState("");
  const tabValue = qParams.is_active === "False" ? 1 : 0;

  const params = {
    page: qParams.page || 1,
    limit: resultsPerPage,
    name: qParams.name || undefined,
    ip_no: qParams.ip_no || undefined,
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
    offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
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
    last_consultation_admitted_bed_type_list:
      qParams.last_consultation_admitted_bed_type_list || undefined,
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

  const isExportAllowed =
    durations.every((x) => x >= 0 && x <= 7) &&
    !durations.every((x) => x === 0);

  let managePatients: any = null;

  const exportPatients = async (isFiltered: boolean) => {
    const filters = { ...params, csv: true, facility: facilityId };
    if (!isFiltered) delete filters.is_active;
    exportCSV("patients", getAllPatient(filters, "downloadPatients"));
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
    qParams.last_consultation_admitted_bed_type_list,
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
    qParams.ip_no,
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
        setFacilityBadge(res?.data?.name);
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
                const lcat = qParams.last_consultation_admitted_bed_type_list
                  .split(",")
                  .filter((x: string) => x != id)
                  .join(",");
                updateQuery({
                  ...qParams,
                  last_consultation_admitted_bed_type_list: lcat,
                });
              }}
            ></i>
          </span>
        )
      );
    };
    return qParams.last_consultation_admitted_bed_type_list
      .split(",")
      .map((id: string) => {
        const text = ADMITTED_TO.find((obj) => obj.id == id)?.text;
        return badge("Bed Type", text, id);
      });
  };

  let patientList: React.ReactNode[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any) => {
      let patientUrl = "";
      if (
        patient.last_consultation &&
        patient.last_consultation?.facility === patient.facility &&
        !(patient.last_consultation?.discharge_date && patient.is_active)
      ) {
        patientUrl = `/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation.id}`;
      } else if (patient.facility) {
        patientUrl = `/facility/${patient.facility}/patient/${patient.id}`;
      } else {
        patientUrl = `/patient/${patient.id}`;
      }

      const category: PatientCategory =
        patient?.last_consultation?.category || "unknown";
      const categoryClass = PatientCategoryTailwindClass[category];

      return (
        <Link
          key={`usr_${patient.id}`}
          href={patientUrl}
          className={`relative w-full cursor-pointer p-4 pl-5 hover:pl-5 rounded-lg bg-white shadow text-black ring-2 ring-opacity-0 hover:ring-opacity-100 transition-all duration-200 ease-in-out group ${categoryClass}-ring overflow-hidden`}
        >
          <div
            className={`rounded-l-lg absolute top-0 bottom-0 left-0 h-full w-1 group-hover:w-5 transition-all duration-200 ease-in-out flex items-center ${categoryClass}`}
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
                  <div className="text-xl font-semibold capitalize">
                    <span>{patient.name}</span>
                    <span className="text-gray-800">{" - " + patient.age}</span>
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
                      <p className="text-sm">
                        <span className="text-gray-600">last updated</span>{" "}
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
                    {/* TODO: Re-enable Review Missed | Temporary Hack for Launch */}
                    {/* {patient.review_time &&
                      !patient.last_consultation?.discharge_date &&
                      Number(patient.last_consultation?.review_interval) > 0 &&
                      moment().isAfter(patient.review_time) && (
                        <Chip
                          color="red"
                          startIcon="clock"
                          text="Review Missed"
                        />
                      )} */}
                    {patient.allow_transfer ? (
                      <Chip
                        color="yellow"
                        startIcon="unlock"
                        text="Transfer Allowed"
                      />
                    ) : (
                      <Chip
                        color="primary"
                        startIcon="lock"
                        text="Transfer Blocked"
                      />
                    )}
                    {patient.disease_status === "POSITIVE" && (
                      <Chip color="red" startIcon="radiation" text="Positive" />
                    )}
                    {patient.gender === 2 &&
                      patient.is_antenatal &&
                      patient.is_active && (
                        <Chip
                          color="blue"
                          startIcon="baby-carriage"
                          text="Antenatal"
                        />
                      )}
                    {patient.is_medical_worker && patient.is_active && (
                      <Chip
                        color="blue"
                        startIcon="user-md"
                        text="Medical Worker"
                      />
                    )}
                    {patient.disease_status === "EXPIRED" && (
                      <Chip
                        color="yellow"
                        startIcon="exclamation-triangle"
                        text="Patient Expired"
                      />
                    )}
                    {(!patient.last_consultation ||
                      patient.last_consultation?.facility !==
                        patient.facility ||
                      (patient.last_consultation?.discharge_date &&
                        patient.is_active)) && (
                      <span className="relative inline-flex">
                        <Chip
                          color="red"
                          startIcon="notes-medical"
                          text="No Consultation Filed"
                        />
                        <span className="flex absolute h-3 w-3 -top-1 -right-1 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-4 w-4 center rounded-full bg-red-400"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
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
        <Pagination totalCount={totalCount} />
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
    <div className="px-6">
      <FacilitiesSelectDialogue
        show={showDialog}
        setSelected={(e) => setSelectedFacility(e)}
        selectedFacility={selectedFacility}
        handleOk={() => navigate(`facility/${selectedFacility.id}/patient`)}
        handleCancel={() => {
          setShowDialog(false);
          setSelectedFacility({ name: "" });
        }}
      />
      <div className="flex justify-between items-center">
        <PageTitle
          title="Patients"
          hideBack={!facilityId}
          breadcrumbs={!!facilityId}
          crumbsReplacements={{ [facilityId]: { name: facilityCrumbName } }}
        />
        <div className="flex flex-col gap-2 lg:gap-3 lg:flex-row justify-end">
          <ButtonV2
            className="flex gap-2 items-center font-semibold"
            onClick={() => {
              facilityId
                ? navigate(`/facility/${facilityId}/patient`)
                : setShowDialog(true);
            }}
          >
            <CareIcon className="care-l-plus text-lg" />
            <p>Add Patient Details</p>
          </ButtonV2>
          <button
            className="btn btn-primary-ghost w-full lg:w-fit"
            onClick={() => advancedFilter.setShow(true)}
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
          <div className="tooltip">
            <ExportMenu disabled={!isExportAllowed}>
              <DropdownItem onClick={() => exportPatients(true)}>
                {tabValue === 0 ? "Live patients" : "Discharged patients"}
              </DropdownItem>
              <DropdownItem onClick={() => exportPatients(false)}>
                All patients
              </DropdownItem>
            </ExportMenu>
            {!isExportAllowed && (
              <span className="tooltip-text tooltip-bottom -translate-x-1/2">
                Select a seven day period
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 manualGrid grid-cols-1 gap-3 sm:grid-cols-3 my-4 px-2 md:px-0 mb-[-24px]">
        <div>
          <div className="flex flex-col mt-2">
            <div className="bg-white overflow-hidden shadow rounded-lg mb-2">
              <div className="px-4 py-5 sm:p-[35px]">
                <dl>
                  <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                    Total Patients
                  </dt>
                  {/* Show spinner until count is fetched from server */}
                  {isLoading ? (
                    <dd className="mt-4 text-5xl leading-9">
                      <CircularProgress className="text-primary-500" />
                    </dd>
                  ) : (
                    <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                      {totalCount}
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full col-span-2">
          <div className="col-span-2 mt-2">
            <div>
              <div>
                <div className="md:flex md:gap-4 mt-1">
                  <div className="grow lg:max-w-sm w-full mb-2">
                    <SearchInput
                      label="Search by Name"
                      name="name"
                      onChange={(e) => updateQuery({ [e.name]: e.value })}
                      value={qParams.name}
                      placeholder="Search patient"
                    />
                  </div>
                  <div className="grow lg:max-w-sm w-full mb-2">
                    <SearchInput
                      label="Search by IP Number"
                      name="ip_no"
                      onChange={(e) => updateQuery({ [e.name]: e.value })}
                      value={qParams.ip_no}
                      placeholder="Search IP Number"
                      secondary
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:flex md:gap-4">
              <div className="grow lg:max-w-sm w-full">
                <div className="text-sm font-medium">
                  Search by Primary Number
                </div>
                <PhoneNumberField
                  bgColor="bg-white"
                  value={qParams.phone_number || "+91"}
                  onChange={(value: string) => {
                    if (value !== "+91") {
                      updateQuery({ phone_number: value });
                    } else {
                      updateQuery({ phone_number: "" });
                    }
                  }}
                  turnOffAutoFormat={false}
                  errors=""
                />
              </div>
              <div className="grow lg:max-w-sm w-full">
                <div className="text-sm font-medium">
                  Search by Emergency Number
                </div>
                <PhoneNumberField
                  bgColor="bg-white"
                  value={qParams.emergency_phone_number || "+91"}
                  onChange={(value: string) => {
                    if (value !== "+91") {
                      updateQuery({ emergency_phone_number: value });
                    } else {
                      updateQuery({ emergency_phone_number: "" });
                    }
                  }}
                  turnOffAutoFormat={false}
                  errors=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap w-full col-span-3">
        <FilterBadges
          badges={({ badge, value, kasp, phoneNumber, dateRange, range }) => [
            phoneNumber("Primary number", "phone_number"),
            phoneNumber("Emergency number", "emergency_phone_number"),
            badge("Patient name", "name"),
            badge("IP number", "ip_no"),
            ...dateRange("Modified", "modified_date"),
            ...dateRange("Created", "created_date"),
            ...dateRange("Admitted", "last_consultation_admission_date"),
            ...dateRange("Discharged", "last_consultation_discharge_date"),
            // Admitted to type badges
            badge("No. of vaccination doses", "number_of_doses"),
            kasp(),
            badge("COWIN ID", "covin_id"),
            badge("Is Antenatal", "is_antenatal"),
            value("Facility", "facility", facilityBadgeName),
            badge("Facility Type", "facility_type"),
            value("District", "district", districtName),
            badge("Ordering", "ordering"),
            badge("Category", "category"),
            badge("Disease Status", "disease_status"),
            value(
              "Gender",
              "gender",
              parseOptionId(GENDER_TYPES, qParams.gender) || ""
            ),
            {
              name: "Admitted to",
              value: ADMITTED_TO[qParams.last_consultation_admitted_to],
              paramKey: "last_consultation_admitted_to",
            },
            ...range("Age", "age"),
            badge("SRF ID", "srf_id"),
            { name: "LSG Body", value: localbodyName, paramKey: "lsgBody" },
            badge("Declared Status", "is_declared_positive"),
            ...dateRange("Result", "date_of_result"),
            ...dateRange("Declared positive", "date_declared_positive"),
            ...dateRange(
              "Symptoms onset",
              "last_consultation_symptoms_onset_date"
            ),
            ...dateRange("Last vaccinated", "last_vaccinated_date"),
            {
              name: "Telemedicine",
              paramKey: "last_consultation_is_telemedicine",
            },
          ]}
        />
        {qParams.last_consultation_admitted_bed_type_list &&
          LastAdmittedToTypeBadges()}
      </div>
      <div>
        <SlideOver {...advancedFilter}>
          <div className="bg-white min-h-screen p-4">
            <PatientFilterV2 {...advancedFilter} />
          </div>
        </SlideOver>
        <NavTabs
          onChange={(tab) => updateQuery({ is_active: tab ? "False" : "True" })}
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
