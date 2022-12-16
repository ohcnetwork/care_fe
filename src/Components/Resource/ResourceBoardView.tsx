import { useState } from "react";
import { navigate } from "raviger";
import ListFilter from "./ListFilter";
import ResourceBoard from "./ResourceBoard";
import { RESOURCE_CHOICES } from "../../Common/constants";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { downloadResourceRequests } from "../../Redux/actions";
import loadable from "@loadable/component";
import withScrolling from "react-dnd-scrolling";
import BadgesList from "./BadgesList";
import { formatFilter } from "./Commons";
import useFilters from "../../Common/hooks/useFilters";
import useExport from "../../Common/hooks/useExport";

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
  const { ExportButton } = useExport();
  const appliedFilters = formatFilter(qParams);

  const onListViewBtnClick = () => {
    navigate("/resource/list-view", { query: qParams });
    localStorage.setItem("defaultResourceView", "list");
  };

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="w-full flex-col md:flex-row flex items-center justify-between">
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

        <div className="w-full flex justify-center pt-2 lg:space-x-4 items-center flex-col md:flex-row">
          <div className="bg-gray-200 text-sm text-gray-500 leading-none border-2 border-gray-200 rounded-full inline-flex mt-1">
            <button
              className={
                "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
                (boardFilter === ACTIVE
                  ? " bg-white text-gray-800"
                  : " bg-gray-200 text-sm text-gray-500")
              }
              onClick={(_) => setBoardFilter(ACTIVE)}
            >
              <span>Active</span>
            </button>
            <button
              className={
                "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
                (boardFilter === COMPLETED
                  ? " bg-white text-gray-800"
                  : " bg-gray-200 text-sm text-gray-500")
              }
              onClick={(_) => setBoardFilter(COMPLETED)}
            >
              <span>Completed</span>
            </button>
          </div>
          <div className="mt-2 w-fit inline-flex space-x-1 lg:space-x-4">
            <button
              className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-28 md:w-36 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
              onClick={onListViewBtnClick}
            >
              <i className="fa fa-list-ul mr-1" aria-hidden="true"></i>
              List View
            </button>
            <button
              className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-28 md:w-36 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
              onClick={() => advancedFilter.setShow(true)}
            >
              <i className="fa fa-filter mr-1" aria-hidden="true"></i>
              <span>Filters</span>
            </button>
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
      <SlideOver {...advancedFilter}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter {...advancedFilter} />
        </div>
      </SlideOver>
    </div>
  );
}
