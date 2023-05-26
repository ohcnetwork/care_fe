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
import loadable from "@loadable/component";
import { navigate } from "raviger";
import useConfig from "../../Common/hooks/useConfig";
import useFilters from "../../Common/hooks/useFilters";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import withScrolling from "react-dnd-scrolling";
import ButtonV2 from "../Common/components/ButtonV2";
import SwitchTabs from "../Common/components/SwitchTabs";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const ScrollingComponent = withScrolling("div");

export default function BoardView() {
  const { qParams, updateQuery, FilterBadges, advancedFilter } = useFilters({
    limit: -1,
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

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between">
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
        <div className="w-full flex gap-2 pt-2 items-center flex-col xl:flex-row justify-between">
          <SearchInput
            name="patient_name"
            value={qParams.patient_name}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("search_patient")}
          />

          <SwitchTabs
            Tab1={t("active")}
            Tab2={t("completed")}
            onClickTab1={() => setBoardFilter(activeBoards)}
            onClickTab2={() => setBoardFilter(completedBoards)}
            activeTab={boardFilter[0].text !== activeBoards[0].text}
          />

          <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 w-full lg:w-fit lg:mr-4">
            <ButtonV2
              className="py-[9px]"
              onClick={() =>
                navigate("/shifting/list-view", { query: qParams })
              }
            >
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
      <BadgesList {...{ qParams, FilterBadges }} />
      <ScrollingComponent className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll px-4">
        <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll px-2">
          {isLoading ? (
            <Loading />
          ) : (
            boardFilter.map((board) => (
              <ShiftingBoard
                key={board.text}
                filterProp={qParams}
                board={board.text}
                title={board.label}
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
