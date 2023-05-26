import { useState } from "react";
import { navigate } from "raviger";
import ListFilter from "./ListFilter";
import ResourceBoard from "./ResourceBoard";
import { RESOURCE_CHOICES } from "../../Common/constants";
import { downloadResourceRequests } from "../../Redux/actions";
import loadable from "@loadable/component";
import withScrolling from "react-dnd-scrolling";
import BadgesList from "./BadgesList";
import { formatFilter } from "./Commons";
import useFilters from "../../Common/hooks/useFilters";
import { ExportButton } from "../Common/Export";
import SwitchTabs from "../Common/components/SwitchTabs";
import ButtonV2 from "../Common/components/ButtonV2";
import { useTranslation } from "react-i18next";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const ScrollingComponent = withScrolling("div");
const resourceStatusOptions = RESOURCE_CHOICES.map((obj) => obj.text);

const COMPLETED = ["COMPLETED", "REJECTED"];
const ACTIVE = resourceStatusOptions.filter((o) => !COMPLETED.includes(o));

export default function BoardView() {
  const { qParams, FilterBadges, advancedFilter } = useFilters({ limit: -1 });
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  // eslint-disable-next-line
  const [isLoading, setIsLoading] = useState(false);
  const appliedFilters = formatFilter(qParams);
  const { t } = useTranslation();

  const onListViewBtnClick = () => {
    navigate("/resource/list-view", { query: qParams });
    localStorage.setItem("defaultResourceView", "list");
  };

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="w-full flex-col lg:flex-row flex items-center justify-between">
        <div className="w-1/3 lg:w-1/4">
          <PageTitle
            title="Resource"
            hideBack
            className="mx-3 md:mx-5"
            componentRight={
              <ExportButton
                action={() =>
                  downloadResourceRequests({ ...appliedFilters, csv: 1 })
                }
                filenamePrefix="resource_requests"
              />
            }
            breadcrumbs={false}
          />
        </div>

        <div className="w-full flex flex-col lg:flex-row justify-between pt-2 lg:gap-4 gap-2 items-center">
          <div></div>
          <SwitchTabs
            Tab1="Active"
            Tab2="Completed"
            onClickTab1={() => setBoardFilter(ACTIVE)}
            onClickTab2={() => setBoardFilter(COMPLETED)}
            activeTab={boardFilter !== ACTIVE}
          />
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 w-full lg:w-fit lg:mr-4">
            <ButtonV2 className="py-[9px]" onClick={onListViewBtnClick}>
              <i className="fa fa-list-ul mr-1" aria-hidden="true"></i>
              {t("list_view")}
            </ButtonV2>
            <ButtonV2 ghost border onClick={() => advancedFilter.setShow(true)}>
              <i className="fa fa-filter mr-1" aria-hidden="true"></i>
              <span>{t("filters")}</span>
            </ButtonV2>
          </div>
        </div>
      </div>

      <BadgesList {...{ appliedFilters, FilterBadges }} />
      <ScrollingComponent className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll px-4">
        <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll px-4">
          {isLoading ? (
            <Loading />
          ) : (
            boardFilter.map((board) => (
              <ResourceBoard
                key={board}
                filterProp={qParams}
                board={board}
                formatFilter={formatFilter}
              />
            ))
          )}
        </div>
      </ScrollingComponent>
      <ListFilter {...advancedFilter} key={window.location.search} />
    </div>
  );
}
