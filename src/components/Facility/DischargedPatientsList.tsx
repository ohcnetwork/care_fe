import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import FilterBadge from "@/CAREUI/display/FilterBadge";
import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import SortDropdownMenu from "@/components/Common/SortDropdown";
import Tabs from "@/components/Common/Tabs";
import { getDiagnosesByIds } from "@/components/Diagnosis/utils";
import { ICD11DiagnosisModel } from "@/components/Facility/models";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import SearchInput from "@/components/Form/SearchInput";
import {
  DIAGNOSES_FILTER_LABELS,
  DiagnosesFilterKey,
  FILTER_BY_DIAGNOSES_KEYS,
} from "@/components/Patient/DiagnosesFilter";
import PatientFilter from "@/components/Patient/PatientFilter";
import { PatientModel } from "@/components/Patient/models";

import useFilters from "@/hooks/useFilters";

import {
  ADMITTED_TO,
  CONSENT_TYPE_CHOICES,
  DISCHARGED_PATIENT_SORT_OPTIONS,
  DISCHARGE_REASONS,
  GENDER_TYPES,
  PATIENT_CATEGORIES,
} from "@/common/constants";
import { parseOptionId } from "@/common/utils";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import {
  formatPatientAge,
  humanizeStrings,
  parsePhoneNumber,
} from "@/Utils/utils";

import ButtonV2 from "../Common/ButtonV2";
import ExportMenu from "../Common/Export";

