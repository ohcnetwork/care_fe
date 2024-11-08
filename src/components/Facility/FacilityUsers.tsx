import { useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";

import Page from "@/components/Common/Page";
import Tabs from "@/components/Common/Tabs";
import SearchInput from "@/components/Form/SearchInput";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

import { UserGrid, UserList } from "../Users/UserListAndCard";

export default function FacilityUsers(props: { facilityId: number }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 18,
    cacheBlacklist: ["username"],
  });
  const { facilityId } = props;
  const [activeTab, setActiveTab] = useState(0);

  const { data: facilityData } = useQuery(routes.getAnyFacility, {
    pathParams: {
      id: facilityId,
    },
    prefetch: facilityId !== undefined,
  });

  const { data: userListData, loading: userListLoading } = useQuery(
    routes.userList,
    {
      query: {
        limit: resultsPerPage.toString(),
        offset: (
          (qParams.page ? qParams.page - 1 : 0) * resultsPerPage
        ).toString(),
        home_facility: facilityId.toString(),
        username: qParams.username,
      },
      prefetch: facilityId !== undefined,
    },
  );

  const renderCard = () => <UserGrid users={userListData?.results} />;
  const renderList = () => <UserList users={userListData?.results} />;

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
        icon="l-user-injured"
        className="my-3 flex flex-col items-center sm:items-start"
      />

      <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="sm:w-1/2">
          <SearchInput
            id="search-by-username"
            name="username"
            onChange={(e) => updateQuery({ [e.name]: e.value })}
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
            },
            {
              text: (
                <div className="flex items-center gap-2">
                  <CareIcon icon="l-list-ul" className="text-lg" />
                  <span>List</span>
                </div>
              ),
              value: 1,
            },
          ]}
          currentTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as number)}
          className="float-right"
        />
      </div>

      {activeTab === 0 ? renderCard() : renderList()}
      <Pagination totalCount={userListData?.count ?? 0} />
    </Page>
  );
}
