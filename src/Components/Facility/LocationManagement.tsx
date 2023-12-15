import { lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import CareIcon from "../../CAREUI/icons/CareIcon";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import routes from "../../Redux/api";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import * as Notification from "../../Utils/Notifications.js";
import request from "../../Utils/request/request";
import useQuery from "../../Utils/request/useQuery";
import DialogModal from "../Common/Dialog";
import ButtonV2 from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import { UserModel } from "../Users/models";
import { LocationModel } from "./models";

const Loading = lazy(() => import("../Common/Loading"));

interface Props {
  facilityId: string;
}

export default function LocationManagement({ facilityId }: Props) {
  const { t } = useTranslation();
  return (
    <PaginatedList
      route={routes.listFacilityAssetLocation}
      pathParams={{ facility_external_id: facilityId }}
    >
      {() => (
        <Page
          title={t("location_management")}
          backUrl={`/facility/${facilityId}`}
          options={
            <ButtonV2
              id="add-new-location"
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
              {t("add_new_location")}
            </ButtonV2>
          </div>

          <div className="w-full @container">
            <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
              <span>{t("no_locations_available")}</span>
            </PaginatedList.WhenEmpty>

            <PaginatedList.WhenLoading>
              <Loading />
            </PaginatedList.WhenLoading>
            <PaginatedList.Items<LocationModel> className="my-8 grid gap-3 @4xl:grid-cols-2 @6xl:grid-cols-3 @[100rem]:grid-cols-4 lg:mx-8">
              {(item) => <Location {...item} facilityId={facilityId} />}
            </PaginatedList.Items>
          </div>

          <div className="flex w-full items-center justify-center">
            <PaginatedList.Paginator hideIfSinglePage />
          </div>
        </Page>
      )}
    </PaginatedList>
  );
}

const DutyStaff = ({
  facilityId,
  locationId,
  toggle,
  setToggle,
}: {
  facilityId: string;
  locationId: string;
  toggle: boolean;
  setToggle: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation();
  const [disabled, setDisabled] = useState(false);
  const { data, loading } = useQuery(routes.getFacilityUsers, {
    pathParams: { facility_id: facilityId },
  });
  const [selected, setSelected] = useState<UserModel>();
  const {
    data: dutyStaffList,
    loading: _dutyStaffLoading,
    refetch,
  } = useQuery(routes.getFacilityAssetLocationDutyStaff, {
    pathParams: {
      facility_external_id: facilityId,
      external_id: locationId ?? "",
    },
  });

  const dutyStaffIds = dutyStaffList?.map((u) => u.id) || [];
  const userList =
    data?.results
      .filter((u) => u.user_type === "Doctor" || u.user_type === "Staff")
      .filter((u) => !dutyStaffIds.includes(u.id)) || [];

  const handleAssign = async () => {
    if (!selected) return;
    setDisabled(true);

    const { res } = await request(routes.createFacilityAssetLocationDutyStaff, {
      pathParams: {
        facility_external_id: facilityId,
        external_id: locationId ?? "",
      },
      body: { duty_staff: selected.id },
    });

    if (res) {
      if (res?.ok && res.status === 201) {
        Notification.Success({
          msg: "Duty Staff Assigned Successfully",
        });
        refetch();
      }
    } else {
      Notification.Error({
        msg: "Something went wrong",
      });
    }

    setDisabled(false);
    setSelected(undefined);
  };

  const handleDelete = async (userId: number) => {
    if (!userId) return;
    setDisabled(true);

    const { res } = await request(routes.removeFacilityAssetLocationDutyStaff, {
      pathParams: {
        facility_external_id: facilityId,
        external_id: locationId ?? "",
      },
      body: { duty_staff: userId },
    });

    if (res) {
      if (res?.ok && res.status === 204) {
        Notification.Success({
          msg: "Duty Staff removed Successfully",
        });
        refetch();
      }
    } else {
      Notification.Error({
        msg: "Something went wrong",
      });
    }
    setDisabled(false);
  };

  return (
    <DialogModal
      title={t("assign_duty_staff")}
      show={toggle}
      onClose={() => setToggle((prev) => !prev)}
    >
      <div className="flex w-full items-start gap-2">
        <AutocompleteFormField
          id="user-search"
          name="user_search"
          className="w-full"
          disabled={disabled}
          placeholder={t("search_user_placeholder")}
          value={selected}
          onChange={(e) => setSelected(e.value)}
          options={userList}
          optionLabel={(option) =>
            `${option.first_name} ${option.last_name} (${option.user_type})`
          }
          optionValue={(option) => option}
          isLoading={loading}
        />
        <ButtonV2
          variant="primary"
          border
          className="mt-0.5"
          onClick={() => handleAssign()}
          disabled={!selected}
        >
          {t("assign")}
        </ButtonV2>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {dutyStaffList?.map((user) => (
          <div
            id={`user-${user.id}`}
            className="flex rounded-lg px-3 py-1 text-primary-900"
          >
            <div className="flex w-full">
              <CareIcon className="care-l-user-md" />
              <div className="ml-3">{`${user.first_name} ${user.last_name} (${user.user_type})`}</div>
            </div>
            <ButtonV2
              id="unlink-duty-staff"
              size="small"
              variant="danger"
              ghost={true}
              className="ml-auto"
              disabled={disabled}
              onClick={() => handleDelete(user.id)}
            >
              <CareIcon className="care-l-times text-lg" />
            </ButtonV2>
          </div>
        ))}
      </div>
    </DialogModal>
  );
};

interface LocationProps extends LocationModel {
  facilityId: string;
}

const Location = (props: LocationProps) => {
  const { t } = useTranslation();
  const {
    id,
    name,
    description,
    middleware_address,
    location_type,
    created_date,
    modified_date,
    facilityId,
  } = props;
  const [toggle, setToggle] = useState(false);

  return (
    <div className="flex h-full w-full flex-col rounded border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-400">
      <div className="flex-1">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p
              className="break-words text-xl font-medium"
              id="view-location-name"
            >
              {name}
            </p>
            <div
              className="h-fit rounded-full border-2 border-primary-500 bg-primary-100 px-3 py-[3px]"
              id="location-type"
            >
              <p className="text-xs font-bold text-primary-500">
                {location_type}
              </p>
            </div>
          </div>
          <ButtonV2
            variant="secondary"
            border
            className="w-full lg:w-auto"
            href={`location/${id}/update`}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon className="care-l-pen text-lg" />
            {t("edit")}
          </ButtonV2>
        </div>

        <p
          className="mt-3 break-all text-sm font-medium text-gray-700"
          id="view-location-description"
        >
          {description || "-"}
        </p>
        <p className="mt-3 text-sm font-semibold text-gray-700">
          Middleware Address:
        </p>
        <p
          className="mt-1 break-all font-mono text-sm font-bold text-gray-700"
          id="view-location-middleware"
        >
          {middleware_address || "-"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:flex-row">
        {toggle && (
          <DutyStaff
            facilityId={facilityId}
            locationId={id || ""}
            toggle={toggle}
            setToggle={setToggle}
          />
        )}
      </div>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <ButtonV2
          variant="secondary"
          border
          className="w-full md:w-auto"
          onClick={() => setToggle((prev) => !prev)}
        >
          <CareIcon className="care-l-user text-lg" />
          {t("assign_duty_staff")}
        </ButtonV2>

        <ButtonV2
          id="manage-bed-button"
          variant="secondary"
          border
          className="w-full md:w-auto"
          href={`location/${id}/beds`}
        >
          <CareIcon className="care-l-bed text-lg" />
          {t("manage_beds")}
        </ButtonV2>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-gray-700">
        <RecordMeta time={created_date} prefix="Created:" />
        <RecordMeta time={modified_date} prefix="Modified:" />
      </div>
    </div>
  );
};
