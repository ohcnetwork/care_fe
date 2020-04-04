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
import { FacilityModal } from "./models";

const useStyles = makeStyles((theme) => ({
  paginateTopPadding: {
    paddingTop: "50px",
  },
  displayFlex: {
    display: "flex",
  },
}));

export const HospitalList = () => {
  const classes = useStyles();
  const dispatchAction: any = useDispatch();
  const [data, setData] = useState<Array<FacilityModal>>([]);

  let manageFacilities: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const limit = 15;

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

  let facilityList: any[] = [];
  if (data && data.length) {
    facilityList = data.map((facility: any, idx: number) => {
      return (
        <div key={`usr_${facility.id}`} className="w-full md:w-1/2 mt-4 px-2">
          <div
            className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black"
            onClick={() => navigate(`/facility/${facility.id}`)}
          >
            <div className="px-6 py-4 h-full flex flex-col justify-between">
              <div>
                <div className="font-bold text-xl capitalize mb-2">
                  {facility.name}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    District:{" "}
                  </span>
                  {facility.district_object?.name}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    Facility Type:{" "}
                  </span>
                  {facility.facility_type}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">Phone: </span>
                  {facility.phone_number || "-"}
                </div>
              </div>
              <div className="mt-2">
                <Button size="small" variant="outlined" fullWidth>
                  View Hospital
                </Button>
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
      <PageTitle title="Facilities" hideBack={true} />
      <div className="flex flex-wrap mt-4">{manageFacilities}</div>
    </div>
  );
};
