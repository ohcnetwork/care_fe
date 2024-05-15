import { Link, navigate } from "raviger";
import routes from "../../Redux/api";
import Page from "../Common/components/Page";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import Loading from "../Common/Loading";
import { PatientModel } from "../Patient/models";
import useQuery from "../../Utils/request/useQuery";
import SearchInput from "../Form/SearchInput";
import {
  DISCHARGED_PATIENT_SORT_OPTIONS,
  GENDER_TYPES,
} from "../../Common/constants";
import CareIcon from "../../CAREUI/icons/CareIcon";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { formatPatientAge } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import SwitchTabs from "../Common/components/SwitchTabs";
import SortDropdownMenu from "../Common/SortDropdown";
import useFilters from "../../Common/hooks/useFilters";
import PatientFilter from "../Patient/PatientFilter";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CountBlock from "../../CAREUI/display/Count";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { useState } from "react";
import { parseOptionId } from "../../Common/utils";

const DischargedPatientsList = ({
  facility_external_id,
}: {
  facility_external_id: string;
}) => {
  const { t } = useTranslation();
  const facilityQuery = useQuery(routes.getAnyFacility, {
    pathParams: { id: facility_external_id },
  });

  const { qParams, updateQuery, advancedFilter, FilterBadges } = useFilters({
    limit: 12,
    cacheBlacklist: [
      "name",
      "patient_no",
      "phone_number",
      "emergency_phone_number",
    ],
  });

  const queryField = <T,>(name: string, defaultValue?: T) => {
    return {
      name,
      value: qParams[name] || defaultValue,
      onChange: (e: FieldChangeEvent<T>) => updateQuery({ [e.name]: e.value }),
      className: "grow w-full mb-2",
    };
  };

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
            <SwitchTabs
              tab1="Live"
              tab2="Discharged"
              className="mr-4"
              onClickTab1={() => navigate("/patients")}
              isTab2Active
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
            badge("No. of vaccination doses", "number_of_doses"),
            kasp(),
            badge("COWIN ID", "covin_id"),
            badge("Is Antenatal", "is_antenatal"),
            badge("Review Missed", "review_missed"),
            badge("Facility Type", "facility_type"),
            ordering(),
            badge("Disease Status", "disease_status"),
            value(
              "Respiratory Support",
              "ventilator_interface",
              qParams.ventilator_interface &&
                t(`RESPIRATORY_SUPPORT_${qParams.ventilator_interface}`),
            ),
            value(
              "Gender",
              "gender",
              parseOptionId(GENDER_TYPES, qParams.gender) || "",
            ),
            ...range("Age", "age"),
            badge("SRF ID", "srf_id"),
            badge("Declared Status", "is_declared_positive"),
            ...dateRange("Result", "date_of_result"),
            ...dateRange("Declared positive", "date_declared_positive"),
            ...dateRange("Last vaccinated", "last_vaccinated_date"),
          ]}
        />
      </div>
      <PaginatedList
        perPage={12}
        route={routes.listFacilityDischargedPatients}
        pathParams={{ facility_external_id }}
        query={{ ordering: "-modified_date", ...qParams }}
        queryCB={(query) => {
          setCount(query.data?.count || 0);
        }}
      >
        {() => (
          <div className="flex flex-col gap-4">
            <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
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
      <div className="flex rounded border border-gray-300 bg-gray-50 p-6">
        <CareIcon icon="l-user-injured" className="text-3xl text-gray-800" />
      </div>
      <div className="ml-5 flex flex-col">
        <h2 className="text-lg font-bold capitalize text-black">
          {patient.name}
        </h2>
        <span className="text-sm font-medium text-gray-800">
          {GENDER_TYPES.find((g) => g.id === patient.gender)?.text} -{" "}
          {formatPatientAge(patient)}
        </span>
        <div className="flex-1" />
        <RecordMeta
          className="text-end text-xs text-gray-600"
          prefix="last updated"
          time={patient.modified_date}
        />
      </div>
    </div>
  );
};
