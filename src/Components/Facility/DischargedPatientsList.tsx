import { Link, navigate } from "raviger";
import routes from "../../Redux/api";
import Page from "../Common/components/Page";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import Loading from "../Common/Loading";
import { PatientModel } from "../Patient/models";
import useQuery from "../../Utils/request/useQuery";
import { debounce } from "lodash-es";
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
import Chip from "../../CAREUI/display/Chip";
import { useState } from "react";
import SortDropdownMenu from "../Common/SortDropdown";
import useFilters from "../../Common/hooks/useFilters";


const DischargedPatientsList = ({
  facility_external_id,
}: {
  facility_external_id: string;
}) => {
  const { t } = useTranslation();
  const facilityQuery = useQuery(routes.getAnyFacility, {
    pathParams: { id: facility_external_id },
  });


  const [search, setSearch] = useQueryParams();
  const [count, setCount] = useState<number | undefined>(undefined);
  const { qParams, updateQuery, FilterBadges } = useFilters({});

  return (
    <Page
      title={t("discharged_patients")}
      crumbsReplacements={{
        [facility_external_id]: { name: facilityQuery.data?.name },
      }}
      componentRight={
        count ? (
          <Chip
            variant="primary"
            size="small"
            text={count?.toString()}
            className="ml-2"
          />
        ) : null
      }
      options={
        <>
          <SearchInput
            className="mr-4 w-full max-w-sm"
            placeholder="Search by patient name"
            name="name"
            value={qParams.name}
            onChange={debounce((e) => updateQuery({ name: e.value }))}
          />
          <div className="flex flex-col gap-4 md:flex-row">
            <SwitchTabs
              tab1="Live"
              tab2="Discharged"
              className="mr-4"
              onClickTab1={() => navigate("/patients")}
              isTab2Active
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
      <div className="col-span-3 mt-6 flex flex-wrap">
        <FilterBadges badges={({ ordering }) => [ordering()]} />
      </div>
      <PaginatedList
        route={routes.listFacilityDischargedPatients}
        pathParams={{ facility_external_id }}
        query={{ ordering: "-modified_date", ...qParams }}
      >
        {({ data }) => {
          if (count !== data?.count) {
            setCount(data?.count);
          }
          return (
            <div className="flex flex-col gap-4 py-4 lg:px-4 lg:py-8">
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
          );
        }}
      </PaginatedList>
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
        <h2 className="text-lg font-bold text-black">{patient.name}</h2>
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
