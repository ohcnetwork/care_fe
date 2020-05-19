import { CardContent, CardHeader, Grid, Tooltip, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getAmbulanceList } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { navigate } from "hookrouter";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: "8px"
  },
  card: {
    height: 160,
    width: "100%",
    backgroundColor: "#FFFFFF"
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
  }
}));

export default function AmbulanceList(props: any) {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageAmbulances: any = null;
  const [ambulances, setAmbulances] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getAmbulanceList({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setAmbulances(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, offset]
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

  const addAmbulance = (<div className="w-full md:w-1/2 mt-4 px-2">
    <div
      className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:bg-gray-300 font-semibold flex justify-center items-center text-black"
      onClick={() => navigate("/ambulance/add")}
    >
      Onboard New Ambulance
    </div>
  </div>);


  let ambulanceList: any[] = [];
  if (ambulances && ambulances.length) {
    ambulanceList = ambulances.map((ambulance: any, idx: number) => {
      return (
        <div key={`usr_${ambulance.id}`} className="w-full md:w-1/2 mt-4 px-2">
          <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black">
            <CardHeader
              className={classes.cardHeader}
              title={
                <span className={classes.title}>
                  <Tooltip
                    title={
                      <span className={classes.toolTip}>
                        {ambulance.vehicle_number}
                      </span>
                    }
                    interactive={true}
                  >
                    <span>{ambulance.vehicle_number}</span>
                  </Tooltip>
                </span>
              }
            />
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Owner Name{" "}
                </span>
                {ambulance.owner_name}
              </Typography>
            </CardContent>
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Owner Number{" "}
                </span>
                {ambulance.owner_phone_number}
              </Typography>
            </CardContent>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !ambulances) {
    manageAmbulances = <Loading />;
  } else if (ambulances && ambulances.length) {
    manageAmbulances = (
      <>
        {addAmbulance}
        {ambulanceList}
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
      </>
    );
  } else if (ambulances && ambulances.length === 0) {
    manageAmbulances = (
      <Grid item xs={12} md={12} className="textMarginCenter">
        <h5 style={{ color: "red" }}>
          {" "}
          You are not Authorised to access this Page
        </h5>
      </Grid>
    );
  }

  return (
    <div>
      <PageTitle title="Ambulances" hideBack={true} />

      <div className="flex flex-wrap mt-4">{manageAmbulances}</div>
    </div>
  );
}
