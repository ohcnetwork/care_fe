import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CountBlock from "@/CAREUI/display/Count";
import FilterBadge from "@/CAREUI/display/FilterBadge";
import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import { Avatar } from "@/components/Common/Avatar";
import ButtonV2 from "@/components/Common/ButtonV2";
import { ExportMenu } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import SortDropdownMenu from "@/components/Common/SortDropdown";
import Tabs from "@/components/Common/Tabs";
import { ICD11DiagnosisModel } from "@/components/Diagnosis/types";
import { getDiagnosesByIds } from "@/components/Diagnosis/utils";
import FacilitiesSelectDialogue from "@/components/ExternalResult/FacilitiesSelectDialogue";
import DoctorVideoSlideover from "@/components/Facility/DoctorVideoSlideover";
import { FacilityModel, PatientCategory } from "@/components/Facility/models";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import SearchInput from "@/components/Form/SearchInput";
import {
  DIAGNOSES_FILTER_LABELS,
  DiagnosesFilterKey,
  FILTER_BY_DIAGNOSES_KEYS,
} from "@/components/Patient/DiagnosesFilter";
import PatientFilter from "@/components/Patient/PatientFilter";
import { isPatientMandatoryDataFilled } from "@/components/Patient/Utils";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import {
  ADMITTED_TO,
  CONSENT_TYPE_CHOICES,
  DISCHARGE_REASONS,
  GENDER_TYPES,
  PATIENT_CATEGORIES,
  PATIENT_SORT_OPTIONS,
  RESPIRATORY_SUPPORT,
  TELEMEDICINE_ACTIONS,
} from "@/common/constants";
import { parseOptionId } from "@/common/utils";

import { triggerGoal } from "@/Integrations/Plausible";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import {
  formatPatientAge,
  humanizeStrings,
  isAntenatal,
  parsePhoneNumber,
} from "@/Utils/utils";

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

