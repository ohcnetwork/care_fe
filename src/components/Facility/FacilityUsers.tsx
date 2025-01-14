import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import UserListView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

export default function FacilityUsers(props: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    cacheBlacklist: ["username"],
  });
  const [activeTab, setActiveTab] = useState<"card" | "list">("card");
  const { facilityId } = props;

  let usersList: JSX.Element = <></>;

  const { data: userListData, isLoading: userListLoading } = useQuery({
    queryKey: ["facilityUsers", facilityId, qParams],
    queryFn: query.debounced(routes.facility.getUsers, {
      pathParams: { facility_id: facilityId.toString() },
      queryParams: {
        username: qParams.username,
        limit: qParams.limit,
        offset: (qParams.page - 1) * qParams.limit,
      },
    }),
    enabled: !!facilityId,
  });

  if (userListLoading || !userListData) {
    usersList = (
      <div>
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
    <Page title={t("users_management")}>
      <Badge
        className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 m-3"
        variant="outline"
      >
        {`${userListData ? userListData.count : ""} Users`}
      </Badge>
      <hr className="mt-4"></hr>
      <div className="flex items-center justify-between gap-4 m-5 ml-0">
        <Input
          id="search-by-username"
          name="username"
          onChange={(e) => updateQuery({ username: e.target.value })}
          value={qParams.username}
          placeholder={t("search_by_username")}
          className="w-full max-w-sm"
        />
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "card" | "list")}
          className="ml-auto"
        >
          <TabsList className="flex">
            <TabsTrigger value="card" id="user-card-view">
              <div className="flex items-center gap-2">
                <CareIcon icon="l-credit-card" className="text-lg" />
                <span>{t("card")}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="list" id="user-list-view">
              <div className="flex items-center gap-2">
                <CareIcon icon="l-list-ul" className="text-lg" />
                <span>{t("list")}</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>{usersList}</div>
    </Page>
  );
}
