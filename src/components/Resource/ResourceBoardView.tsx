import { useState } from "react";
import { Link, navigate } from "raviger";
import ListFilter from "./ListFilter";
import { RESOURCE_CHOICES } from "@/common/constants";
import BadgesList from "./BadgesList";
import { formatFilter } from "./Commons";
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
import { classNames, formatDateTime, formatName } from "../../Utils/utils";
import dayjs from "dayjs";

import PageTitle from "@/components/Common/PageTitle";
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
        itemRender={(resource) => (
          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex justify-between p-4">
                <div>
                  <div className="text-xl font-bold capitalize">
                    {resource.title}
                  </div>
                </div>
                <div>
                  {resource.emergency && (
                    <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                      {t("emergency")}
                    </span>
                  )}
                </div>
              </div>
              <dl className="flex flex-wrap gap-1">
                {(
                  [
                    {
                      title: "origin_facility",
                      icon: "l-plane-departure",
                      data: resource.origin_facility_object.name,
                    },
                    {
                      title: "resource_approving_facility",
                      icon: "l-user-check",
                      data: resource.approving_facility_object?.name,
                    },
                    {
                      title: "assigned_facility",
                      icon: "l-plane-arrival",
                      data:
                        resource.assigned_facility_object?.name ||
                        t("yet_to_be_decided"),
                    },
                    {
                      title: "last_modified",
                      icon: "l-stopwatch",
                      data: formatDateTime(resource.modified_date),
                      className: dayjs()
                        .subtract(2, "hours")
                        .isBefore(resource.modified_date)
                        ? "text-secondary-900"
                        : "rounded bg-red-500 border border-red-600 text-white w-full font-bold",
                    },
                    {
                      title: "assigned_to",
                      icon: "l-user",
                      data: resource.assigned_to_object
                        ? formatName(resource.assigned_to_object) +
                          " - " +
                          resource.assigned_to_object.user_type
                        : undefined,
                    },
                  ] as const
                )
                  .filter((d) => d.data)
                  .map((datapoint, i) => (
                    <div
                      className={classNames(
                        "mx-2 flex items-center gap-2 px-2 py-1",
                        "className" in datapoint ? datapoint.className : "",
                      )}
                      title={t(datapoint.title)}
                      key={i}
                    >
                      <dt className={""}>
                        <CareIcon icon={datapoint.icon} className="text-xl" />
                      </dt>
                      <dd className="text-sm font-semibold">
                        {datapoint.data}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4">
              <Link
                href={`/resource/${resource.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
              >
                <CareIcon icon="l-eye" className="text-lg" /> {t("all_details")}
              </Link>
            </div>
          </div>
        )}
      />
      <ListFilter {...advancedFilter} key={window.location.search} />
    </div>
  );
}
