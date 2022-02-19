import { useQueryParams } from "raviger";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getPermittedFacilities } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { FacilityModel } from "../Facility/models";
import { limit } from "../Shifting/Commons";
import { AdminIcon } from "./Icons/AdminIcon";
import { BedIcon } from "./Icons/BedIcon";
import { CCTVIcon } from "./Icons/CCTVIcon";
import { WifiIcon } from "./Icons/WifiIcon";

export const TeleICUFacility = () => {
  const [qParams, setQueryParams] = useQueryParams();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const dispatchAction: any = useDispatch();
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const [viewOption, setViewOption] = useState("5-para");
  const [data, setData] = useState<Array<FacilityModel>>([]);
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = qParams.search
        ? {
            limit,
            offset,
            search_text: qParams.search,
            state: qParams.state,
            district: qParams.district,
            local_body: qParams.local_body,
            facility_type: qParams.facility_type,
            kasp_empanelled: qParams.kasp_empanelled,
          }
        : {
            limit,
            offset,
            state: qParams.state,
            district: qParams.district,
            local_body: qParams.local_body,
            facility_type: qParams.facility_type,
            kasp_empanelled: qParams.kasp_empanelled,
          };

      const res = await dispatchAction(getPermittedFacilities(params));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [
      dispatchAction,
      offset,
      qParams.search,
      qParams.kasp_empanelled,
      qParams.state,
      qParams.district,
      qParams.local_body,
      qParams.facility_type,
    ]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );
  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };
  console.log(data);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center gap-2 flex-wrap justify-between mb-4">
        <PageTitle
          title={t("Tele ICU Spoke Hospitals")}
          hideBack={true}
          className="sm:m-0 sm:p-0"
          breadcrumbs={false}
        />
        <div className="flex items-center gap-2">
          <h1 className="text-base font-medium">View Option</h1>

          <div className="flex items-center">
            <button
              className={`px-4 py-2 border block ${
                viewOption === "5-para"
                  ? "bg-primary-500 border-primary-500 rounded text-white"
                  : "bg-transparent border-primary-200"
              } `}
              onClick={() => setViewOption("5-para")}
            >
              5-Para
            </button>
            <button
              className={`px-4 py-2 border block ${
                viewOption === "personal"
                  ? "bg-primary-500 border-primary-500 rounded text-white"
                  : "bg-transparent border-primary-200"
              } `}
              onClick={() => setViewOption("personal")}
            >
              Personal
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-col-1 lg:grid-cols-2 gap-4">
        {data.map((item, index) => {
          return (
            <div key={item.id}>
              <div className="bg-white rounded-lg flex items-center gap-4 p-4">
                <div className="w-32 self-stretch flex-shrink-0 bg-gray-300 flex items-center justify-center rounded">
                  <i className="fas fa-hospital text-4xl block text-gray-600"></i>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold">{item.name}</h1>
                  <p className="text-base font-normal">
                    {item.district_object?.name}
                  </p>
                  <div className="flex items-start justify-between gap-2 my-4">
                    <div className="text-center">
                      <BedIcon className="h-8 text-primary-500 fill-current" />
                      <p className="mt-2 text-sm font-medium">12 / 20</p>
                    </div>
                    <CCTVIcon className="h-12 text-primary-500 fill-current" />
                    <WifiIcon className="h-8 text-primary-500 fill-current" />
                    <AdminIcon className="h-8 text-primary-500 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        {!isLoading && totalCount > limit && (
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
  );
};
