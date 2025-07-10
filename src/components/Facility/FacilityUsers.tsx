import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import SearchInput from "@/components/Common/SearchInput";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import UserListAndCardView from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";

export default function FacilityUsers(props: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const [activeTab, setActiveTab] = useView("users", "card");

  const { facilityId } = props;

  let usersList: React.ReactNode = <></>;

  const { data: userListData, isFetching: userListFetching } = useQuery({
    queryKey: ["facilityUsers", facilityId, qParams, resultsPerPage],
    queryFn: query.debounced(routes.facility.getUsers, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        username: qParams.username,
        limit: resultsPerPage,
        offset: (qParams.page - 1) * resultsPerPage,
      },
    }),
    enabled: !!facilityId,
  });

  if (userListFetching || !userListData) {
    usersList =
      activeTab === "card" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <CardGridSkeleton count={6} />
        </div>
      ) : (
        <TableSkeleton count={7} />
      );
  } else {
    usersList = (
      <div>
        <UserListAndCardView
          users={userListData?.results ?? []}
          activeTab={activeTab === "card" ? "card" : "list"}
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
          className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 m-3 w-max"
          variant="outline"
        >
          {userListFetching
            ? t("loading")
            : t("entity_count", {
                count: userListData?.count ?? 0,
                entity: "User",
              })}
        </Badge>
      }
    >
      <hr className="mt-4 border-gray-200" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 m-5 ml-0">
        <SearchInput
          options={[
            {
              key: "username",
              type: "text",
              placeholder: t("search_by_username"),
              value: qParams.username || "",
              display: t("username"),
            },
          ]}
          onSearch={(key, value) =>
            updateQuery({
              [key]: value || undefined,
            })
          }
          className="w-full max-w-sm"
        />
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "card" | "list")}
        >
          <TabsList className="flex">
            <TabsTrigger value="card" id="user-card-view">
              <CareIcon icon="l-credit-card" className="text-lg" />
              <span>{t("card")}</span>
            </TabsTrigger>
            <TabsTrigger value="list" id="user-list-view">
              <CareIcon icon="l-list-ul" className="text-lg" />
              <span>{t("list")}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="overflow-x-auto overflow-y-hidden">{usersList}</div>
    </Page>
  );
}
