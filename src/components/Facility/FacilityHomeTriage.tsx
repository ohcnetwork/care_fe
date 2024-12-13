import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Table from "@/components/Common/Table";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

interface FacilityHomeTriageProps {
  facilityId: string;
}

export function FacilityHomeTriage({ facilityId }: FacilityHomeTriageProps) {
  const { data } = useTanStackQueryInstead(routes.getTriage, {
    pathParams: { facilityId },
  });

  const tableRows =
    data?.results?.map((result) => [
      String(result.entry_date),
      String(result.num_patients_visited),
      String(result.num_patients_home_quarantine),
      String(result.num_patients_isolation),
      String(result.num_patient_referred),
      String(result.num_patient_confirmed_positive),
      <ButtonV2
        key={result.id}
        id="edit-button"
        variant="secondary"
        ghost
        border
        onClick={() => navigate(`/facility/${facilityId}/triage/${result.id}`)}
        authorizeFor={NonReadOnlyUsers}
      >
        Edit
      </ButtonV2>,
    ]) ?? [];

  const tableHeadings = [
    "Date",
    "Total Triaged",
    "Advised Home Quarantine",
    "Suspects Isolated",
    "Referred",
    "Confirmed positives",
    "Actions",
  ];

  return (
    <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
      <div className="-my-2 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="justify-between md:flex md:pb-2">
          <div className="mb-2 text-xl font-bold">Corona Triage</div>
          <ButtonV2
            id="add-facility-triage"
            className="w-full md:w-auto"
            onClick={() => navigate(`/facility/${facilityId}/triage`)}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon
              icon="l-book-medical"
              className="mr-2 text-base text-white"
            />
            Add Triage
          </ButtonV2>
        </div>

        <div
          className="mt-4 overflow-x-auto overflow-y-hidden"
          id="triage-table"
        >
          <Table rows={tableRows} headings={tableHeadings} />

          {tableRows.length === 0 && (
            <>
              <hr />
              <div className="mt-3 flex min-w-[1000px] items-center justify-center rounded-sm border border-[#D2D6DC] p-4 text-xl font-bold text-secondary-600">
                No Data Found
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
