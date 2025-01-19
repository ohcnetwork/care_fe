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
import UserListAndCardView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

const UserCardSkeleton = () => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col h-full gap-4">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>

              <div className="mt-auto pt-2">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const UserListSkeleton = () => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="relative min-w-full divide-y divide-gray-200">
      {/* Header Skeleton */}
      <thead>
        <tr>
          <th className="sticky top-0 z-10 bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-24" />
          </th>
          <th className="bg-gray-100 px-6 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-16" />
          </th>
          <th className="bg-gray-100 px-10 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-20" />
          </th>
          <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-24" />
          </th>
          <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-20" />
          </th>
        </tr>
      </thead>
      {/* Body Skeleton */}
      <tbody className="divide-y divide-gray-200 bg-white">
        {Array.from({ length: 7 }).map((_, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="sticky left-0 z-10 bg-white px-4 py-4 lg:pr-20">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </td>
            <td className="flex-0 px-6 py-4">
              <Skeleton className="h-4 w-16" />
            </td>
            <td className="px-10 py-4 text-sm">
              <Skeleton className="h-4 w-20" />
            </td>
            <td className="px-4 py-4 text-sm whitespace-nowrap">
              <Skeleton className="h-4 w-24" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-8 w-20 rounded-md" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function FacilityUsers(props: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: 15,
    cacheBlacklist: ["username"],
  });
  const [activeTab, setActiveTab] = useState<"card" | "list">("card");
  const { facilityId } = props;

  let usersList: JSX.Element = <></>;

  const { data: userListData, isLoading: userListLoading } = useQuery({
    queryKey: ["facilityUsers", facilityId, qParams],
    queryFn: query.debounced(routes.facility.getUsers, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        username: qParams.username,
        limit: qParams.limit,
        offset: (qParams.page - 1) * qParams.limit,
      },
    }),
    enabled: !!facilityId,
  });

  if (userListLoading || !userListData) {
    usersList =
      activeTab === "card" ? <UserCardSkeleton /> : <UserListSkeleton />;
  } else {
    usersList = (
      <div>
        <UserListAndCardView
          users={userListData?.results ?? []}
          activeTab={activeTab}
        />
        <Pagination totalCount={userListData.count} />
      </div>
    );
  }

  return (
    <Page
      title={t("users_management")}
      componentRight={
        <Badge
          className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 m-3"
          variant="outline"
        >
          {t("user_count", { count: userListData?.count ?? 0 })}
        </Badge>
      }
    >
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
