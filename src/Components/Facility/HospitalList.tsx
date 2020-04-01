import React, { useState, useCallback } from "react";
import Grid from "@material-ui/core/Grid";
import {
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { getFacilities } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { navigate } from "hookrouter";
import { Loading } from "../Common/Loading";
import { FacilityModal } from "./models";
import { useAbortableEffect, statusType } from "../../Common/utils";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: "8px"
  },
  card: {
    height: 160,
    width: "100%",
    backgroundColor: "#FFFFFF",
    cursor: "pointer"
  },
  title: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontWeight: 400,
    //padding: '10px',
    //fontSize: '14px',
    display: "inline-block",
    [theme.breakpoints.up("md")]: {
      width: "12vw"
    },
    [theme.breakpoints.down("sm")]: {
      width: "40vw"
    },
    [theme.breakpoints.down("xs")]: {
      width: "65vw"
    }
  },
  content: {
    padding: "5px 10px"
  },
  cardHeader: {
    padding: "10px"
  },
  contentText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "inline-block",
    [theme.breakpoints.up("md")]: {
      width: "10vw"
    },
    [theme.breakpoints.down("sm")]: {
      width: "40vw"
    },
    [theme.breakpoints.down("xs")]: {
      width: "40vw"
    }
  },
  spacing: {
    marginLeft: theme.spacing(1)
  },
  margin: {
    margin: theme.spacing(1)
  },
  addUserCard: {
    marginTop: "50px"
  },
  paginateTopPadding: {
    paddingTop: "50px"
  },
  userCardSideTitle: {
    fontSize: "13px"
  },
  toolTip: {
    fontSize: "13px"
  },
  displayFlex: {
    display: "flex"
  },
  minHeight: {
    minHeight: "65vh"
  }
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
        <div key={`usr_${facility.id}`} className="w-1/2 mt-4 px-2">
          <div
            className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black"
            onClick={() => navigate(`/facility/${facility.id}`)}
          >
            <CardHeader
              className={classes.cardHeader}
              title={
                <span className={classes.title}>
                  <Tooltip
                    title={
                      <span className={classes.toolTip}>{facility.name}</span>
                    }
                    interactive={true}
                  >
                    <span>{facility.name}</span>
                  </Tooltip>
                </span>
              }
            />
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  District -{" "}
                </span>
                {facility?.district_object?.name}
              </Typography>
            </CardContent>
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Facility Type -{" "}
                </span>
                {facility.facility_type}
              </Typography>
            </CardContent>
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Contact -{" "}
                </span>
                {facility.phone_number}
              </Typography>
            </CardContent>
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
      <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500">
        Facilities
      </div>
      <div className="flex flex-wrap mt-4">{manageFacilities}</div>
    </div>
  );
};
