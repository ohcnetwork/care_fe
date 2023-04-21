import React, { useState } from "react";

import BadgesList from "./BadgesList";
import { ExportButton } from "../Common/Export";
import ListFilter from "./ListFilter";
import { SHIFTING_CHOICES } from "../../Common/constants";
import SearchInput from "../Form/SearchInput";
import ShiftingBoard from "./ShiftingBoard";
import { downloadShiftRequests } from "../../Redux/actions";
import { formatFilter } from "./Commons";
import loadable from "@loadable/component";
import { navigate } from "raviger";
import useConfig from "../../Common/hooks/useConfig";
import useFilters from "../../Common/hooks/useFilters";
import { useTranslation } from "react-i18next";
import withScrolling from "react-dnd-scrolling";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const ScrollingComponent = withScrolling("div");

export default function BoardView() {
  const { qParams, updateQuery, FilterBadges, advancedFilter } = useFilters({
    limit: -1,
  });
  const { wartime_shifting } = useConfig();

  const shiftStatusOptions = SHIFTING_CHOICES.map((obj) => obj.text).filter(
    (choice) => wartime_shifting || choice !== "PENDING"
  );

  const COMPLETED = ["COMPLETED", "REJECTED", "DESTINATION REJECTED"];
  const ACTIVE = shiftStatusOptions.filter(
    (option) => !COMPLETED.includes(option)
  );

  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  const [isLoading] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="w-full flex flex-col md:flex-row items-center justify-between">
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
        <div className="w-full flex pt-2 lg:space-x-4 items-center flex-col lg:flex-row justify-between">
          <SearchInput
            name="patient_name"
            value={qParams.patient_name}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("search_patient")}
          />
          <div className="bg-gray-200 text-sm text-gray-500 leading-none border-2 border-gray-200 rounded-full inline-flex mt-1">
            <button
              className={
                "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
                (boardFilter === ACTIVE
                  ? " bg-white text-gray-800"
                  : " bg-gray-200 text-sm text-gray-500")
              }
              onClick={() => setBoardFilter(ACTIVE)}
            >
              <span>{t("active")}</span>
            </button>
            <button
              className={
                "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
                (boardFilter === COMPLETED
                  ? " bg-white text-gray-800"
                  : " bg-gray-200 text-sm text-gray-500")
              }
              onClick={() => setBoardFilter(COMPLETED)}
            >
              <span>{t("completed")}</span>
            </button>
          </div>
          <div className="mt-1 w-fit inline-flex space-x-1 lg:space-x-4">
            <button
              className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-28 md:w-36 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
              onClick={() =>
                navigate("/shifting/list-view", { query: qParams })
              }
            >
              <i className="fa fa-list-ul mr-1" aria-hidden="true"></i>
              {t("list_view")}
            </button>
            <button
              className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-28 md:w-36 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
              onClick={() => advancedFilter.setShow(true)}
            >
              <i className="fa fa-filter mr-1" aria-hidden="true"></i>
              <span>{t("filters")}</span>
            </button>
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
