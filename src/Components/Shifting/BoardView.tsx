import {
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
} from "../../Common/constants";

import BadgesList from "./BadgesList";
import { ExportButton } from "../Common/Export";
import ListFilter from "./ListFilter";
import SearchInput from "../Form/SearchInput";
import ShiftingBoard from "./ShiftingBoard";
import { downloadShiftRequests } from "../../Redux/actions";
import { formatFilter } from "./Commons";

import { navigate } from "raviger";
import useConfig from "../../Common/hooks/useConfig";
import useFilters from "../../Common/hooks/useFilters";
import { lazy, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import withScrolling from "react-dnd-scrolling";
import ButtonV2 from "../Common/components/ButtonV2";
import SwitchTabs from "../Common/components/SwitchTabs";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";

const Loading = lazy(() => import("../Common/Loading"));
const PageTitle = lazy(() => import("../Common/PageTitle"));
const ScrollingComponent = withScrolling("div");

export default function BoardView() {
  const { qParams, updateQuery, FilterBadges, advancedFilter } = useFilters({
    limit: -1,
    cacheBlacklist: ["patient_name"],
  });
  const { wartime_shifting } = useConfig();

  const shiftStatusOptions = wartime_shifting
    ? SHIFTING_CHOICES_WARTIME
    : SHIFTING_CHOICES_PEACETIME;

  const COMPLETED = wartime_shifting
    ? [
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
        "DESTINATION REJECTED",
        "PATIENT EXPIRED",
      ]
    : ["CANCELLED", "PATIENT EXPIRED"];

  const completedBoards = shiftStatusOptions.filter((option) =>
    COMPLETED.includes(option.text)
  );
  const activeBoards = shiftStatusOptions.filter(
    (option) => !COMPLETED.includes(option.text)
  );

  const [boardFilter, setBoardFilter] = useState(activeBoards);
  const [isLoading] = useState(false);
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [isLeftScrollable, setIsLeftScrollable] = useState<boolean>(false);
  const [isRightScrollable, setIsRightScrollable] = useState<boolean>(false);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleScroll = () => {
      setIsLeftScrollable(container.scrollLeft > 0);
      setIsRightScrollable(
        container.scrollLeft + container.clientWidth <
          container.scrollWidth - 10
      );
    };

    container.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleOnClick = (direction: "right" | "left") => {
    const container = containerRef.current;
    if (direction === "left" ? !isLeftScrollable : !isRightScrollable) return;

    if (container) {
      const scrollAmount = 300;
      const currentScrollLeft = container.scrollLeft;

      if (direction === "left") {
        container.scrollTo({
          left: currentScrollLeft - scrollAmount,
          behavior: "smooth",
        });
      } else if (direction === "right") {
        container.scrollTo({
          left: currentScrollLeft + scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  const renderArrowIcons = (direction: "right" | "left") => {
    const isIconEnable =
      direction === "left" ? isLeftScrollable : isRightScrollable;
    return (
      isIconEnable && (
        <div
          className={`relative z-20 self-center ${
            direction === "right" ? "-left-12" : ""
          }`}
        >
          <CareIcon
            icon={`l-arrow-${direction}`}
            className="absolute inset-y-0 left-0 z-10 w-10 h-10 cursor-pointer hover:opacity-100"
            onClick={() => handleOnClick(direction)}
          />
        </div>
      )
    );
  };

  return (
    <div className="max-h[95vh] flex min-h-full max-w-[100vw] flex-col px-2 pb-2">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row">
        <div className="w-1/3 lg:w-1/4">
          <PageTitle
            title={t("shifting")}
            className="mx-3 md:mx-5"
            hideBack
            componentRight={
              <ExportButton
                action={() =>
                  downloadShiftRequests({ ...formatFilter(qParams), csv: 1 })
                }
                filenamePrefix="shift_requests"
              />
            }
            breadcrumbs={false}
          />
        </div>
        <div className="flex w-full flex-col items-center justify-between gap-2 pt-2 xl:flex-row">
          <SearchInput
            name="patient_name"
            value={qParams.patient_name}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("search_patient")}
          />

          <SwitchTabs
            tab1={t("active")}
            tab2={t("completed")}
            onClickTab1={() => setBoardFilter(activeBoards)}
            onClickTab2={() => setBoardFilter(completedBoards)}
            isTab2Active={boardFilter[0].text !== activeBoards[0].text}
          />

          <div className="flex w-full flex-col gap-2 lg:mr-4 lg:w-fit lg:flex-row lg:gap-4">
            <ButtonV2
              className="py-[11px]"
              onClick={() => navigate("/shifting/list", { query: qParams })}
            >
              <CareIcon className="care-l-list-ul" />
              {t("list_view")}
            </ButtonV2>
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
          </div>
        </div>
      </div>
      <BadgesList {...{ qParams, FilterBadges }} />
      <ScrollingComponent className="relative mt-4 flex max-h-[80vh] w-full items-start pb-2">
        <div className="mt-4 flex min-h-full w-full flex-1 items-start pb-2">
          {isLoading ? (
            <Loading />
          ) : (
            <>
              {renderArrowIcons("left")}
              <div
                className="mx-11 flex max-h-[75vh] w-full flex-row overflow-y-auto overflow-x-hidden"
                ref={containerRef}
              >
                {boardFilter.map((board) => (
                  <ShiftingBoard
                    key={board.text}
                    filterProp={qParams}
                    board={board.text}
                    title={board.label}
                    formatFilter={formatFilter}
                    setContainerHeight={setContainerHeight}
                    containerHeight={containerHeight}
                  />
                ))}
              </div>
              {renderArrowIcons("right")}
            </>
          )}
        </div>
      </ScrollingComponent>
      <ListFilter {...advancedFilter} key={window.location.search} />
    </div>
  );
}
