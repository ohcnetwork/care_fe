import { Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import { navigate } from "hookrouter";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getFacilities } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { FacilityModel } from "./models";
import { InputSearchBox } from "../Common/SearchBox";

const useStyles = makeStyles((theme) => ({
  paginateTopPadding: {
    paddingTop: "50px",
  },
  displayFlex: {
    display: "flex",
  }
}));

export const HospitalList = () => {
  const classes = useStyles();
  const dispatchAction: any = useDispatch();
  const [data, setData] = useState<Array<FacilityModel>>([]);

  let manageFacilities: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getFacilities({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset]
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
  const onSearchSuspects = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatchAction(getFacilities({ limit, offset, search_text: searchValue }));
    if (res && res.data) {
      setData(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  }

  let facilityList: any[] = [];
  if (data && data.length) {
    facilityList = data.map((facility: any, idx: number) => {
      return (
        <div key={`usr_${facility.id}`} className="w-full md:w-1/2 mt-4 px-2">
          <div
            className="block rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 overflow-hidden"
            onClick={() => navigate(`/facility/${facility.id}`)}
          >
            <div className="h-full flex flex-col justify-between">
              <div className="px-6 py-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800">
                  {facility.facility_type}
                </div>
                <div className="font-black text-2xl capitalize mt-2">
                  {facility.name}
                </div>
                <div className="mt-2">
                  <div className="text-gray-500 leading-relaxed font-light">District:</div>
                  <div className="font-semibold">{facility.district_object?.name}</div>
                </div>
              </div>
              <div className="mt-2 bg-gray-50 border-t px-6 py-2">
                <div className="flex py-4 justify-between">
                  <div>
                    <div className="text-gray-500 leading-relaxed">Phone:</div>
                    <div className="font-semibold">{facility.phone_number || "-"}</div>
                  </div>
                  <span className="inline-flex rounded-md shadow-sm">
                    <button type="button" className="inline-flex items-center px-3 py-2 border border-green-500 text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:text-green-500 focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800 active:bg-gray-50 transition ease-in-out duration-150">
                      View Facility
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !data) {
    manageFacilities = <Loading />;
  } else if (data && data.length) {
    manageFacilities = (
      <>
        {facilityList}
        {totalCount > limit && (
          <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </Grid>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    manageFacilities = (
      <div>
        <div
          className="p-16 mt-4 bg-white shadow rounded-md shadow border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300"
          onClick={() => navigate("/facility/create")}
        >
          Create a new facility
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <div className="font-bold text-3xl">
        Facilities
      </div>
      <InputSearchBox
        search={onSearchSuspects}
        placeholder='Search by facility / district'
        errors=''
      />
      <div className="flex flex-wrap -mx-2 mt-2">{manageFacilities}</div>
    </div>
  );
};
