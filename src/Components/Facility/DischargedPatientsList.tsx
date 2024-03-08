import { Link, useQueryParams } from "raviger";
import routes from "../../Redux/api";
import Page from "../Common/components/Page";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import Loading from "../Common/Loading";
import { PatientModel } from "../Patient/models";
import useQuery from "../../Utils/request/useQuery";
import { debounce } from "lodash-es";
import SearchInput from "../Form/SearchInput";
import { formatAge } from "../../Utils/utils";
import { GENDER_TYPES } from "../../Common/constants";
import CareIcon from "../../CAREUI/icons/CareIcon";
import RecordMeta from "../../CAREUI/display/RecordMeta";

const DischargedPatientsList = ({
  facility_external_id,
}: {
  facility_external_id: string;
}) => {
  const facilityQuery = useQuery(routes.getAnyFacility, {
    pathParams: { id: facility_external_id },
  });

  const [search, setSearch] = useQueryParams();

  return (
    <Page
      title="Discharged Patients"
      crumbsReplacements={{
        [facility_external_id]: { name: facilityQuery.data?.name },
      }}
      options={
        <SearchInput
          className="mr-4 w-full max-w-md"
          placeholder="Search by patient name"
          name="name"
          value={search.name}
          onChange={debounce((e) => setSearch({ [e.name]: e.value }), 300)}
        />
      }
    >
      <PaginatedList
        route={routes.listFacilityDischargedPatients}
        pathParams={{ facility_external_id }}
        query={search}
      >
        {() => (
          <div className="flex flex-col gap-4 p-4">
            <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
              <span>No dischaged patients present in this facility</span>
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
          {formatAge(patient.age, patient.date_of_birth)}
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
