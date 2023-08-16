import * as Notification from "../../Utils/Notifications.js";

import {
  ADMITTED_TO,
  DISCHARGE_REASONS,
  GENDER_TYPES,
  PATIENT_CATEGORIES,
  PATIENT_SORT_OPTIONS,
  RESPIRATORY_SUPPORT,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants";
import { FacilityModel, PatientCategory } from "../Facility/models";
import { Link, navigate } from "raviger";
import { ReactNode, lazy, useCallback, useEffect, useState } from "react";
import {
  getAllPatient,
  getAnyFacility,
  getDistrict,
  getLocalBody,
} from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";

import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Chip from "../../CAREUI/display/Chip";
import CountBlock from "../../CAREUI/display/Count";
import DoctorVideoSlideover from "../Facility/DoctorVideoSlideover";
import { ExportMenu } from "../Common/Export";
import FacilitiesSelectDialogue from "../ExternalResult/FacilitiesSelectDialogue";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import FilterBadge from "../../CAREUI/display/FilterBadge";
import PatientFilter from "./PatientFilter";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import SearchInput from "../Form/SearchInput";
import SortDropdownMenu from "../Common/SortDropdown";
import SwitchTabs from "../Common/components/SwitchTabs";
import SwipeableViews from "react-swipeable-views";
import { parseOptionId } from "../../Common/utils";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useDispatch } from "react-redux";
import useFilters from "../../Common/hooks/useFilters";
import { useTranslation } from "react-i18next";
import Page from "../Common/components/Page.js";
import dayjs from "dayjs";
import { triggerGoal } from "../Common/Plausible.js";
import useAuthUser from "../../Common/hooks/useAuthUser.js";

const Loading = lazy(() => import("../Common/Loading"));

interface TabPanelProps {
  children?: ReactNode;
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
  Abnormal: "ABNORMAL",
  Critical: "CRITICAL",
};

