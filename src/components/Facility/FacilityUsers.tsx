import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";
import UserListView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

export default function FacilityUsers(props: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: 18,
    cacheBlacklist: ["username"],
  });
  const [activeTab, setActiveTab] = useState(0);
  const { facilityId } = props;

  const { data: userListData, isLoading: userListLoading } = useQuery({
    queryKey: ["facilityUsers", facilityId],
    queryFn: query(routes.facility.getUsers, {
      pathParams: { facility_id: facilityId },
    }),
    enabled: !!facilityId,
  });

  if (userListLoading) {
    return (
      <div className="px-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="flex items-center mb-4">
          <Skeleton className="h-16 w-16 rounded-lg mr-3" />
          <div>
            <Skeleton className="h-4 w-14 mb-1" />
            <Skeleton className="h-12 w-8" />
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-10 w-72" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start">
                  <Skeleton className="h-16 w-16 rounded-lg mr-4" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-6 w-24 mb-1" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="mt-2">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (!userListData) {
    return <div>{t("no_users_found")}</div>;
  }

  return (
    <Page title={t("users")} hideBack={true} breadcrumbs={false}>
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
