import { Link, useQueryParams } from "raviger";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { GENDER_TYPES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getPermittedFacility, getAllPatient } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { FacilityModel } from "../Facility/models";
import { PatientModel } from "../Patient/models";
import { limit } from "../Shifting/Commons";
import { AdminIcon } from "./Icons/AdminIcon";
import { BedIcon } from "./Icons/BedIcon";
import { CCTVIcon } from "./Icons/CCTVIcon";
import { WifiIcon } from "./Icons/WifiIcon";

export const TeleICUPatientsList = (props: any) => {
  const [qParams, setQueryParams] = useQueryParams();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const dispatchAction: any = useDispatch();
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const [viewOption, setViewOption] = useState("5-para");
  const [facilityData, setFacilityData] = useState<FacilityModel>();
  const [data, setPatientData] = useState<Array<PatientModel>>([]);
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = qParams.search
        ? {
            limit,
            offset,
            search_text: qParams.search,
            facility: props.facilityId,
          }
        : {
            limit,
            offset,
            facility: props.facilityId,
          };

      const [facilityResponse, patientsResponse] = await Promise.all([
        dispatchAction(getPermittedFacility(props.facilityId)),
        dispatchAction(getAllPatient(params, "Patient List")),
      ]);
      if (!status.aborted) {
        if (facilityResponse && facilityResponse.data) {
          setFacilityData(facilityResponse.data);
          setTotalCount(patientsResponse.data.count);
          setPatientData(patientsResponse.data.results);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, qParams.search, props.facilityId]
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
  const getPatientGender = (patientData: any) =>
    GENDER_TYPES.find((i) => i.id === patientData.gender)?.text;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center gap-2 flex-wrap justify-between mb-4">
        <PageTitle
          title={t(
            `${facilityData?.name ? facilityData.name + " - " : ""}Patient List`
          )}
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
        {isLoading
          ? Array.from({ length: 10 }, (_, index) => {
              // add loading card

              return (
                <div
                  key={index}
                  className="bg-white p-4 flex items-stretch gap-4"
                >
                  <div className="w-32 h-32 bg-gray-300 animate-pulse" />
                  <div>
                    <div className="h-5 w-28 bg-gray-300 animate-pulse"></div>
                    <div className="mt-2 h-2 w-12 bg-gray-300 animate-pulse"></div>
                  </div>
                </div>
              );
            })
          : data.map((item, index) => {
              return (
                <Link
                  key={item.id}
                  href={`/teleicu/facility/${props.facilityId}/patient/${item.id}`}
                >
                  <div className="bg-white rounded-lg flex items-center gap-4 p-4 text-gray-800">
                    <div className="w-32 self-stretch flex-shrink-0 bg-gray-300 text-lg flex flex-col items-center justify-center rounded">
                      <span className="">Bed No</span>
                      <span className="text-4xl font-bold">{7 + index}</span>
                    </div>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold">{item.name}</h1>
                      <p className="text-base gap-2 flex items-center text-gray-600 font-normal">
                        {item?.age} years
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>{" "}
                        {getPatientGender(item)}
                      </p>
                      <div className="flex items-start justify-between gap-2 my-4">
                        <p>
                          <span className="font-bold">Blood group:</span>{" "}
                          <span>{item?.blood_group}</span>
                        </p>
                        {item?.last_consultation && (
                          <>
                            <p>
                              <span className="font-bold">Weight:</span>{" "}
                              <span>{item?.last_consultation?.weight} kg</span>
                            </p>
                            <p>
                              <span className="font-bold">Height:</span>{" "}
                              <span>{item?.last_consultation?.height} cm</span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
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
