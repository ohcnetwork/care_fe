import { lazy, useState } from "react";
import { navigate } from "raviger";
import ListFilter from "./ListFilter";
import ResourceBoard from "./ResourceBoard";
import { RESOURCE_CHOICES } from "../../Common/constants";
import { downloadResourceRequests } from "../../Redux/actions";
import withScrolling from "react-dnd-scrolling";
import BadgesList from "./BadgesList";
import { formatFilter } from "./Commons";
import useFilters from "../../Common/hooks/useFilters";
import { ExportButton } from "../Common/Export";
import SwitchTabs from "../Common/components/SwitchTabs";
import ButtonV2 from "../Common/components/ButtonV2";
import { useTranslation } from "react-i18next";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import SearchInput from "../Form/SearchInput";

const Loading = lazy(() => import("../Common/Loading"));
const PageTitle = lazy(() => import("../Common/PageTitle"));
const ScrollingComponent = withScrolling("div");
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
  const [isLoading, setIsLoading] = useState(false);
  const appliedFilters = formatFilter(qParams);
  const { t } = useTranslation();

  const onListViewBtnClick = () => {
    navigate("/resource/list", { query: qParams });
    localStorage.setItem("defaultResourceView", "list");
  };

  return (
    <div className="max-h[95vh] flex min-h-full max-w-[100vw] flex-col px-2 pb-2">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row">
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

        <div className="flex w-full flex-col items-center justify-between gap-2 pt-2 xl:flex-row">
          <SearchInput
            name="title"
            value={qParams.title}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("search_resource")}
          />
          <SwitchTabs
            tab1="Active"
            tab2="Completed"
            onClickTab1={() => setBoardFilter(ACTIVE)}
            onClickTab2={() => setBoardFilter(COMPLETED)}
            isTab2Active={boardFilter !== ACTIVE}
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

      <BadgesList {...{ appliedFilters, FilterBadges }} />
      <ScrollingComponent className="mt-4 flex flex-1 items-start overflow-x-scroll px-0 pb-2 @container">
        <div className="mt-4 flex flex-1 items-start overflow-x-scroll px-0 pb-2">
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
