import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import UserFilter from "@/components/Users/UserFilter";
import UserListView from "@/components/Users/UserListAndCard";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import { USER_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

export default function ManageUsers() {
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({
    limit: 18,
    cacheBlacklist: ["username"],
  });
  let manageUsers: JSX.Element = <></>;
  const authUser = useAuthUser();
  const userIndex = USER_TYPES.indexOf(authUser.user_type);
  const userTypes = authUser.is_superuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex + 1);
  const [activeTab, setActiveTab] = useState(0);

  const { data: homeFacilityData } = useTanStackQueryInstead(
    routes.getAnyFacility,
    {
      pathParams: { id: qParams.home_facility },
      prefetch: !!qParams.home_facility && qParams.home_facility !== "NONE",
    },
  );

  const { data: userListData, loading: userListLoading } =
    useTanStackQueryInstead(routes.userList, {
      query: {
        limit: resultsPerPage.toString(),
        offset: (
          (qParams.page ? qParams.page - 1 : 0) * resultsPerPage
        ).toString(),
        username: qParams.username,
        first_name: qParams.first_name,
        last_name: qParams.last_name,
        phone_number: qParams.phone_number,
        alt_phone_number: qParams.alt_phone_number,
        user_type: qParams.user_type,
        district_id: qParams.district,
        home_facility: qParams.home_facility,
        last_active_days: qParams.last_active_days,
      },
    });

  useEffect(() => {
    if (!qParams.state && qParams.district) {
      advancedFilter.removeFilters(["district"]);
    }
    if (!qParams.district && qParams.state) {
      advancedFilter.removeFilters(["state"]);
    }
  }, [advancedFilter, qParams]);

  const { data: districtData, loading: districtDataLoading } =
    useTanStackQueryInstead(routes.getDistrict, {
      prefetch: !!qParams.district,
      pathParams: { id: qParams.district },
    });

  const addUser = (
    <ButtonV2
      id="addUserButton"
      className="w-full"
      onClick={() => navigate("/users/add")}
    >
      <CareIcon icon="l-plus" className="text-lg" />
      <p>{t("add_new_user")}</p>
    </ButtonV2>
  );

  if (userListLoading || districtDataLoading || !userListData?.results) {
    return <Loading />;
  }

  manageUsers = (
    <div>
      <UserListView
        users={userListData?.results ?? []}
        onSearch={(username) => updateQuery({ username })}
        searchValue={qParams.username}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <Pagination totalCount={userListData.count} />
    </div>
  );

  return (
    <Page title={t("user_management")} hideBack={true} breadcrumbs={false}>
      <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <CountBlock
          text="Total Users"
          count={userListData?.count || 0}
          loading={userListLoading || districtDataLoading}
          icon="d-people"
          className="flex-1"
        />
        <div className="col-span-2 my-2 flex flex-col justify-between space-y-3 lg:flex-row lg:space-x-4 lg:space-y-0 lg:px-3">
          <div className="flex flex-col gap-2">
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
            {userTypes.length && addUser}
          </div>

          <UserFilter {...advancedFilter} key={window.location.search} />
        </div>
      </div>

      <div>
        <FilterBadges
          badges={({ badge, value, phoneNumber }) => [
            badge("Username", "username"),
            badge("First Name", "first_name"),
            badge("Last Name", "last_name"),
            phoneNumber(),
            phoneNumber("WhatsApp no.", "alt_phone_number"),
            badge("Role", "user_type"),
            value(
              "District",
              "district",
              qParams.district ? districtData?.name || "" : "",
            ),
            value(
              "Home Facility",
              "home_facility",
              qParams.home_facility
                ? qParams.home_facility === "NONE"
                  ? t("no_home_facility")
                  : homeFacilityData?.name || ""
                : "",
            ),
            value(
              "Last Active",
              "last_active_days",
              (() => {
                if (!qParams.last_active_days) return "";
                if (qParams.last_active_days === "never") return "Never";
                return `in the last ${qParams.last_active_days} day${qParams.last_active_days > 1 ? "s" : ""}`;
              })(),
            ),
          ]}
        />
      </div>

      <div className="pt-4">
        <div>{manageUsers}</div>
      </div>
    </Page>
  );
}