const DischargedPatientsList = ({
  facility_external_id,
}: {
  facility_external_id: string;
}) => {
  const { t } = useTranslation();
  const facilityQuery = useQuery(routes.getAnyFacility, {
    pathParams: { id: facility_external_id },
  });

  const {
    qParams,
    updateQuery,
    advancedFilter,
    FilterBadges,
    resultsPerPage,
    updatePage,
  } = useFilters({
    limit: 12,
    cacheBlacklist: [
      "name",
      "patient_no",
      "phone_number",
      "emergency_phone_number",
    ],
  });

  const params = {
    page: qParams.page || 1,
    limit: resultsPerPage,
    name: qParams.name || undefined,
    patient_no: qParams.patient_no || undefined,
    is_active:
      !qParams.last_consultation__new_discharge_reason &&
      (qParams.is_active || "False"),
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
    if (!qParams.phone_number && phone_number.length >= 13) {
      setPhoneNumber("+91");
    }
    if (
      !qParams.emergency_phone_number &&
      emergency_phone_number.length >= 13
    ) {
      setEmergencyPhoneNumber("+91");
    }
  }, [qParams]);

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
    if ((field[0] && !field[1]) || (!field[0] && field[1])) {
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
      const mergedPolicyId = indexes
        .map((currentIndex: number) => lines[currentIndex].split(",")[5])
        .join(";");
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

  const getDiagnosisFilterValue = (key: DiagnosesFilterKey) => {
    const ids: string[] = (qParams[key] ?? "").split(",");
    return ids.map((id) => diagnoses.find((obj) => obj.id == id)?.label ?? id);
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

  const HasConsentTypesBadges = () => {
    const badge = (key: string, value: any, id: string) => {
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

  const queryField = <T,>(name: string, defaultValue?: T) => {
    return {
      name,
      value: qParams[name] || defaultValue,
      onChange: (e: FieldChangeEvent<T>) => updateQuery({ [e.name]: e.value }),
      className: "grow w-full mb-2",
    };
  };
  const [diagnoses, setDiagnoses] = useState<ICD11DiagnosisModel[]>([]);
  const [phone_number, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [emergency_phone_number, setEmergencyPhoneNumber] = useState("");
  const [emergencyPhoneNumberError, setEmergencyPhoneNumberError] =
    useState("");
  const [count, setCount] = useState(0);

  const setPhoneNum = (phone_number: string) => {
    setPhoneNumber(phone_number);
    if (phone_number.length >= 13) {
      setPhoneNumberError("");
      updateQuery({ phone_number });
      return;
    }

    if (phone_number === "+91" || phone_number === "") {
      setPhoneNumberError("");
      qParams.phone_number && updateQuery({ phone_number: null });
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
      qParams.emergency_phone_number &&
        updateQuery({ emergency_phone_number: null });
      return;
    }

    setEmergencyPhoneNumberError("Enter a valid number");
  };

  return (
    <Page
      title={t("discharged_patients")}
      crumbsReplacements={{
        [facility_external_id]: { name: facilityQuery.data?.name },
      }}
      options={
        <>
          <div className="flex flex-col gap-4 lg:flex-row">
            <Tabs
              tabs={[
                { text: "Live", value: 0 },
                { text: "Discharged", value: 1 },
              ]}
              className="mr-4"
              onTabChange={() => navigate("/patients")}
              currentTab={1}
            />
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
            <SortDropdownMenu
              options={DISCHARGED_PATIENT_SORT_OPTIONS}
              selected={qParams.ordering}
              onSelect={(e) => updateQuery({ ordering: e.ordering })}
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
                  className="mr-5 w-full lg:w-fit"
                >
                  <CareIcon icon="l-export" />
                  <span className="lg:my-[3px]">Export</span>
                </ButtonV2>
              ) : (
                <ExportMenu
                  disabled={!isExportAllowed}
                  exportItems={[
                    {
                      label: "Export Discharged patients",
                      action: async () => {
                        const query = {
                          ...qParams,
                          csv: true,
                        };
                        const pathParams = { facility_external_id };
                        const { data } = await request(
                          routes.listFacilityDischargedPatients,
                          {
                            query,
                            pathParams,
                          },
                        );
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
        </>
      }
    >
      <div className="manualGrid my-4 mb-[-12px] mt-5 grid-cols-1 gap-3 px-2 sm:grid-cols-4 md:px-0">
        <div className="mt-2 flex h-full flex-col gap-3 xl:flex-row">
          <div className="flex-1">
            <CountBlock
              text="Discharged Patients"
              count={count}
              loading={facilityQuery.loading}
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
                {...queryField("patient_no")}
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
            badge("Disease Status", "disease_status"),
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
            badge("SRF ID", "srf_id"),
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
            ...dateRange("Result", "date_of_result"),
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
      <PaginatedList
        perPage={12}
        route={routes.listFacilityDischargedPatients}
        pathParams={{ facility_external_id }}
        query={{ ordering: "-modified_date", ...qParams }}
        queryCB={(query) => setCount(query.data?.count || 0)}
        initialPage={qParams.page}
        onPageChange={updatePage}
      >
        {() => (
          <div className="flex flex-col gap-4">
            <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
              <span>{t("discharged_patients_empty")}</span>
            </PaginatedList.WhenEmpty>

            <PaginatedList.WhenLoading>
              <Loading />
            </PaginatedList.WhenLoading>

            <PaginatedList.Items<PatientModel> className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(patient) => (
                <Link
                  key={patient.id}
                  href={`/facility/${facility_external_id}/patient/${patient.id}`}
                  className="text-black"
                >
                  <PatientListItem patient={patient} />
                </Link>
              )}
            </PaginatedList.Items>

            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        )}
      </PaginatedList>
      <PatientFilter
        {...advancedFilter}
        key={window.location.search}
        dischargePage
      />
    </Page>
  );
};

export default DischargedPatientsList;

const PatientListItem = ({ patient }: { patient: PatientModel }) => {
  return (
    <div className="flex rounded-lg border bg-white p-5 shadow hover:ring-1 hover:ring-primary-400">
      <div className="flex rounded border border-secondary-300 bg-secondary-50 p-6">
        <CareIcon
          icon="l-user-injured"
          className="text-3xl text-secondary-800"
        />
      </div>
      <div className="ml-5 flex flex-col">
        <h2 className="text-lg font-bold capitalize text-black">
          {patient.name}
        </h2>
        <span className="text-sm font-medium text-secondary-800">
          {GENDER_TYPES.find((g) => g.id === patient.gender)?.text} -{" "}
          {formatPatientAge(patient)}
        </span>
        {patient.last_consultation?.patient_no && (
          <span className="text-sm font-medium text-secondary-800">
            {patient.last_consultation?.suggestion === "A"
              ? "IP No: "
              : "OP No: "}
            {patient.last_consultation?.patient_no}
          </span>
        )}
        <div className="flex-1" />
        <RecordMeta
          className="text-end text-xs text-secondary-600"
          prefix="last updated"
          time={patient.modified_date}
        />
      </div>
    </div>
  );
};
