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

import { Card, CardContent } from "../ui/card";

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
    return (
      <div className="px-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="flex items-center mb-4">
          <div className="h-16 w-16 bg-gray-200 flex h-16 w-16 items-center justify-center rounded-lg animate-pulse mr-3"></div>
          <div>
            <div className="h-4 w-14 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-12 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-72 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg animate-pulse mr-4"></div>{" "}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>{" "}
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>{" "}
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>{" "}
                    </div>
                    <div className="mt-2">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
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
