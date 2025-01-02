import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";

import Page from "@/components/Common/Page";
import UserListView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

export default function FacilityUsers(props: { facilityId: number }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination } = useFilters({
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

  const { data: userListData, isLoading: userListLoading } = useQuery({
    queryKey: ["facilityUsers", facilityId],
    queryFn: query(routes.facility.getUsers, {
      pathParams: { facility_id: facilityId },
    }),
    enabled: !!facilityId,
  });

  if (userListLoading) {
    return <div>Loading...</div>;
  }
  if (!userListData) {
    return <div>No users found</div>;
  }

  return (
    <Page
      title={`${t("users")} - ${facilityData?.name}`}
      hideBack={true}
      breadcrumbs={false}
    >
      <CountBlock
        text={t("total_users")}
        count={userListData.count}
        loading={userListLoading}
        icon="d-people"
        className="my-3 flex flex-col items-center sm:items-start"
      />

      <UserListView
        users={userListData?.results ?? []}
        onSearch={(username) => updateQuery({ username })}
        searchValue={qParams.username}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Pagination totalCount={userListData.count} />
    </Page>
  );
}
