import { lazy } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import routes from "../../Redux/api";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import ButtonV2 from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
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
  duty_staff_objects,
}: LocationModel) => {
  const doctors =
    duty_staff_objects?.filter((u) => u.user_type === "Doctor") || [];
  const staffs =
    duty_staff_objects?.filter((u) => u.user_type === "Staff") || [];
  return (
    <div className="w-full items-center justify-between rounded border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-400 lg:flex">
      <div className="lg:w-3/4">
        <div className="w-full items-baseline space-y-2 lg:flex lg:space-x-2">
          <p className="break-words text-sm lg:mr-4 lg:w-1/6">{name}</p>
          <p className="break-all text-sm lg:w-1/2">{description}</p>
          <p className="break-all text-sm lg:w-1/2">{middleware_address}</p>
          <p className="flex flex-col gap-y-2 text-sm lg:w-1/6">
            {doctors.map((doctor) => (
              <div className="flex w-full rounded-lg border border-primary-600 bg-primary-100 px-3 py-1 text-primary-900">
                <CareIcon className="care-l-user-md" />
                <div className="ml-3">{`${doctor.first_name} ${doctor.last_name}`}</div>
              </div>
            ))}
          </p>
          <p className="flex flex-col gap-y-2 text-sm lg:w-1/6">
            {staffs.map((s) => (
              <div className="flex w-full rounded-lg border border-primary-600 bg-primary-100 px-3 py-1 text-primary-900">
                <CareIcon className="care-l-user-nurse" />
                <div className="ml-3">{`${s.first_name} ${s.last_name}`}</div>
              </div>
            ))}
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
};
