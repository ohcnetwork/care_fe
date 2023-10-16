import { lazy } from "react";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
import routes from "../../Redux/api";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import { LocationModel } from "./models";

const Loading = lazy(() => import("../Common/Loading"));

interface Props {
  facilityId: string;
}

export default function LocationManagement({ facilityId }: Props) {
  return (
    <PaginatedList
      route={routes.listFacilityAssetLocation}
      pathParams={{ facility_external_id: facilityId }}
    >
      {() => (
        <Page
          title="Location Management"
          backUrl={`/facility/${facilityId}`}
          options={
            <ButtonV2
              href={`/facility/${facilityId}/location/add`}
              authorizeFor={NonReadOnlyUsers}
              className="mr-8 hidden lg:block"
            >
              <CareIcon icon="l-plus" className="text-lg" />
              Add New Location
            </ButtonV2>
          }
        >
          <div className="mx-auto">
            <ButtonV2
              href={`/facility/${facilityId}/location/add`}
              authorizeFor={NonReadOnlyUsers}
              className="w-full lg:hidden"
            >
              <CareIcon icon="l-plus" className="text-lg" />
              Add New Location
            </ButtonV2>
          </div>
          <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
            <span>No locations available</span>
          </PaginatedList.WhenEmpty>

          <PaginatedList.WhenLoading>
            <Loading />
          </PaginatedList.WhenLoading>

          <PaginatedList.Items<LocationModel> className="my-8 flex grow flex-col gap-3 lg:mx-8">
            {(item) => <Location {...item} />}
          </PaginatedList.Items>

          <div className="flex w-full items-center justify-center">
            <PaginatedList.Paginator hideIfSinglePage />
          </div>
        </Page>
      )}
    </PaginatedList>
  );
}

const Location = ({
  name,
  description,
  middleware_address,
  id,
}: LocationModel) => (
  <div className="w-full items-center justify-between rounded border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-400 lg:flex">
    <div className="lg:w-3/4">
      <div className="w-full items-baseline gap-4 lg:flex lg:items-center">
        <p className="break-words text-xl lg:mr-4 lg:w-3/4">
          {name}
          <p className="break-all text-sm text-gray-700">
            {description || "-"}
          </p>
        </p>
        <p className="break-all text-sm lg:mr-4 lg:w-3/4">
          {middleware_address}
        </p>
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:flex-row">
      <ButtonV2
        variant="secondary"
        border
        className="w-full lg:w-auto"
        href={`location/${id}/update`}
        authorizeFor={NonReadOnlyUsers}
      >
        <CareIcon className="care-l-pen text-lg" />
        Edit
      </ButtonV2>
      <ButtonV2
        variant="secondary"
        border
        className="w-full lg:w-auto"
        href={`location/${id}/beds`}
      >
        <CareIcon className="care-l-bed text-lg" />
        Manage Beds
      </ButtonV2>
    </div>
  </div>
);
