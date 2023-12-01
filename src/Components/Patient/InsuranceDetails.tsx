import { lazy } from "react";

import Page from "../Common/components/Page";

import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { HCXPolicyModel } from "../HCX/models";
import { InsuranceDetialsCard } from "./InsuranceDetailsCard";

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
            <InsuranceDetialsCard data={data} />
          ))}
        </section>
      )}
    </Page>
  );
};
