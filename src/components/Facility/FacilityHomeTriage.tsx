import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Table from "@/components/Common/Table";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export const FacilityHomeTriage = (props: any) => {
  const triageQuery = useQuery(routes.getTriage, {
    pathParams: { facilityId: props.facilityId },
  });

  const stats: (string | JSX.Element)[][] = [];
  for (
    let i = 0;
    triageQuery.data?.results && i < triageQuery.data.results.length;
    i++
  ) {
    const temp: (string | JSX.Element)[] = [];
    temp.push(String(triageQuery.data.results[i].entry_date) || "0");
    temp.push(String(triageQuery.data.results[i].num_patients_visited) || "0");
    temp.push(
      String(triageQuery.data.results[i].num_patients_home_quarantine) || "0",
    );
    temp.push(
      String(triageQuery.data.results[i].num_patients_isolation) || "0",
    );
    temp.push(String(triageQuery.data.results[i].num_patient_referred) || "0");
    temp.push(
      String(triageQuery.data.results[i].num_patient_confirmed_positive) || "0",
    );
    temp.push(
      <ButtonV2
        id="edit-button"
        variant="secondary"
        ghost
        border
        onClick={() =>
          navigate(
            `/facility/${props.facilityId}/triage/${triageQuery.data?.results[i].id}`,
          )
        }
        authorizeFor={props.NonReadOnlyUsers}
      >
        Edit
      </ButtonV2>,
    );
    stats.push(temp);
  }

  return (
    <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
      <div className="-my-2 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="justify-between md:flex md:pb-2">
          <div className="mb-2 text-xl font-bold">Corona Triage</div>
          <ButtonV2
            id="add-facility-triage"
            className="w-full md:w-auto"
            onClick={() => navigate(`/facility/${props.facilityId}/triage`)}
            authorizeFor={props.NonReadOnlyUsers}
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
          <Table
            rows={stats}
            headings={[
              "Date",
              "Total Triaged",
              "Advised Home Quarantine",
              "Suspects Isolated",
              "Referred",
              "Confirmed positives",
              "Actions",
            ]}
          />
          {stats.length === 0 && (
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
};
