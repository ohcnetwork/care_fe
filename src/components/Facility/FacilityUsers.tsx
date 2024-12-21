import { useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import Tabs from "@/components/Common/Tabs";
import SearchInput from "@/components/Form/SearchInput";
import UserListView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

export default function FacilityUsers(props: { facilityId: number }) {
  const { t } = useTranslation();

  let usersList: JSX.Element = <></>;

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 18,
    cacheBlacklist: ["username"],
  });
  const [activeTab, setActiveTab] = useState(0);
  const { facilityId } = props;

  const { data: facilityData } = useTanStackQueryInstead(
    routes.getAnyFacility,
    {
      pathParams: {
        id: facilityId,
      },
      prefetch: facilityId !== undefined,
    },
  );

  const { data: userListData, loading: userListLoading } =
    useTanStackQueryInstead(routes.getFacilityUsers, {
      query: {
        limit: resultsPerPage,
        offset: (
          (qParams.page ? qParams.page - 1 : 0) * resultsPerPage
        ).toString(),
        username: qParams.username,
      },
      pathParams: { facility_id: facilityId },
      prefetch: facilityId !== undefined,
    });

  if (userListLoading || !userListData) {
    usersList = <Loading />;
  } else {
    usersList = (
      <div>
        <UserListView
          users={userListData?.results ?? []}
          activeTab={activeTab}
        />
        <Pagination totalCount={userListData.count} />
      </div>
    );
  }

  return (
    <Page
      title={`${t("users")} - ${facilityData?.name}`}
      hideBack={true}
      breadcrumbs={false}
    >
      <CountBlock
        text={t("total_users")}
        count={userListData?.count ?? 0}
        loading={userListLoading}
        icon="d-people"
        className="my-3 flex flex-col items-center sm:items-start"
      />
      <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="sm:w-1/2">
          <SearchInput
            id="search-by-username"
            name="username"
            onChange={(e) => updateQuery({ username: e.value })}
            value={qParams.username}
            placeholder={t("search_by_username")}
          />
        </div>
        <Tabs
          tabs={[
            {
              text: (
                <div className="flex items-center gap-2">
                  <CareIcon icon="l-credit-card" className="text-lg" />
                  <span>Card</span>
                </div>
              ),
              value: 0,
              id: "user-card-view",
            },
            {
              text: (
                <div className="flex items-center gap-2">
                  <CareIcon icon="l-list-ul" className="text-lg" />
                  <span>List</span>
                </div>
              ),
              value: 1,
              id: "user-list-view",
            },
          ]}
          currentTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as number)}
          className="float-right"
        />
      </div>
      <div>{usersList}</div>
    </Page>
  );
}
