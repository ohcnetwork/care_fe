import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";

import Page from "@/components/Common/Page";
import UserListView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { useView } from "@/Utils/useView";

export default function FacilityUsers(props: { facilityId: number }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 18,
    cacheBlacklist: ["username"],
  });
  const [activeTab, setActiveTab] = useView("users");
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

  const handleTabChange = (tab: number) => {
    setActiveTab(tab === 1 ? "list" : "card");
  };

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

      <UserListView
        users={userListData?.results ?? []}
        onSearch={(username) => updateQuery({ username })}
        searchValue={qParams.username}
        activeTab={activeTab === "list" ? 1 : 0}
        onTabChange={handleTabChange}
      />

      <Pagination totalCount={userListData?.count ?? 0} />
    </Page>
  );
}
