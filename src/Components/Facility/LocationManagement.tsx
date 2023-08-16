import loadable from "@loadable/component";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
const Loading = loadable(() => import("../Common/Loading"));

interface LocationRowProps {
  id: string;
  facilityId: string;
  name: string;
  description: string;
}

const LocationRow = (props: LocationRowProps) => {
  const { id, facilityId, name, description } = props;

  return (
    <div
      key={id}
      className="w-full items-center justify-between border-b py-4 lg:flex"
    >
      <div className="px-4 lg:w-3/4">
        <div className="w-full items-baseline lg:flex">
          <p className="break-words text-xl lg:mr-4 lg:w-1/4">{name}</p>
          <p className="break-all text-sm lg:w-3/4">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:flex-row">
        <ButtonV2
          variant="secondary"
          border
          className="w-full lg:w-auto"
          href={`/facility/${facilityId}/location/${id}/update`}
          authorizeFor={NonReadOnlyUsers}
        >
          <CareIcon className="care-l-pen text-lg" />
          Edit
        </ButtonV2>
        <ButtonV2
          variant="secondary"
          border
          className="w-full lg:w-auto"
          href={`/facility/${facilityId}/location/${id}/beds`}
        >
          <CareIcon className="care-l-bed text-lg" />
          Manage Beds
        </ButtonV2>
      </div>
    </div>
  );
};

export const LocationManagement = ({ facilityId }: { facilityId: string }) => {
  const { data, loading } = useQuery(routes.listFacilityAssetLocation, {
    query: { limit: "14", offset: "0" },
    pathParams: { facility_external_id: facilityId },
  });

  console.log(data);

  if (loading) {
    return <Loading />;
  }

  return (
    <Page
      title="Location Management"
      crumbsReplacements={{
        [facilityId]: { name: data?.results[0]?.facility?.name || "" },
      }}
      backUrl={`/facility/${facilityId}`}
    >
      <div className="container mx-auto px-4 py-2 sm:px-8">
        <div className="flex justify-end">
          <ButtonV2
            href={`/facility/${facilityId}/location/add`}
            // hello
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon className="care-l-plus text-lg" />
            Add New Location
          </ButtonV2>
        </div>

        {loading ? (
          <Loading />
        ) : data?.results.length ? (
          <div className="mt-5 flex grow flex-wrap bg-white p-4">
            {data?.results.map((item) => (
              <LocationRow
                key={item.id}
                id={item.id || ""}
                facilityId={facilityId}
                name={item.name || ""}
                description={item.description || ""}
              />
            ))}
          </div>
        ) : (
          <p className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
            No locations available
          </p>
        )}
      </div>
    </Page>
  );
};
