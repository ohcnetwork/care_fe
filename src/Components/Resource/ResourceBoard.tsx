import { navigate } from "raviger";
import { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";

import { ExportButton } from "@/Components/Common/Export";
import { downloadResourceRequests } from "@/Redux/actions";
import routes from "@/Redux/api";
import dayjs from "@/Utils/dayjs";
import useQuery from "@/Utils/request/useQuery";
import { classNames, formatDateTime } from "@/Utils/utils";

const limit = 14;

interface boardProps {
  board: string;
  filterProp: any;
  formatFilter: any;
}

const renderBoardTitle = (board: string) => board;

const reduceLoading = (action: string, current: any) => {
  switch (action) {
    case "MORE":
      return { ...current, more: true };
    case "BOARD":
      return { ...current, board: true };
    case "COMPLETE":
      return { board: false, more: false };
  }
};

const ResourceCard = ({ resource }: any) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "resource-card",
    item: resource,
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div ref={drag} className="mt-2 w-full">
      <div
        className="mx-2 h-full overflow-hidden rounded-lg bg-white shadow"
        style={{
          opacity: isDragging ? 0.2 : 1,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div>
            <div className="flex justify-between">
              <div className="text-md mb-2 font-semibold capitalize text-black">
                {resource.title}
              </div>
              <div>
                {resource.emergency && (
                  <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                    Emergency
                  </span>
                )}
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-1 gap-y-2 sm:grid-cols-1">
              <div className="sm:col-span-1">
                <dt
                  title=" Origin facility"
                  className="flex items-center text-sm font-medium leading-5 text-gray-500"
                >
                  <i className="fas fa-plane-departure mr-2"></i>
                  <dd className="text-sm font-bold leading-5 text-gray-900">
                    {(resource.origin_facility_object || {}).name}
                  </dd>
                </dt>
              </div>
              <div className="sm:col-span-1">
                <dt
                  title="Resource approving facility"
                  className="flex items-center text-sm font-medium leading-5 text-gray-500"
                >
                  <i className="fas fa-user-check mr-2"></i>
                  <dd className="text-sm font-bold leading-5 text-gray-900">
                    {(resource.approving_facility_object || {}).name}
                  </dd>
                </dt>
              </div>
              {resource.assigned_facility_object && (
                <div className="sm:col-span-1">
                  <dt
                    title=" Assigned facility"
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <i className="fas fa-plane-arrival mr-2"></i>

                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {(resource.assigned_facility_object || {}).name ||
                        "Yet to be decided"}
                    </dd>
                  </dt>
                </div>
              )}
              <div className="sm:col-span-1">
                <dt
                  title="  Last Modified"
                  className={
                    "flex items-center text-sm font-medium leading-5 " +
                    (dayjs()
                      .subtract(2, "hours")
                      .isBefore(resource.modified_date)
                      ? "text-gray-900"
                      : "rounded bg-red-400 p-1 text-white")
                  }
                >
                  <i className="fas fa-stopwatch mr-2"></i>
                  <dd className="text-sm font-bold leading-5">
                    {formatDateTime(resource.modified_date) || "--"}
                  </dd>
                </dt>
              </div>
              {resource.assigned_to_object && (
                <div className="sm:col-span-1">
                  <dt
                    title="Assigned to"
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <i className="fas fa-user mr-2"></i>
                    <dd className="text-sm font-bold leading-5 text-gray-900">
                      {resource.assigned_to_object.first_name}{" "}
                      {resource.assigned_to_object.last_name} -{" "}
                      {resource.assigned_to_object.user_type}
                    </dd>
                  </dt>
                </div>
              )}
            </dl>
          </div>
          <div className="mt-2 flex">
            <button
              data-testid="resource-details"
              onClick={(_) => navigate(`/resource/${resource.external_id}`)}
              className="btn btn-default mr-2 w-full bg-white"
            >
              <i className="fas fa-eye mr-2" /> All Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResourceBoard({
  board,
  filterProp,
  formatFilter,
}: boardProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState({ board: false, more: false });
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "resource-card",
    drop: (item: any) => {
      if (item.status !== board) {
        navigate(`/resource/${item.id}/update?status=${board}`);
      }
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));
  const [offset, setOffSet] = useState(0);

  const { data, refetch } = useQuery(routes.listResourceRequests, {
    query: formatFilter({
      ...filterProp,
      status: board,
      offset: offset,
    }),
    onResponse: ({ res, data }) => {
      if (res && data) {
        setCurrentPage(1);
      }
      setIsLoading((loading) => reduceLoading("COMPLETE", loading));
    },
  });

  useEffect(() => {
    setIsLoading((loading) => reduceLoading("BOARD", loading));
    refetch();
  }, [
    board,
    filterProp.facility,
    filterProp.origin_facility,
    filterProp.approving_facility,
    filterProp.assigned_facility,
    filterProp.emergency,
    filterProp.created_date_before,
    filterProp.created_date_after,
    filterProp.modified_date_before,
    filterProp.modified_date_after,
    filterProp.ordering,
  ]);

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setOffSet(offset);
    setCurrentPage(page);
    setIsLoading((loading) => reduceLoading("MORE", loading));
    refetch();
    setIsLoading((loading) => reduceLoading("COMPLETE", loading));
  };

  const boardFilter = (filter: string) => {
    return (
      data &&
      data?.results
        .filter(({ status }) => status === filter)
        .map((resource: any) => (
          <ResourceCard key={`resource_${resource.id}`} resource={resource} />
        ))
    );
  };
  return (
    <div
      ref={drop}
      className={classNames(
        "mr-2 h-full w-full shrink-0 overflow-y-auto rounded-md bg-gray-200 pb-4 @lg:w-1/2 @3xl:w-1/3 @7xl:w-1/4",
        isOver && "cursor-move"
      )}
    >
      <div className="sticky top-0 rounded bg-gray-200 pt-2">
        <div className="mx-2 flex items-center justify-between rounded bg-white p-4 shadow">
          <h3 className="flex h-8 items-center text-xs">
            {renderBoardTitle(board)}{" "}
            <ExportButton
              action={() =>
                downloadResourceRequests({
                  ...formatFilter({ ...filterProp, status: board }),
                  csv: 1,
                })
              }
              filenamePrefix={`resource_requests_${board}`}
            />
          </h3>
          <span className="ml-2 rounded-lg bg-primary-500 px-2 text-white">
            {data?.count || "0"}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-col pb-2 text-sm">
        {isLoading.board ? (
          <div className="m-1">
            <div className="mx-auto w-full max-w-sm rounded-md border border-gray-300 bg-white p-4 shadow">
              <div className="flex animate-pulse space-x-4 ">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 w-3/4 rounded bg-gray-400"></div>
                  <div className="space-y-2">
                    <div className="h-4 rounded bg-gray-400"></div>
                    <div className="h-4 w-5/6 rounded bg-gray-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : data && data?.results.length > 0 ? (
          boardFilter(board)
        ) : (
          <p className="mx-auto p-4">No requests to show.</p>
        )}
        {!isLoading.board &&
          data &&
          data?.results.length < (data?.count || 0) &&
          (isLoading.more ? (
            <div className="mx-auto my-4 rounded-md bg-gray-100 p-2 px-4 hover:bg-white">
              Loading
            </div>
          ) : (
            <button
              onClick={(_) => handlePagination(currentPage + 1, limit)}
              className="mx-auto my-4 rounded-md bg-gray-100 p-2 px-4 hover:bg-white"
            >
              More...
            </button>
          ))}
      </div>
    </div>
  );
}
