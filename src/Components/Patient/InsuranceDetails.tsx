import { lazy } from "react";

import Page from "../Common/components/Page";

import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { HCXPolicyModel } from "../HCX/models";

const Loading = lazy(() => import("../Common/Loading"));

interface IProps {
  facilityId: string;
  id: string;
}

export const InsuranceDetails = (props: IProps) => {
  const { facilityId, id } = props;

  const { data: insuranceDetials, loading } = useQuery(routes.listHCXPolicies, {
    query: {
      patient: id,
    },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <Page
      title="Insurance Details"
      crumbsReplacements={{
        [facilityId]: {
          name: insuranceDetials?.results[0]?.patient_object?.facility_object
            ?.name,
        },
        [id]: {
          name: insuranceDetials?.results[0]?.patient_object?.name,
        },
      }}
      className="w-full overflow-x-hidden"
    >
      {loading ? (
        <Loading />
      ) : insuranceDetials?.count === 0 ? (
        <div className="mt-5 flex w-full items-center justify-center text-xl font-bold text-gray-500">
          No Insurance Details Available
        </div>
      ) : (
        <section
          className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3"
          data-testid="patient-details"
        >
          {insuranceDetials?.results.map((data: HCXPolicyModel) => (
            <div className="w-full" key={data.id}>
              <div className="h-full space-y-2 rounded-lg bg-white p-7 shadow">
                <div className="border-b border-dashed pb-2 text-xl font-bold text-gray-900">
                  Policy Details
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-2">
                  <div className=" ">
                    <div className="text-sm font-semibold leading-5 text-zinc-400">
                      Member ID
                    </div>
                    <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                      {data.subscriber_id || ""}
                    </div>
                  </div>
                  <div className=" ">
                    <div className="text-sm font-semibold leading-5 text-zinc-400">
                      Policy ID / Policy Name
                    </div>
                    <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                      {data.policy_id || ""}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-semibold leading-5 text-zinc-400">
                      Insurer ID
                    </div>
                    <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                      {data.insurer_id || ""}
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <div className="text-sm font-semibold leading-5 text-zinc-400">
                      Insurer Name
                    </div>
                    <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                      {data.insurer_name || ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </Page>
  );
};
