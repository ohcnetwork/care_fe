import { navigate } from "raviger";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import ButtonV2 from "@/components/Common/ButtonV2";
import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import Tabs from "@/components/Common/Tabs";
import { ResourceModel } from "@/components/Facility/models";
import SearchInput from "@/components/Form/SearchInput";
import type { KanbanBoardType } from "@/components/Kanban/Board";
import BadgesList from "@/components/Resource/ResourceBadges";
import ResourceBlock from "@/components/Resource/ResourceBlock";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ListFilter from "@/components/Resource/ResourceFilter";

import useFilters from "@/hooks/useFilters";

import { RESOURCE_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

const KanbanBoard = lazy(
  () => import("@/components/Kanban/Board"),
) as KanbanBoardType;

const resourceStatusOptions = RESOURCE_CHOICES.map((obj) => obj.text);

const COMPLETED = ["COMPLETED", "REJECTED"];
const ACTIVE = resourceStatusOptions.filter((o) => !COMPLETED.includes(o));

export default function BoardView() {
  const { qParams, FilterBadges, advancedFilter, updateQuery } = useFilters({
    limit: -1,
    cacheBlacklist: ["title"],
  });
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  // eslint-disable-next-line
  const appliedFilters = formatFilter(qParams);
  const { t } = useTranslation();

  const onListViewBtnClick = () => {
    navigate("/resource/list", { query: qParams });
    localStorage.setItem("defaultResourceView", "list");
  };

  return (
    <div className="flex-col px-2 pb-2">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row">
        <div className="w-1/3 lg:w-1/4">
          <PageTitle
            title={t("resource")}
            hideBack
            className="mx-3 md:mx-5"
            componentRight={
              <ExportButton
                action={async () => {
                  const { data } = await request(
                    routes.downloadResourceRequests,
                    {
                      query: { ...appliedFilters, csv: true },
                    },
                  );
                  return data ?? null;
                }}
                filenamePrefix="resource_requests"
              />
            }
            breadcrumbs={false}
          />
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-2 pt-2 xl:flex-row">
          <SearchInput
            name="title"
            value={qParams.title}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("search_resource")}
            className="w-full md:w-60"
          />
          <Tabs
            tabs={[
              { text: t("active"), value: 0 },
              { text: t("completed"), value: 1 },
            ]}
            onTabChange={(tab) => setBoardFilter(tab ? COMPLETED : ACTIVE)}
            currentTab={boardFilter !== ACTIVE ? 1 : 0}
          />
          <div className="flex w-full flex-col gap-2 lg:mr-4 lg:w-fit lg:flex-row lg:gap-4">
            <ButtonV2 className="py-[11px]" onClick={onListViewBtnClick}>
              <CareIcon icon="l-list-ul" />
              {t("list_view")}
            </ButtonV2>
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
          </div>
        </div>
      </div>
      <Suspense fallback={<Loading />}>
        <KanbanBoard<ResourceModel>
          title={<BadgesList {...{ appliedFilters, FilterBadges }} />}
          sections={boardFilter.map((board) => ({
            id: board,
            title: (
              <h3 className="flex h-8 items-center text-xs">
                {board}{" "}
                <ExportButton
                  action={async () => {
                    const { data } = await request(
                      routes.downloadResourceRequests,
                      {
                        query: {
                          ...formatFilter({ ...qParams, status: board }),
                          csv: true,
                        },
                      },
                    );
                    return data ?? null;
                  }}
                  filenamePrefix={`resource_requests_${board}`}
                />
              </h3>
            ),
            fetchOptions: (id) => ({
              route: routes.listResourceRequests,
              options: {
                query: formatFilter({
                  ...qParams,
                  status: id,
                }),
              },
            }),
          }))}
          onDragEnd={(result) => {
            if (result.source.droppableId !== result.destination?.droppableId)
              navigate(
                `/resource/${result.draggableId}/update?status=${result.destination?.droppableId}`,
              );
          }}
          itemRender={(resource) => <ResourceBlock resource={resource} />}
        />
      </Suspense>

      <ListFilter {...advancedFilter} key={window.location.search} />
    </div>
  );
}
