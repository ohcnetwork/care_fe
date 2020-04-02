import React, { useEffect, useState, useCallback } from "react";
import Grid from "@material-ui/core/Grid";
import {
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Typography,
  Box
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { getFacilities, getAllPatient } from "../../Redux/actions";
import TitleHeader from "../Common/TitleHeader";
import Pagination from "../Common/Pagination";
import AddCard from "../Common/AddCard";
import { navigate } from "hookrouter";
import { Loading } from "../Common/Loading";
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

export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  const [data, setData] = useState(initialData);

  let managePatients: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const limit = 15;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getAllPatient({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
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

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      const patientUrl = facilityId
        ? `/facility/${patient.facility}/patient/${patient.id}`
        : `/patient/${patient.id}`;
      return (
        <div key={`usr_${patient.id}`} className="w-full md:w-1/2 mt-4 px-2">
          <div
            className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black"
            onClick={() => navigate(patientUrl)}
          >
            <CardHeader
              className={classes.cardHeader}
              title={
                <span className={classes.title}>
                  <Tooltip
                    title={
                      <span className={classes.toolTip}>{patient.name}</span>
                    }
                    interactive={true}
                  >
                    <span>{patient.name}</span>
                  </Tooltip>
                </span>
              }
            />
            <CardContent className={classes.content}>
              <Box>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Age -{" "}
                </span>
                <span>{patient.age}</span>
              </Box>
            </CardContent>
            <CardContent className={classes.content}>
              <Box>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Contact with Covid Patient -{" "}
                </span>
                <span>{patient.contact_with_carrier ? "Yes" : "No"}</span>
              </Box>
            </CardContent>
            <CardContent className={classes.content}>
              <Box>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Status -{" "}
                </span>
                <span>{patient.is_active ? "Active" : "Inactive"}</span>
              </Box>
            </CardContent>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !data) {
    managePatients = <Loading />;
  } else if (data && data.length) {
    managePatients = (
      <>
        {patientList}
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
    managePatients = (
      <Grid item xs={12} md={12} className={classes.displayFlex}>
        <Grid container justify="center" alignItems="center">
          <h5> No Patients Found</h5>
        </Grid>
      </Grid>
    );
  }

  return (
    <div className="px-2">
      <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500">
        Covid Suspects
      </div>

      <div className="flex flex-wrap mt-4">{managePatients}</div>
    </div>
  );
};
