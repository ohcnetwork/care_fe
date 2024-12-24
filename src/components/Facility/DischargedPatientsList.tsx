import { Link, navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import FilterBadge from "@/CAREUI/display/FilterBadge";
import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import SortDropdownMenu from "@/components/Common/SortDropdown";
import Tabs from "@/components/Common/Tabs";
import { getDiagnosesByIds } from "@/components/Diagnosis/utils";
import { ICD11DiagnosisModel } from "@/components/Facility/models";
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

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatPatientAge, humanizeStrings } from "@/Utils/utils";

const DischargedPatientsList = ({
  facility_external_id,
}: {
  facility_external_id: string;
}) => {
  const { t } = useTranslation();
  const facilityQuery = useTanStackQueryInstead(routes.getAnyFacility, {
    pathParams: { id: facility_external_id },
  });

  const {
    qParams,
    updateQuery,
    advancedFilter,
    FilterBadges,
    updatePage,
    clearSearch,
  } = useFilters({
    limit: 12,
    cacheBlacklist: [
      "name",
      "patient_no",
      "phone_number",
      "emergency_phone_number",
    ],
  });

  const searchOptions = [
    {
      key: "name",
      label: "Name",
      type: "text" as const,
      placeholder: "search_by_patient_name",
      value: qParams.name || "",
      shortcutKey: "n",
    },
    {
      key: "patient_no",
      label: "IP/OP No",
      type: "text" as const,
      placeholder: "search_by_patient_no",
      value: qParams.patient_no || "",
      shortcutKey: "u",
    },
    {
      key: "phone_number",
      label: "Phone Number",
      type: "phone" as const,
      placeholder: "Search_by_phone_number",
      value: qParams.phone_number || "",
      shortcutKey: "p",
    },
    {
      key: "emergency_contact_number",
      label: "Emergency Contact Phone Number",
      type: "phone" as const,
      placeholder: "search_by_emergency_phone_number",
      value: qParams.emergency_phone_number || "",
      shortcutKey: "e",
    },
  ];

  const handleSearch = useCallback(
    (key: string, value: string) => {
      const isValidPhoneNumber = (val: string) =>
        val.length >= 13 || val === "";

      const updatedQuery = {
        phone_number:
          key === "phone_number" && isValidPhoneNumber(value)
            ? value
            : undefined,
        name: key === "name" ? value : undefined,
        patient_no: key === "patient_no" ? value : undefined,
        emergency_phone_number:
          key === "emergency_contact_number" && isValidPhoneNumber(value)
            ? value
            : undefined,
      };
      updateQuery(updatedQuery);
    },
    [updateQuery],
  );

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

  const { data: districtData } = useTanStackQueryInstead(routes.getDistrict, {
    pathParams: {
      id: qParams.district,
    },
    prefetch: !!Number(qParams.district),
  });

  const { data: LocalBodyData } = useTanStackQueryInstead(routes.getLocalBody, {
    pathParams: {
      id: qParams.lsgBody,
    },
    prefetch: !!Number(qParams.lsgBody),
  });

  const { data: facilityAssetLocationData } = useTanStackQueryInstead(
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

  const [diagnoses, setDiagnoses] = useState<ICD11DiagnosisModel[]>([]);
  const [phone_number, setPhoneNumber] = useState("");
  const [emergency_phone_number, setEmergencyPhoneNumber] = useState("");
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
          </div>
        </>
      }
    >
      <div className="mt-4 gap-4 lg:gap-16 flex flex-col lg:flex-row lg:items-center">
        <div id="total-patientcount">
          <CountBlock
            text={t("total_patients")}
            count={count || 0}
            loading={isLoading}
            icon="d-patient"
          />
        </div>
        <SearchByMultipleFields
          id="patient-search"
          options={searchOptions}
          onSearch={handleSearch}
          clearSearch={clearSearch}
          className="w-full"
        />
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
        queryCB={(query) => {
          setCount(query.data?.count || 0);
          setIsLoading(query.loading);
        }}
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
