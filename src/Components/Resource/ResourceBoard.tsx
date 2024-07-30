import { useState, useEffect } from "react";
import { downloadResourceRequests } from "../../Redux/actions";
import { navigate } from "raviger";
import { classNames } from "../../Utils/utils";
import { useDrag, useDrop } from "react-dnd";
import { formatDateTime } from "../../Utils/utils";
import { ExportButton } from "../Common/Export";
import dayjs from "../../Utils/dayjs";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { PaginatedResponse } from "../../Utils/request/types";
import { IResource } from "./models";
import request from "../../Utils/request/request";
import CareIcon from "../../CAREUI/icons/CareIcon";

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
                  className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                >
                  <CareIcon icon="l-plane-departure" className="mr-2 text-xl" />
                  <dd className="text-sm font-bold leading-5 text-secondary-900">
                    {(resource.origin_facility_object || {}).name}
                  </dd>
                </dt>
              </div>
              <div className="sm:col-span-1">
                <dt
                  title="Resource approving facility"
                  className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                >
                  <CareIcon icon="l-user-check" className="mr-2 text-xl" />
                  <dd className="text-sm font-bold leading-5 text-secondary-900">
                    {(resource.approving_facility_object || {}).name}
                  </dd>
                </dt>
              </div>
              {resource.assigned_facility_object && (
                <div className="sm:col-span-1">
                  <dt
                    title=" Assigned facility"
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-plane-arrival" className="mr-2 text-xl" />

                    <dd className="text-sm font-bold leading-5 text-secondary-900">
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
                      ? "text-secondary-900"
                      : "rounded bg-red-400 p-1 text-white")
                  }
                >
                  <CareIcon icon="l-stopwatch" className="mr-2 text-xl" />
                  <dd className="text-sm font-bold leading-5">
                    {formatDateTime(resource.modified_date) || "--"}
                  </dd>
                </dt>
              </div>
              {resource.assigned_to_object && (
                <div className="sm:col-span-1">
                  <dt
                    title="Assigned to"
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-user" className="mr-2 text-xl" />
                    <dd className="text-sm font-bold leading-5 text-secondary-900">
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
              onClick={(_) => navigate(`/resource/${resource.id}`)}
              className="btn btn-default mr-2 w-full bg-white"
            >
              <CareIcon icon="l-eye" className="mr-2 text-xl" /> All Details
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
  const [isLoading, setIsLoading] = useState({ board: "BOARD", more: false });
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
  const [data, setData] = useState<PaginatedResponse<IResource>>();

  useEffect(() => {
    setIsLoading((loading) => reduceLoading("BOARD", loading));
  }, [
    board,
    filterProp.title,
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

  useQuery(routes.listResourceRequests, {
    query: formatFilter({
      ...filterProp,
      status: board,
    }),
    onResponse: ({ res, data: listResourceData }) => {
      if (res?.ok && listResourceData) {
        setData(listResourceData);
      }
      setIsLoading((loading) => reduceLoading("COMPLETE", loading));
    },
  });

  const handlePagination = async () => {
    setIsLoading((loading) => reduceLoading("MORE", loading));
    setOffSet(offset + 14);
    const { res, data: newPageData } = await request(
      routes.listResourceRequests,
      {
        query: formatFilter({
          ...filterProp,
          status: board,
          offset: offset,
        }),
      },
    );
    if (res?.ok && newPageData) {
      setData((prev) =>
        prev
          ? { ...prev, results: [...prev.results, ...newPageData.results] }
          : newPageData,
      );
    }
    setIsLoading((loading) => reduceLoading("COMPLETE", loading));
  };

  const boardFilter = (filter: string) => {
    return data?.results
      .filter(({ status }) => status === filter)
      .map((resource: any) => (
        <ResourceCard key={`resource_${resource.id}`} resource={resource} />
      ));
  };

  return (
    <div
      ref={drop}
      className={classNames(
        "e mr-2 h-full w-full shrink-0 overflow-y-auto rounded-md bg-secondary-200 pb-4 @lg:w-1/2 @3xl:w-1/3 @7xl:w-1/4",
        isOver && "cursor-move",
      )}
    >
      <div className="sticky top-0 rounded bg-secondary-200 pt-2">
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
            <div className="mx-auto w-full max-w-sm rounded-md border border-secondary-300 bg-white p-4 shadow">
              <div className="flex animate-pulse space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 w-3/4 rounded bg-secondary-400"></div>
                  <div className="space-y-2">
                    <div className="h-4 rounded bg-secondary-400"></div>
                    <div className="h-4 w-5/6 rounded bg-secondary-400"></div>
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
            <div className="mx-auto my-4 rounded-md bg-secondary-100 p-2 px-4 hover:bg-white">
              Loading
            </div>
          ) : (
            <button
              onClick={(_) => handlePagination()}
              className="mx-auto my-4 rounded-md bg-secondary-100 p-2 px-4 hover:bg-white"
            >
              More...
            </button>
          ))}
      </div>
    </div>
  );
}
