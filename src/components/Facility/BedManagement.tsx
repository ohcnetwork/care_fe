import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import BedDeleteDialog from "@/components/Facility/BedDeleteDialog";
import { BedModel } from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import { LOCATION_BED_TYPES } from "@/common/constants";

import AuthorizeFor, { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

interface BedManagementProps {
  facilityId: string;
  locationId: string;
}

interface BedRowProps {
  id: string;
  facilityId: string;
  name: string;
  description: string;
  bedType: string;
  triggerRerender: () => void;
  locationId: string;
  isOccupied: boolean;
}

const BedCard = ({
  id,
  facilityId,
  name,
  description,
  triggerRerender,
  locationId,
  bedType,
  isOccupied,
}: BedRowProps) => {
  const [bedData, setBedData] = useState<{
    show: boolean;
    name: string;
  }>({ show: false, name: "" });
  const authUser = useAuthUser();
  const handleDelete = (name: string, _id: string) => {
    setBedData({
      show: true,
      name,
    });
  };
  const { t } = useTranslation();

  const allowedUser = ["DistrictAdmin", "StateAdmin"].includes(
    authUser.user_type,
  );

  const handleDeleteConfirm = async () => {
    const { res } = await request(routes.deleteFacilityBed, {
      pathParams: { external_id: id },
    });
    if (res?.ok) {
      Notification.Success({ msg: "Bed deleted successfully" });
    }
    setBedData({ show: false, name: "" });
    triggerRerender();
  };

  const handleDeleteCancel = () => {
    setBedData({ show: false, name: "" });
  };

  return (
    <>
      <BedDeleteDialog
        name={bedData.name}
        show={bedData.show}
        handleCancel={handleDeleteCancel}
        handleOk={handleDeleteConfirm}
      />
      <div className="flex h-full w-full flex-col rounded border border-secondary-300 bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-400">
        <div className="flex-1">
          <div className="flex w-full flex-col items-start justify-between gap-2">
            <div>
              <p
                className="inline break-words text-xl capitalize"
                id="view-bed-name"
              >
                {name}
              </p>
            </div>
            <div id="view-bedbadges">
              {LOCATION_BED_TYPES.find((item) => item.id === bedType) && (
                <p className="mb-1 inline-flex w-fit items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium capitalize leading-5 text-blue-800">
                  {LOCATION_BED_TYPES.find(
                    (item) => item.id === bedType,
                  )?.name?.slice(0, 25) + (bedType.length > 25 ? "..." : "")}
                </p>
              )}
              <p
                className={`${
                  isOccupied
                    ? "bg-warning-100 text-warning-600"
                    : "bg-primary-100 text-primary-600"
                } mb-1 ml-1 inline-flex w-fit items-center rounded-md px-2.5 py-0.5 text-sm font-medium capitalize leading-5`}
              >
                {isOccupied ? t("occupied") : t("vacant")}
              </p>
            </div>
          </div>
          {description && (
            <p
              className="... my-3 truncate break-all text-sm font-medium text-secondary-700"
              id="view-bed-description"
            >
              {description}
            </p>
          )}
        </div>

        <div className="mt-2 flex w-full flex-col gap-2 md:flex-row">
          <div className="w-full md:w-1/2">
            <ButtonV2
              id="edit-bed-button"
              href={`/facility/${facilityId}/location/${locationId}/beds/${id}/update`}
              authorizeFor={NonReadOnlyUsers}
              variant="secondary"
              border
              className="w-full"
            >
              <CareIcon icon="l-pen" className="text-lg" />
              {t("edit")}
            </ButtonV2>
          </div>
          <div className="w-full md:w-1/2">
            <ButtonV2
              id="delete-bed-button"
              onClick={() => handleDelete(name, id)}
              authorizeFor={AuthorizeFor(["DistrictAdmin", "StateAdmin"])}
              variant="secondary"
              border
              className="w-full"
              tooltip={
                !allowedUser
                  ? "Contact your admin to delete the bed"
                  : isOccupied
                    ? "Bed is occupied"
                    : undefined
              }
              tooltipClassName=" text-xs w-full lg:w-auto"
            >
              <CareIcon icon="l-trash" className="text-lg" />
              {t("delete")}
            </ButtonV2>
          </div>
        </div>
      </div>
    </>
  );
};

export const BedManagement = (props: BedManagementProps) => {
  const { facilityId, locationId } = props;
  const { qParams, resultsPerPage } = useFilters({ limit: 16 });
  const { t } = useTranslation();

  const { data: location } = useQuery(routes.getFacilityAssetLocation, {
    pathParams: {
      facility_external_id: facilityId,
      external_id: locationId,
    },
  });

  return (
    <PaginatedList
      route={routes.listFacilityBeds}
      pathParams={{ facility_external_id: facilityId }}
      perPage={resultsPerPage}
      query={{
        facility: facilityId,
        location: locationId,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
      }}
    >
      {({ refetch }) => (
        <Page
          title="Bed Management"
          crumbsReplacements={{
            [facilityId]: { name: location?.facility?.name },
            [locationId]: {
              name: location?.name,
              uri: `/facility/${facilityId}/location`,
            },
          }}
          options={
            <ButtonV2
              id="add-new-bed"
              href={`/facility/${facilityId}/location/${locationId}/beds/add`}
              authorizeFor={NonReadOnlyUsers}
              className="hidden lg:block"
            >
              <CareIcon icon="l-plus" className="text-lg" />
              {t("add_new_beds")}
            </ButtonV2>
          }
          backUrl={`/facility/${facilityId}/location/${locationId}`}
        >
          <div className="mx-auto mt-4 lg:mt-0">
            <ButtonV2
              id="add-new-bed"
              href={`/facility/${facilityId}/location/${locationId}/beds/add`}
              authorizeFor={NonReadOnlyUsers}
              className="w-full lg:hidden"
            >
              <CareIcon icon="l-plus" className="text-lg" />
              {t("add_new_beds")}
            </ButtonV2>
          </div>
          <div className="w-full @container">
            <PaginatedList.WhenEmpty className="my-4 flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
              <span>{t("no_beds_available")}</span>
            </PaginatedList.WhenEmpty>

            <PaginatedList.WhenLoading>
              <Loading />
            </PaginatedList.WhenLoading>
            <PaginatedList.Items<BedModel> className="my-8 grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
              {(bedItem: BedModel) => (
                <BedCard
                  id={bedItem.id ?? ""}
                  facilityId={facilityId ?? ""}
                  name={bedItem.name ?? ""}
                  description={bedItem.description ?? ""}
                  bedType={bedItem.bed_type ?? ""}
                  triggerRerender={refetch}
                  key={locationId ?? ""}
                  locationId={locationId ?? ""}
                  isOccupied={bedItem.is_occupied ?? false}
                />
              )}
            </PaginatedList.Items>
          </div>
          <div className="flex w-full items-center justify-center">
            <PaginatedList.Paginator hideIfSinglePage />
          </div>
        </Page>
      )}
    </PaginatedList>
  );
};