export const PatientManager = () => {
  const { t } = useTranslation();
  const dispatch: any = useDispatch();
  const [data, setData] = useState<any[]>();
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
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
  const authUser = useAuthUser();
  const [showDialog, setShowDialog] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showDoctorConnect, setShowDoctorConnect] = useState(false);
  const [districtName, setDistrictName] = useState("");
  const [localbodyName, setLocalbodyName] = useState("");
  const [facilityBadgeName, setFacilityBadge] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [emergency_phone_number, setEmergencyPhoneNumber] = useState("");
  const [emergencyPhoneNumberError, setEmergencyPhoneNumberError] =
    useState("");

  const setPhoneNum = (phone_number: string) => {
    setPhoneNumber(phone_number);
    if (phone_number.length >= 13) {
      setPhoneNumberError("");
      updateQuery({ phone_number });
      return;
    }

    if (phone_number === "+91" || phone_number === "") {
      setPhoneNumberError("");
      updateQuery({ phone_number: "" });
      return;
    }

    setPhoneNumberError("Enter a valid number");
  };

  const setEmergencyPhoneNum = (emergency_phone_number: string) => {
    setEmergencyPhoneNumber(emergency_phone_number);
    if (emergency_phone_number.length >= 13) {
      setEmergencyPhoneNumberError("");
      updateQuery({ emergency_phone_number });
      return;
    }

    if (emergency_phone_number === "+91" || emergency_phone_number === "") {
      setEmergencyPhoneNumberError("");
      updateQuery({ emergency_phone_number: "" });
      return;
    }

    setEmergencyPhoneNumberError("Enter a valid number");
  };

  const tabValue =
    qParams.last_consultation_discharge_reason || qParams.is_active === "False"
      ? 1
      : 0;

  const params = {
    page: qParams.page || 1,
    limit: resultsPerPage,
    name: qParams.name || undefined,
    ip_or_op_no: qParams.ip_or_op_no || undefined,
    is_active:
      !qParams.last_consultation_discharge_reason &&
      (qParams.is_active || "True"),
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
    facility: qParams.facility,
    facility_type: qParams.facility_type || undefined,
    district: qParams.district || undefined,
    offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    created_date_before: qParams.created_date_before || undefined,
    created_date_after: qParams.created_date_after || undefined,
    modified_date_before: qParams.modified_date_before || undefined,
    modified_date_after: qParams.modified_date_after || undefined,
    ordering: qParams.ordering || "-modified_date",
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
    last_consultation_discharge_reason:
      qParams.last_consultation_discharge_reason || undefined,
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
    ventilator_interface: qParams.ventilator_interface || undefined,
  };

  useEffect(() => {
    if (params.facility) {
      setShowDoctorConnect(true);
    }
  }, [qParams.facility]);

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
      return dayjs(field[0]).diff(dayjs(field[1]), "days");
    }
    return 0;
  });

  const isExportAllowed =
    durations.every((x) => x >= 0 && x <= 7) &&
    !durations.every((x) => x === 0);

  let managePatients: any = null;

  const exportPatients = (isFiltered: boolean) => {
    const filters = { ...params, csv: true, facility: qParams.facility };
    if (!isFiltered) delete filters.is_active;
    return () => getAllPatient(filters, "downloadPatients");
  };

  const preventDuplicatePatientsDuetoPolicyId = (data: any) => {
    // Generate a array which contains imforamation of duplicate patient IDs and there respective linenumbers
    const lines = data.split("\n"); // Split the data into individual lines
    const idsMap = new Map(); // To store indices of lines with the same patient ID

    lines.map((line: any, i: number) => {
      const patientId = line.split(",")[0]; // Extract the patient ID from each line
      if (idsMap.has(patientId)) {
        idsMap.get(patientId).push(i); // Add the index to the existing array
      } else {
        idsMap.set(patientId, [i]); // Create a new array with the current index
      }
    });

    const linesWithSameId = Array.from(idsMap.entries())
      .filter(([_, indices]) => indices.length > 1)
      .map(([patientId, indices]) => ({
        patientId,
        indexSame: indices,
      }));

    // after getting the array of duplicate patient IDs and there respective linenumbers we will merge the policy IDs of the duplicate patients

    linesWithSameId.map((lineInfo) => {
      const indexes = lineInfo.indexSame;
      //get policyid of all the duplicate patients and merge them by seperating them with a semicolon
      const mergedPolicyId = `${indexes.map((currentIndex: number) => {
        return `${lines[currentIndex].split(",")[5]};`;
      })}`.replace(/,/g, "");
      // replace the policy ID of the first patient with the merged policy ID
      const arrayOfCurrentLine = lines[indexes[0]].split(",");
      arrayOfCurrentLine[5] = mergedPolicyId;
      const lineAfterMerge = arrayOfCurrentLine.join(",");
      lines[indexes[0]] = `${lineAfterMerge}`;
    });

    // after merging the policy IDs of the duplicate patients we will remove the duplicate patients from the data
    const uniqueLines = [];
    const ids = new Set(); // To keep track of unique patient IDs

    for (const line of lines) {
      const patientId = line.split(",")[0]; // Extract the patient ID from each line
      if (!ids.has(patientId)) {
        uniqueLines.push(line);
        ids.add(patientId);
      }
    }

    const cleanedData = uniqueLines.join("\n"); // Join the unique lines back together
    return cleanedData;
  };

  useEffect(() => {
    setIsLoading(true);
    if (!params.phone_number) {
      setPhoneNumber("+91");
    }
    if (!params.emergency_phone_number) {
      setEmergencyPhoneNumber("+91");
    }
    dispatch(getAllPatient(params, "listPatients")).then((res: any) => {
      if (res && res.data) {
        setData(res.data.results);
        setTotalCount(res.data.count);
        setIsLoading(false);
      }
    });
  }, [
    dispatch,
    qParams.last_consultation_admission_date_before,
    qParams.last_consultation_admission_date_after,
    qParams.last_consultation_discharge_date_before,
    qParams.last_consultation_discharge_date_after,
    qParams.age_max,
    qParams.age_min,
    qParams.last_consultation_admitted_bed_type_list,
    qParams.last_consultation_discharge_reason,
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
    qParams.ip_or_op_no,
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
    qParams.ventilator_interface,
  ]);

  const getTheCategoryFromId = () => {
    let category_name;
    if (qParams.category) {
      category_name = PATIENT_CATEGORIES.find(
        (item: any) => qParams.category === item.id
      )?.text;

      return String(category_name);
    } else {
      return "";
    }
  };

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
          <FilterBadge
            name={key}
            value={value}
            onRemove={() => {
              const lcat = qParams.last_consultation_admitted_bed_type_list
                .split(",")
                .filter((x: string) => x != id)
                .join(",");
              updateQuery({
                ...qParams,
                last_consultation_admitted_bed_type_list: lcat,
              });
            }}
          />
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

  let patientList: ReactNode[] = [];
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

      const category: PatientCategory | undefined =
        patient?.last_consultation?.last_daily_round?.patient_category ??
        patient?.last_consultation?.category;
      const categoryClass = category
        ? PATIENT_CATEGORIES.find((c) => c.text === category)?.twClass
        : "patient-unknown";

      return (
        <Link
          key={`usr_${patient.id}`}
          data-cy="patient"
          href={patientUrl}
          className={`ring/0 hover:ring/100 group relative w-full cursor-pointer rounded-lg bg-white p-4 pl-5 text-black shadow transition-all duration-200 ease-in-out hover:pl-5 ${categoryClass}-ring overflow-hidden`}
        >
          <div
            className={`absolute inset-y-0 left-0 flex h-full w-1 items-center rounded-l-lg transition-all duration-200 ease-in-out group-hover:w-5 ${categoryClass}`}
          >
            <span className="absolute -inset-x-32 inset-y-0 flex -rotate-90 items-center justify-center text-center text-xs font-bold uppercase tracking-widest opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100">
              {category ? PatientCategoryDisplayText[category] : "UNKNOWN"}
            </span>
          </div>
          <div className="flex flex-col items-start gap-4 md:flex-row">
            <div className="h-20 w-full min-w-[5rem] rounded-lg border border-gray-300 bg-gray-50 md:w-20">
              {patient?.last_consultation?.current_bed &&
              patient?.last_consultation?.discharge_date === null ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <span className="tooltip w-full truncate px-1 text-center text-sm text-gray-900">
                    {
                      patient?.last_consultation?.current_bed?.bed_object
                        ?.location_object?.name
                    }
                    <span className="tooltip-text tooltip-bottom">
                      {
                        patient?.last_consultation?.current_bed?.bed_object
                          ?.location_object?.name
                      }
                    </span>
                  </span>
                  <span className="w-full truncate px-1 text-center text-base font-bold">
                    {patient?.last_consultation?.current_bed?.bed_object.name}
                    <span className="tooltip-text tooltip-bottom">
                      {
                        patient?.last_consultation?.current_bed?.bed_object
                          ?.name
                      }
                    </span>
                  </span>
                </div>
              ) : patient.last_consultation?.suggestion === "DC" ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="tooltip">
                    <CareIcon className="care-l-estate text-3xl text-gray-500" />
                    <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-sm font-medium">
                      Domiciliary Care
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[5rem] items-center justify-center">
                  <i className="fas fa-user-injured text-3xl text-gray-500"></i>
                </div>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 pl-2 md:block md:flex-row">
              <div className="flex w-full justify-between gap-2">
                <div className="font-semibold">
                  <span className="text-xl capitalize">{patient.name}</span>
                  <span className="ml-4 text-gray-800">{`${patient.age} yrs.`}</span>
                </div>
              </div>

              {patient.action && patient.action != 10 && (
                <span className="text-sm font-semibold text-gray-700">
                  {
                    TELEMEDICINE_ACTIONS.find((i) => i.id === patient.action)
                      ?.desc
                  }
                </span>
              )}

              {patient.facility_object && (
                <div className="mb-2">
                  <div className="flex flex-wrap items-center">
                    <p className="mr-2 text-sm font-medium text-gray-700">
                      {patient.facility_object.name}
                    </p>
                    <RecordMeta
                      className="text-sm text-gray-900"
                      prefix={
                        <span className="text-gray-600">{t("updated")}</span>
                      }
                      time={patient.modified_date}
                    />
                  </div>
                </div>
              )}
              <div className="flex w-full">
                <div className="flex flex-row flex-wrap justify-start gap-2">
                  {patient.review_time &&
                    !patient.last_consultation?.discharge_date &&
                    Number(patient.last_consultation?.review_interval) > 0 &&
                    dayjs().isAfter(patient.review_time) && (
                      <Chip
                        size="small"
                        variant="danger"
                        startIcon="l-clock"
                        text="Review Missed"
                      />
                    )}
                  {patient.disease_status === "POSITIVE" && (
                    <Chip
                      size="small"
                      variant="danger"
                      startIcon="l-coronavirus"
                      text="Positive"
                    />
                  )}
                  {patient.gender === 2 &&
                    patient.is_antenatal &&
                    patient.is_active && (
                      <Chip
                        size="small"
                        variant="custom"
                        className="bg-pink-100 text-pink-600"
                        startIcon="l-baby-carriage"
                        text="Antenatal"
                      />
                    )}
                  {patient.is_medical_worker && patient.is_active && (
                    <Chip
                      size="small"
                      variant="custom"
                      className="bg-blue-100 text-blue-600"
                      startIcon="l-user-md"
                      text="Medical Worker"
                    />
                  )}
                  {patient.disease_status === "EXPIRED" && (
                    <Chip
                      size="small"
                      variant="warning"
                      startIcon="l-exclamation-triangle"
                      text="Patient Expired"
                    />
                  )}
                  {(!patient.last_consultation ||
                    patient.last_consultation?.facility !== patient.facility ||
                    (patient.last_consultation?.discharge_date &&
                      patient.is_active)) && (
                    <span className="relative inline-flex">
                      <Chip
                        size="small"
                        variant="danger"
                        startIcon="l-notes"
                        text="No Consultation Filed"
                      />
                      <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
                        <span className="center absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
                      </span>
                    </span>
                  )}
                  {!(
                    patient.last_consultation?.facility !== patient.facility
                  ) &&
                    !(
                      patient.last_consultation?.discharge_date ||
                      !patient.is_active
                    ) &&
                    dayjs(patient.last_consultation?.modified_date).isBefore(
                      new Date().getTime() - 24 * 60 * 60 * 1000
                    ) && (
                      <span className="relative inline-flex">
                        <Chip
                          size="small"
                          variant="danger"
                          startIcon="l-exclamation-circle"
                          text="No update in 24 hours"
                        />
                        <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
                          <span className="center absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
                        </span>
                      </span>
                    )}
                </div>
              </div>
            </div>
            {patient.last_consultation?.last_daily_round
              ?.ventilator_interface &&
              patient.last_consultation?.last_daily_round
                ?.ventilator_interface !== "UNKNOWN" && (
                <div className="mb-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600 bg-primary-100 text-xs font-semibold text-primary-600">
                  {
                    RESPIRATORY_SUPPORT.find(
                      (resp) =>
                        resp.text ===
                        patient.last_consultation?.last_daily_round
                          ?.ventilator_interface
                    )?.id
                  }
                </div>
              )}
          </div>
        </Link>
      );
    });
  }

  if (isLoading || !data) {
    managePatients = (
      <div className="col-span-3 w-full py-8 text-center">
        <Loading />
      </div>
    );
  } else if (data?.length) {
    managePatients = (
      <>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patientList}
        </div>
        <Pagination totalCount={totalCount} />
      </>
    );
  } else if (data && data.length === 0) {
    managePatients = (
      <div className="col-span-3 w-full rounded-lg bg-white p-2 py-8 pt-4 text-center">
        <p className="text-2xl font-bold text-gray-600">No Patients Found</p>
      </div>
    );
  }

  const queryField = <T,>(name: string, defaultValue?: T) => {
    return {
      name,
      value: qParams[name] || defaultValue,
      onChange: (e: FieldChangeEvent<T>) => updateQuery({ [e.name]: e.value }),
      className: "grow w-full mb-2",
    };
  };

  return (
    <Page
      title={t("Patients")}
      hideBack={true}
      breadcrumbs={false}
      options={
        <div className="flex w-full flex-col items-center justify-between lg:flex-row">
          <div className="mb-2 flex w-full flex-col items-center lg:mb-0 lg:w-fit lg:flex-row lg:gap-5">
            <ButtonV2
              onClick={() => {
                qParams.facility
                  ? navigate(`/facility/${qParams.facility}/patient`)
                  : setShowDialog(true);
              }}
              className="w-full lg:w-fit"
            >
              <CareIcon className="care-l-plus text-lg" />
              <p id="add-patient-div" className="lg:my-[2px]">
                Add Patient Details
              </p>
            </ButtonV2>
          </div>
          <div className="flex w-full flex-col justify-end gap-2 lg:w-fit lg:flex-row lg:gap-3">
            <SwitchTabs
              Tab1="Live"
              Tab2="Discharged"
              onClickTab1={() => updateQuery({ is_active: "True" })}
              onClickTab2={() => updateQuery({ is_active: "False" })}
              activeTab={tabValue ? true : false}
            />
            {showDoctorConnect && (
              <ButtonV2
                onClick={() => {
                  triggerGoal("Doctor Connect Clicked", {
                    facilityId: qParams.facility,
                    userId: authUser.id,
                    page: "FacilityPatientsList",
                  });
                  setShowDoctors(true);
                }}
              >
                <CareIcon className="care-l-phone text-lg" />
                <p className="lg:my-[2px]">Doctor Connect</p>
              </ButtonV2>
            )}

            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
            <SortDropdownMenu
              options={PATIENT_SORT_OPTIONS}
              selected={qParams.ordering}
              onSelect={updateQuery}
            />
            <div className="tooltip">
              {!isExportAllowed ? (
                <ButtonV2
                  onClick={() => {
                    advancedFilter.setShow(true);
                    setTimeout(() => {
                      const element =
                        document.getElementById("bed-type-select");
                      if (element)
                        element.scrollIntoView({ behavior: "smooth" });
                      Notification.Warn({
                        msg: "Please select a seven day period.",
                      });
                    }, 500);
                  }}
                  className="mr-5 w-full lg:w-fit"
                >
                  <CareIcon className="care-l-import" />
                  <span className="lg:my-[3px]">Export</span>
                </ButtonV2>
              ) : (
                <ExportMenu
                  disabled={!isExportAllowed}
                  exportItems={[
                    {
                      label:
                        tabValue === 0
                          ? "Live patients"
                          : "Discharged patients",
                      action: exportPatients(true),
                      parse: preventDuplicatePatientsDuetoPolicyId,
                    },
                    {
                      label: "All patients",
                      action: exportPatients(false),
                      parse: preventDuplicatePatientsDuetoPolicyId,
                    },
                  ]}
                />
              )}

              {!isExportAllowed && (
                <span className="tooltip-text tooltip-bottom -translate-x-1/2">
                  Select a seven day period
                </span>
              )}
            </div>
          </div>
        </div>
      }
    >
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

      <div className="manualGrid my-4 mb-[-12px] mt-5 grid-cols-1 gap-3 px-2 sm:grid-cols-4 md:px-0">
        <div className="mt-2 flex h-full flex-col gap-3 xl:flex-row">
          <div className="flex-1">
            <CountBlock
              text="Total Patients"
              count={totalCount}
              loading={isLoading}
              icon="l-user-injured"
              className="pb-12"
            />
          </div>
        </div>
        <div className="col-span-3 w-full">
          <div className="col-span-2 mt-2">
            <div className="mt-1 md:flex md:gap-4">
              <SearchInput
                label="Search by Patient"
                placeholder="Enter patient name"
                {...queryField("name")}
              />
              <SearchInput
                label="Search by IP/OP Number"
                placeholder="Enter IP/OP Number"
                secondary
                {...queryField("ip_or_op_no")}
              />
            </div>
            <div className="md:flex md:gap-4">
              <PhoneNumberFormField
                label="Search by Primary Number"
                {...queryField("phone_number", "+91")}
                value={phone_number}
                onChange={(e) => setPhoneNum(e.value)}
                error={phoneNumberError}
                types={["mobile", "landline"]}
              />
              <PhoneNumberFormField
                label="Search by Emergency Number"
                {...queryField("emergency_phone_number", "+91")}
                value={emergency_phone_number}
                onChange={(e) => setEmergencyPhoneNum(e.value)}
                error={emergencyPhoneNumberError}
                types={["mobile", "landline"]}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-3 mt-6 flex flex-wrap">
        <FilterBadges
          badges={({
            badge,
            value,
            kasp,
            phoneNumber,
            dateRange,
            range,
            ordering,
          }) => [
            phoneNumber("Primary number", "phone_number"),
            phoneNumber("Emergency number", "emergency_phone_number"),
            badge("Patient name", "name"),
            badge("IP/OP number", "ip_or_op_no"),
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
            ordering(),
            value("Category", "category", getTheCategoryFromId()),
            badge("Disease Status", "disease_status"),
            value(
              "Respiratory Support",
              "ventilator_interface",
              qParams.ventilator_interface &&
                t(`RESPIRATORY_SUPPORT_${qParams.ventilator_interface}`)
            ),
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
            value(
              "Discharge Reason",
              "last_consultation_discharge_reason",
              parseOptionId(
                DISCHARGE_REASONS,
                qParams.last_consultation_discharge_reason
              ) || ""
            ),
          ]}
          children={
            qParams.last_consultation_admitted_bed_type_list &&
            LastAdmittedToTypeBadges()
          }
        />
      </div>
      <div>
        <PatientFilter {...advancedFilter} key={window.location.search} />
        <SwipeableViews index={tabValue}>
          <TabPanel value={tabValue} index={0}>
            <div className="mb-4">{managePatients}</div>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <div className="mb-4">{managePatients}</div>
          </TabPanel>
        </SwipeableViews>
        <DoctorVideoSlideover
          facilityId={params.facility}
          show={showDoctors}
          setShow={setShowDoctors}
        />
      </div>
    </Page>
  );
};
