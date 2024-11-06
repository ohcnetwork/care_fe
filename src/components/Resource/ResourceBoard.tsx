import { useState } from "react";
import { navigate } from "raviger";
import ListFilter from "./ResourceFilter";
import { RESOURCE_CHOICES } from "@/common/constants";
import BadgesList from "./ResourceBadges";
import { formatFilter } from "./ResourceCommons";
import useFilters from "@/common/hooks/useFilters";
import { ExportButton } from "@/components/Common/Export";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import { useTranslation } from "react-i18next";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import SearchInput from "../Form/SearchInput";
import Tabs from "@/components/Common/components/Tabs";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import KanbanBoard from "../Kanban/Board";
import { ResourceModel } from "../Facility/models";

import PageTitle from "@/components/Common/PageTitle";
import ResourceBlock from "./ResourceBlock";
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
      <ListFilter {...advancedFilter} key={window.location.search} />
    </div>
  );
}
