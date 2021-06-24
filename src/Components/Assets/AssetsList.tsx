import moment from "moment";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import * as Notification from "../../Utils/Notifications.js";
import PageTitle from "../Common/PageTitle";
import { listAssets } from "../../Redux/actions";
import { Badge } from "../Patient/ManagePatients";
import { AssetData, AssetsResponse } from "./AssetTypes";
import React, { useState, useEffect, useCallback } from "react";
import { navigate, useQueryParams } from "raviger";
import loadable from "@loadable/component";
import Pagination from "../Common/Pagination";
import { InputSearchBox } from "../Common/SearchBox";
import { make as SlideOver } from "../Common/SlideOver.gen";
import AssetFilter from "./AssetFilter";

const Loading = loadable(() => import("../Common/Loading"));

const AssetsList = (props: any) => {
  const [qParams, setQueryParams] = useQueryParams();
  const [assets, setAssets] = useState<AssetData[]>([{}] as AssetData[]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const limit = 14;
  const dispatch: any = useDispatch();
  const assetsExist = assets.length > 0 && Object.keys(assets[0]).length > 0;
  const fetchData = useCallback(
    async (status: statusType) => {
      console.log("fetching again");
      setIsLoading(true);
      const params = qParams.search
        ? {
            limit,
            offset,
            search_text: qParams.search,
            facility: qParams.facility,
          }
        : {
            limit,
            offset,
            facility: qParams.facility,
          };
      const { data }: any = await dispatch(listAssets(params));
      if (!status.aborted) {
        setIsLoading(false);
        if (!data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAssets(data.results);
          setTotalCount(data.count);
          console.log(data);
        }
      }
    },
    [dispatch, offset, qParams.search, qParams.facility]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const onSearchSuspects = (search: string) => {
    if (search !== "") setQueryParams({ search }, true);
    else setQueryParams({ search: "" }, true);
  };

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, true);
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="px-4 pb-2">
      <PageTitle title="Assets" hideBack={true} />
      <div className="md:flex mt-5 space-y-2">
        <div className="bg-white overflow-hidden shadow rounded-lg flex-1 md:mr-2">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Assets
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
            </dl>
          </div>
        </div>
        <div className="flex-1">
          <InputSearchBox
            value={qParams.search}
            search={onSearchSuspects}
            placeholder="Search by Asset Name"
            errors=""
          />
        </div>
        <div className="flex-1 flex justify-end">
          <div>
            <div className="flex items-start mb-2">
              <button
                className="btn btn-primary-ghost"
                onClick={() => setShowFilters(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="fill-current w-4 h-4 mr-2"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12">
                    {" "}
                  </line>
                  <line x1="8" y1="18" x2="21" y2="18">
                    {" "}
                  </line>
                  <line x1="3" y1="6" x2="3.01" y2="6">
                    {" "}
                  </line>
                  <line x1="3" y1="12" x2="3.01" y2="12">
                    {" "}
                  </line>
                  <line x1="3" y1="18" x2="3.01" y2="18">
                    {" "}
                  </line>
                </svg>
                <span>Advanced Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <SlideOver show={showFilters} setShow={setShowFilters}>
          <div className="bg-white min-h-screen p-4">
            <AssetFilter
              filter={qParams}
              onChange={applyFilter}
              closeFilter={() => setShowFilters(false)}
            />
          </div>
        </SlideOver>
      </div>
      <div className="flex-grow mt-10 bg-white">
        <div className="p-8">
          <div className="flex flex-wrap md:-mx-4">
            {assetsExist ? (
              assets.map((asset: AssetData) => (
                <div
                  key={asset.id}
                  className="w-full pb-2 cursor-pointer border-b md:flex justify-between items-center mb-3"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  <div className="px-4 md:w-1/2">
                    <div className="md:flex justify-between w-full">
                      <p className="text-xl font-normal capitalize">
                        {asset.name}
                      </p>
                    </div>
                    <p className="font-normal text-sm">
                      {asset?.location_object?.name}
                      <span className="text-xs ml-2">
                        Updated at: {moment(asset.modified_date).format("lll")}
                      </span>
                    </p>
                  </div>
                  <div className="md:flex">
                    <div className="md:flex flex-wrap justify-end">
                      {asset.is_working ? (
                        <Badge color="green" icon="cog" text="Working" />
                      ) : (
                        <Badge color="red" icon="cog" text="Not Working" />
                      )}
                      <Badge
                        color="blue"
                        icon="location-arrow"
                        text={asset.status}
                      />
                    </div>
                    <div className="px-2">
                      <div
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        className="btn btn-default bg-white"
                      >
                        Details
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full pb-2 cursor-pointer mb-3">
                <p className="text-xl font-bold capitalize text-center">
                  No Assets Found
                </p>
              </div>
            )}
            {totalCount > limit && (
              <div className="mt-4 flex w-full justify-center">
                <Pagination
                  cPage={currentPage}
                  defaultPerPage={limit}
                  data={{ totalCount }}
                  onChange={handlePagination}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetsList;