export const PatientManager = () => {
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    advancedFilter,
    Pagination,
    FilterBadges,
    resultsPerPage,
  } = useFilters({
    limit: 12,
    cacheBlacklist: [
      "name",
      "patient_no",
      "phone_number",
      "emergency_phone_number",
    ],
  });
  const [selectedFacility, setSelectedFacility] = useState<FacilityModel>({
    name: "",
  });
  const authUser = useAuthUser();
  const [diagnoses, setDiagnoses] = useState<ICD11DiagnosisModel[]>([]);
  const [showDialog, setShowDialog] = useState<"create" | "list-discharged">();
  const [showDoctors, setShowDoctors] = useState(false);
  const [phoneNumber, _setPhoneNumber] = useState("");
  const [emergencyPhoneNumber, _setEmergencyPhoneNumber] = useState("");

  const setPhoneNumber = (value: string) => {
    _setPhoneNumber(value);
    const error = PhoneNumberValidator()(value);
    if (!error) {
      updateQuery({ phone_number: value });
    }
    if ((value === "+91" || value === "") && qParams.phone_number) {
      updateQuery({ phone_number: null });
    }
  };

  const setEmergencyPhoneNumber = (value: string) => {
    _setEmergencyPhoneNumber(value);
    const error = PhoneNumberValidator()(value);
    if (!error) {
      updateQuery({ emergency_phone_number: value });
    }
    if ((value === "+91" || value === "") && qParams.emergency_phone_number) {
      updateQuery({ emergency_phone_number: null });
    }
  };

  const tabValue =
    qParams.last_consultation__new_discharge_reason ||
    qParams.is_active === "False"
      ? 1
      : 0;

  const params = {
    page: qParams.page || 1,
    limit: resultsPerPage,
    name: qParams.name || undefined,
    patient_no: qParams.patient_no || undefined,
    is_active:
      !qParams.last_consultation__new_discharge_reason &&
      (qParams.is_active || "True"),
    phone_number: qParams.phone_number
      ? parsePhoneNumber(qParams.phone_number)
      : undefined,
    emergency_phone_number: qParams.emergency_phone_number
      ? parsePhoneNumber(qParams.emergency_phone_number)
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
    ordering: qParams.ordering || undefined,
    category: qParams.category || undefined,
    gender: qParams.gender || undefined,
    age_min: qParams.age_min || undefined,
    age_max: qParams.age_max || undefined,
    date_declared_positive_before:
      qParams.date_declared_positive_before || undefined,
    date_declared_positive_after:
      qParams.date_declared_positive_after || undefined,
    ration_card_category: qParams.ration_card_category || undefined,
    last_consultation_medico_legal_case:
      qParams.last_consultation_medico_legal_case || undefined,
    last_consultation_encounter_date_before:
      qParams.last_consultation_encounter_date_before || undefined,
    last_consultation_encounter_date_after:
      qParams.last_consultation_encounter_date_after || undefined,
    last_consultation_discharge_date_before:
      qParams.last_consultation_discharge_date_before || undefined,
    last_consultation_discharge_date_after:
      qParams.last_consultation_discharge_date_after || undefined,
    last_consultation_admitted_bed_type_list:
      qParams.last_consultation_admitted_bed_type_list || undefined,
    last_consultation__consent_types:
      qParams.last_consultation__consent_types || undefined,
    last_consultation__new_discharge_reason:
      qParams.last_consultation__new_discharge_reason || undefined,
    last_consultation_current_bed__location:
      qParams.last_consultation_current_bed__location || undefined,
    number_of_doses: qParams.number_of_doses || undefined,
    covin_id: qParams.covin_id || undefined,
    is_kasp: qParams.is_kasp || undefined,
    is_declared_positive: qParams.is_declared_positive || undefined,
    last_vaccinated_date_before:
      qParams.last_vaccinated_date_before || undefined,
    last_vaccinated_date_after: qParams.last_vaccinated_date_after || undefined,
    last_consultation_is_telemedicine:
      qParams.last_consultation_is_telemedicine || undefined,
    is_antenatal: qParams.is_antenatal || undefined,
    last_menstruation_start_date_after:
      (qParams.is_antenatal === "true" &&
        dayjs().subtract(9, "month").format("YYYY-MM-DD")) ||
      undefined,
    ventilator_interface: qParams.ventilator_interface || undefined,
    diagnoses: qParams.diagnoses || undefined,
    diagnoses_confirmed: qParams.diagnoses_confirmed || undefined,
    diagnoses_provisional: qParams.diagnoses_provisional || undefined,
    diagnoses_unconfirmed: qParams.diagnoses_unconfirmed || undefined,
    diagnoses_differential: qParams.diagnoses_differential || undefined,
    review_missed: qParams.review_missed || undefined,
  };

  useEffect(() => {
    const ids: string[] = [];
    FILTER_BY_DIAGNOSES_KEYS.forEach((key) => {
      ids.push(...(qParams[key] ?? "").split(",").filter(Boolean));
    });
    const existing = diagnoses.filter(({ id }) => ids.includes(id));
    const objIds = existing.map((o) => o.id);
    const diagnosesToBeFetched = ids.filter((id) => !objIds.includes(id));
    getDiagnosesByIds(diagnosesToBeFetched).then((data) => {
      const retrieved = data.filter(Boolean) as ICD11DiagnosisModel[];
      setDiagnoses([...existing, ...retrieved]);
    });
  }, [
    qParams.diagnoses,
    qParams.diagnoses_confirmed,
    qParams.diagnoses_provisional,
    qParams.diagnoses_unconfirmed,
    qParams.diagnoses_differential,
  ]);

  const date_range_fields = [
    [params.created_date_before, params.created_date_after],
    [params.modified_date_before, params.modified_date_after],
    [params.date_declared_positive_before, params.date_declared_positive_after],
    [params.last_vaccinated_date_before, params.last_vaccinated_date_after],
    [
      params.last_consultation_encounter_date_before,
      params.last_consultation_encounter_date_after,
    ],
    [
      params.last_consultation_discharge_date_before,
      params.last_consultation_discharge_date_after,
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

  const { loading: isLoading, data } = useQuery(routes.patientList, {
    query: params,
    onResponse: () => {
      if (!params.phone_number) {
        _setPhoneNumber("+91");
      }
      if (!params.emergency_phone_number) {
        _setEmergencyPhoneNumber("+91");
      }
    },
  });

  const getTheCategoryFromId = () => {
    let category_name;
    if (qParams.category) {
      category_name = PATIENT_CATEGORIES.find(
        (item: any) => qParams.category === item.id,
      )?.text;

      return String(category_name);
    } else {
      return "";
    }
  };

  const { data: districtData } = useQuery(routes.getDistrict, {
    pathParams: {
      id: qParams.district,
    },
    prefetch: !!Number(qParams.district),
  });

  const { data: LocalBodyData } = useQuery(routes.getLocalBody, {
    pathParams: {
      id: qParams.lsgBody,
    },
    prefetch: !!Number(qParams.lsgBody),
  });

  const { data: facilityData } = useQuery(routes.getAnyFacility, {
    pathParams: {
      id: qParams.facility,
    },
    prefetch: !!qParams.facility,
  });
  const { data: facilityAssetLocationData } = useQuery(
    routes.getFacilityAssetLocation,
    {
      pathParams: {
        facility_external_id: qParams.facility,
        external_id: qParams.last_consultation_current_bed__location,
      },
      prefetch: !!qParams.last_consultation_current_bed__location,
    },
  );
  /*
  const { data: patientsWithNoConsentsData } = useQuery(routes.patientList, {
    query: {
      ...qParams,
      limit: 1,
      last_consultation__consent_types: "None",
      is_active: "True",
    },
  });

  const patientsWithNoConsents = patientsWithNoConsentsData?.count;
  */
  const { data: permittedFacilities } = useQuery(
    routes.getPermittedFacilities,
    {
      query: { limit: 1 },
    },
  );

  const LastAdmittedToTypeBadges = () => {
    const badge = (key: string, value: string | undefined, id: string) => {
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

  const HasConsentTypesBadges = () => {
    const badge = (key: string, value: string | undefined, id: string) => {
      return (
        value && (
          <FilterBadge
            name={key}
            value={value}
            onRemove={() => {
              const lcat = qParams.last_consultation__consent_types
                .split(",")
                .filter((x: string) => x != id)
                .join(",");
              updateQuery({
                ...qParams,
                last_consultation__consent_types: lcat,
              });
            }}
          />
        )
      );
    };

    return qParams.last_consultation__consent_types
      .split(",")
      .map((id: string) => {
        const text = [
          ...CONSENT_TYPE_CHOICES,
          { id: "None", text: "No Consents" },
        ].find((obj) => obj.id == id)?.text;
        return badge("Has Consent", text, id);
      });
  };

  const getDiagnosisFilterValue = (key: DiagnosesFilterKey) => {
    const ids: string[] = (qParams[key] ?? "").split(",");
    return ids.map((id) => diagnoses.find((obj) => obj.id == id)?.label ?? id);
  };

  let patientList: ReactNode[] = [];
  if (data?.count) {
    patientList = data.results.map((patient) => {
      let patientUrl = "";
      if (!isPatientMandatoryDataFilled(patient)) {
        patientUrl = `/facility/${patient.facility}/patient/${patient.id}`;
      } else if (
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

      const children = (
        <div
          className={`ring/0 hover:ring/100 group relative h-full w-full rounded-lg border border-secondary-300 bg-white p-4 pl-5 text-black transition-all duration-200 ease-in-out hover:border-secondary-400 hover:pl-5 ${categoryClass}-ring overflow-hidden`}
        >
          <div
            className={`absolute inset-y-0 left-0 flex h-full w-1 items-center rounded-l-lg transition-all duration-200 ease-in-out group-hover:w-5 ${categoryClass}`}
          >
            <span
              className={`absolute -inset-x-32 inset-y-0 flex -rotate-90 items-center justify-center text-center ${category === "Actively Dying" ? "text-[10px]" : "text-xs"} font-bold uppercase tracking-widest opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100`}
            >
              {category || "UNKNOWN"}
            </span>
          </div>
          <div className="flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full min-w-20 rounded-lg border border-secondary-300 bg-secondary-50 md:h-20 md:w-20">
              {patient?.last_consultation?.current_bed &&
              patient?.last_consultation?.discharge_date === null ? (
                <div className="tooltip flex h-full flex-col items-center justify-center">
                  <span className="w-full truncate px-1 text-center text-sm text-secondary-900">
                    {
                      patient?.last_consultation?.current_bed?.bed_object
                        ?.location_object?.name
                    }
                  </span>
                  <span className="w-full truncate px-1 text-center text-base font-bold">
                    {patient?.last_consultation?.current_bed?.bed_object?.name}
                  </span>
                  <span className="tooltip-text tooltip-bottom text-sm font-medium lg:-translate-y-1/2">
                    {
                      patient?.last_consultation?.current_bed?.bed_object
                        ?.location_object?.name
                    }
                    <br />
                    {patient?.last_consultation?.current_bed?.bed_object?.name}
                  </span>
                </div>
              ) : patient.last_consultation?.suggestion === "DC" ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="tooltip">
                    <CareIcon
                      icon="l-estate"
                      className="text-3xl text-secondary-500"
                    />
                    <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-sm font-medium">
                      Domiciliary Care
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Avatar
                    name={patient.name || ""}
                    colors={["#F9FAFB", "#BFB8CB"]}
                    className="border-0 border-b border-b-secondary-300"
                  />
                </div>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 pl-2 md:block md:flex-row">
              <div className="flex w-full items-center justify-between gap-2">
                <div
                  className="flex flex-wrap items-end gap-3 font-semibold"
                  id="patient-name-list"
                >
                  <span className="text-xl capitalize">{patient.name}</span>
                  <span className="font-bold text-secondary-700">
                    {formatPatientAge(patient, true)}
                  </span>
                </div>
              </div>

              {patient.action && patient.action != 10 && (
                <span className="text-sm font-semibold text-secondary-700">
                  {
                    TELEMEDICINE_ACTIONS.find((i) => i.id === patient.action)
                      ?.desc
                  }
                </span>
              )}

              {patient.facility_object && (
                <div className="mb-2">
                  <div className="flex flex-wrap items-center">
                    <p className="mr-2 text-sm font-medium text-secondary-700">
                      {patient.facility_object.name}
                    </p>
                    <RecordMeta
                      className="text-sm text-secondary-900"
                      prefix={
                        <span className="text-secondary-600">
                          {t("updated")}
                        </span>
                      }
                      time={patient.modified_date}
                    />
                  </div>
                </div>
              )}
              <div className="flex w-full">
                <div className="flex flex-row flex-wrap justify-start gap-2">
                  {!isPatientMandatoryDataFilled(patient) && (
                    <span className="relative inline-flex">
                      <Chip
                        size="small"
                        variant="danger"
                        startIcon="l-notes"
                        text={t("patient_details_incomplete")}
                      />
                      <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
                        <span className="center absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
                      </span>
                    </span>
                  )}

                  {isPatientMandatoryDataFilled(patient) &&
                  (!patient.last_consultation ||
                    patient.last_consultation?.facility !== patient.facility ||
                    (patient.last_consultation?.discharge_date &&
                      patient.is_active)) ? (
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
                  ) : (
                    <>
                      {patient.last_consultation?.patient_no && (
                        <Chip
                          size="small"
                          variant="primary"
                          text={`${patient.last_consultation?.suggestion === "A" ? "IP No:" : "OP No:"} ${
                            patient.last_consultation?.patient_no
                          }`}
                        />
                      )}
                    </>
                  )}
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
                  {patient.last_consultation?.is_readmission && (
                    <Chip
                      size="small"
                      variant="custom"
                      className="border-blue-600 bg-blue-100 text-blue-600"
                      startIcon="l-repeat"
                      text="Readmission"
                    />
                  )}
                  {patient.last_consultation?.suggestion === "A" &&
                    patient.last_consultation.facility === patient.facility &&
                    !patient.last_consultation.discharge_date && (
                      <Chip
                        size="small"
                        variant="primary"
                        startIcon="l-clock-three"
                        text={`IP Day No: ${dayjs().diff(patient.last_consultation.encounter_date, "day") + 1}`}
                      />
                    )}
                  {patient.gender === 2 &&
                    patient.is_antenatal &&
                    isAntenatal(patient.last_menstruation_start_date) &&
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
                  {!(
                    patient.last_consultation?.facility !== patient.facility
                  ) &&
                    !(
                      patient.last_consultation?.discharge_date ||
                      !patient.is_active
                    ) &&
                    dayjs(patient.last_consultation?.modified_date).isBefore(
                      new Date().getTime() - 24 * 60 * 60 * 1000,
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
                  {/* {!!patient.last_consultation?.has_consents.length || (
                    <span className="relative inline-flex">
                      <Chip
                        size="small"
                        variant="danger"
                        startIcon="l-file"
                        text="No consents recorded"
                      />
                      <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center">
                        <span className="center absolute inline-flex h-4 w-4 animate-ping rounded-full bg-red-400"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
                      </span>
                    </span>
                  )} */}
                </div>
              </div>
            </div>
            {patient.last_consultation?.last_daily_round
              ?.ventilator_interface &&
              patient.last_consultation?.last_daily_round
                ?.ventilator_interface !== "UNKNOWN" &&
              !patient.last_consultation?.discharge_date && (
                <div className="mb-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-600 bg-primary-100 text-xs font-semibold text-primary-600">
                  {
                    RESPIRATORY_SUPPORT.find(
                      (resp) =>
                        resp.value ===
                        patient.last_consultation?.last_daily_round
                          ?.ventilator_interface,
                    )?.id
                  }
                </div>
              )}
          </div>
        </div>
      );

      if (
        authUser.user_type === "Staff" ||
        authUser.user_type === "StaffReadOnly"
      ) {
        return children;
      }

      return (
        <Link key={`usr_${patient.id}`} data-cy="patient" href={patientUrl}>
          {children}
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
  } else if (data?.count) {
    managePatients = (
      <>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patientList}
        </div>
        <Pagination totalCount={data?.count} />
      </>
    );
  } else if (data && data.count === 0) {
    managePatients = (
      <div className="col-span-3 w-full rounded-lg bg-white p-2 py-8 pt-4 text-center">
        <p className="text-2xl font-bold text-secondary-600">
          {t("no_patients_found")}
        </p>
      </div>
    );
  }

  const queryField = <T,>(name: string, defaultValue?: T) => {
    return {
      name,
      value: qParams[name] || defaultValue,
      onChange: (e: FieldChangeEvent<T>) => updateQuery({ [e.name]: e.value }),
    };
  };

  const onlyAccessibleFacility =
    permittedFacilities?.count === 1 ? permittedFacilities.results[0] : null;

  return (
    <Page
      title={t("patients")}
      hideBack={true}
      breadcrumbs={false}
      options={
        <div className="flex w-full flex-col items-center justify-between lg:flex-row">
          <div className="mb-2 flex w-full flex-col items-center lg:mb-0 lg:w-fit lg:flex-row lg:gap-5">
            <ButtonV2
              id="add-patient-details"
              onClick={() => {
                const showAllFacilityUsers = ["DistrictAdmin", "StateAdmin"];
                if (
                  qParams.facility &&
                  showAllFacilityUsers.includes(authUser.user_type)
                )
                  navigate(`/facility/${qParams.facility}/patient`);
                else if (
                  qParams.facility &&
                  !showAllFacilityUsers.includes(authUser.user_type) &&
                  authUser.home_facility_object?.id !== qParams.facility
                )
                  Notification.Error({
                    msg: "Oops! Non-Home facility users don't have permission to perform this action.",
                  });
                else if (
                  !showAllFacilityUsers.includes(authUser.user_type) &&
                  authUser.home_facility_object?.id
                ) {
                  navigate(
                    `/facility/${authUser.home_facility_object.id}/patient`,
                  );
                } else if (onlyAccessibleFacility)
                  navigate(`/facility/${onlyAccessibleFacility.id}/patient`);
                else if (
                  !showAllFacilityUsers.includes(authUser.user_type) &&
                  !authUser.home_facility_object?.id
                )
                  Notification.Error({
                    msg: "Oops! No home facility found",
                  });
                else setShowDialog("create");
              }}
              className="w-full lg:w-fit"
            >
              <CareIcon icon="l-plus" className="text-lg" />
              <p id="add-patient-div" className="lg:my-[2px]">
                Add Patient
              </p>
            </ButtonV2>
          </div>
          <div className="flex w-full flex-col items-center justify-end flex-wrap gap-2 lg:ml-3 lg:w-fit lg:flex-row lg:gap-3">
            <Tabs
              tabs={[
                { text: t("live"), value: 0 },
                { text: t("discharged"), value: 1 },
              ]}
              onTabChange={(tab) => {
                if (tab === 0) {
                  updateQuery({ is_active: "True" });
                } else {
                  const id = qParams.facility || onlyAccessibleFacility?.id;
                  if (id) {
                    navigate(`facility/${id}/discharged-patients`);
                    return;
                  }

                  if (
                    authUser.user_type === "StateAdmin" ||
                    authUser.user_type === "StateReadOnlyAdmin"
                  ) {
                    updateQuery({ is_active: "False" });
                    return;
                  }

                  Notification.Warn({
                    msg: t("select_facility_for_discharged_patients_warning"),
                  });
                  setShowDialog("list-discharged");
                }
              }}
              currentTab={tabValue}
            />
            {!!params.facility && (
              <ButtonV2
                className="w-full lg:w-fit"
                id="doctor-connect-patient-button"
                onClick={() => {
                  triggerGoal("Doctor Connect Clicked", {
                    facilityId: qParams.facility,
                    userId: authUser.id,
                    page: "FacilityPatientsList",
                  });
                  setShowDoctors(true);
                }}
              >
                <CareIcon icon="l-phone" className="text-lg" />
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
            <div className="tooltip w-full md:w-auto" id="patient-export">
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
                  className="mr-5 w-full lg:w-fit mt-2"
                >
                  <CareIcon icon="l-export" />
                  <span className="lg:my-[3px]">Export</span>
                </ButtonV2>
              ) : (
                <ExportMenu
                  disabled={!isExportAllowed}
                  exportItems={[
                    {
                      label: "Export Live patients",
                      action: async () => {
                        const query = {
                          ...params,
                          csv: true,
                          facility: qParams.facility,
                        };
                        delete qParams.is_active;
                        const { data } = await request(routes.patientList, {
                          query,
                        });
                        return data ?? null;
                      },
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
        show={!!showDialog}
        setSelected={(e) => setSelectedFacility(e)}
        selectedFacility={selectedFacility}
        handleOk={() => {
          switch (showDialog) {
            case "create":
              navigate(`facility/${selectedFacility.id}/patient`);
              break;
            case "list-discharged":
              navigate(`facility/${selectedFacility.id}/discharged-patients`);
              break;
          }
        }}
        handleCancel={() => {
          setShowDialog(undefined);
          setSelectedFacility({ name: "" });
        }}
      />

      <div className="manualGrid my-4 mb-[-12px] mt-5 grid-cols-1 gap-3 px-2 sm:grid-cols-4 md:px-0">
        <div className="mt-2 flex h-full flex-col gap-3 xl:flex-row">
          <div className="flex-1" id="total-patientcount">
            <CountBlock
              text="Total Patients"
              count={data?.count || 0}
              loading={isLoading}
              icon="l-user-injured"
              className="pb-12"
            />
          </div>
        </div>
        <div className="col-span-3 w-full">
          <div className="mt-2">
            <div className="mb-4 mt-1 md:flex md:gap-4">
              <SearchInput
                label="Search by Patient"
                placeholder="Enter patient name"
                {...queryField("name")}
                className="w-full grow"
              />
              <SearchInput
                label="Search by IP/OP Number"
                placeholder="Enter IP/OP Number"
                secondary
                {...queryField("patient_no")}
                className="w-full grow"
              />
            </div>
            <div className="mb-4 md:flex md:gap-4">
              <PhoneNumberFormField
                label="Search by Primary Number"
                {...queryField("phone_number", "+91")}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.value)}
                types={["mobile", "landline"]}
                className="w-full grow"
                error={((phoneNumber || "+91") === "+91" && "") || undefined}
              />
              <PhoneNumberFormField
                label="Search by Emergency Number"
                {...queryField("emergency_phone_number", "+91")}
                value={emergencyPhoneNumber}
                onChange={(e) => setEmergencyPhoneNumber(e.value)}
                types={["mobile", "landline"]}
                className="w-full"
                error={
                  ((emergencyPhoneNumber || "+91") === "+91" && "") || undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-3 flex flex-wrap">
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
            badge("IP/OP number", "patient_no"),
            ...dateRange("Modified", "modified_date"),
            ...dateRange("Created", "created_date"),
            ...dateRange("Admitted", "last_consultation_encounter_date"),
            ...dateRange("Discharged", "last_consultation_discharge_date"),
            // Admitted to type badges
            badge("No. of vaccination doses", "number_of_doses"),
            kasp(),
            badge("COWIN ID", "covin_id"),
            badge("Is Antenatal", "is_antenatal"),
            badge("Review Missed", "review_missed"),
            badge(
              "Is Medico-Legal Case",
              "last_consultation_medico_legal_case",
            ),
            value(
              "Ration Card Category",
              "ration_card_category",
              qParams.ration_card_category
                ? t(`ration_card__${qParams.ration_card_category}`)
                : "",
            ),
            value(
              "Facility",
              "facility",
              qParams.facility ? facilityData?.name || "" : "",
            ),
            value(
              "Location",
              "last_consultation_current_bed__location",
              qParams.last_consultation_current_bed__location
                ? facilityAssetLocationData?.name ||
                    qParams.last_consultation_current_bed__locations
                : "",
            ),
            badge("Facility Type", "facility_type"),
            value(
              "District",
              "district",
              qParams.district ? districtData?.name || "" : "",
            ),
            ordering(),
            value("Category", "category", getTheCategoryFromId()),
            value(
              "Respiratory Support",
              "ventilator_interface",
              qParams.ventilator_interface &&
                t(`RESPIRATORY_SUPPORT_SHORT__${qParams.ventilator_interface}`),
            ),
            value(
              "Gender",
              "gender",
              parseOptionId(GENDER_TYPES, qParams.gender) || "",
            ),
            {
              name: "Admitted to",
              value: ADMITTED_TO[qParams.last_consultation_admitted_to],
              paramKey: "last_consultation_admitted_to",
            },
            ...range("Age", "age"),
            {
              name: "LSG Body",
              value: qParams.lsgBody ? LocalBodyData?.name || "" : "",
              paramKey: "lsgBody",
            },
            ...FILTER_BY_DIAGNOSES_KEYS.map((key) =>
              value(
                DIAGNOSES_FILTER_LABELS[key],
                key,
                humanizeStrings(getDiagnosisFilterValue(key)),
              ),
            ),
            badge("Declared Status", "is_declared_positive"),
            ...dateRange("Declared positive", "date_declared_positive"),
            ...dateRange("Last vaccinated", "last_vaccinated_date"),
            {
              name: "Telemedicine",
              paramKey: "last_consultation_is_telemedicine",
            },
            value(
              "Discharge Reason",
              "last_consultation__new_discharge_reason",
              parseOptionId(
                DISCHARGE_REASONS,
                qParams.last_consultation__new_discharge_reason,
              ) || "",
            ),
          ]}
          children={
            (qParams.last_consultation_admitted_bed_type_list ||
              qParams.last_consultation__consent_types) && (
              <>
                {qParams.last_consultation_admitted_bed_type_list &&
                  LastAdmittedToTypeBadges()}
                {qParams.last_consultation__consent_types &&
                  HasConsentTypesBadges()}
              </>
            )
          }
        />
      </div>
      <div>
        <PatientFilter {...advancedFilter} key={window.location.search} />
        <TabPanel value={tabValue} index={0}>
          <div className="mb-4">{managePatients}</div>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <div className="mb-4">{managePatients}</div>
        </TabPanel>
        <DoctorVideoSlideover
          facilityId={params.facility}
          show={showDoctors}
          setShow={setShowDoctors}
        />
      </div>
    </Page>
  );
};
