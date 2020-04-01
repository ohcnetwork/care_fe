import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Tooltip,
  Button,
  InputLabel
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Pagination from "../Common/Pagination";
import TitleHeader from "../Common/TitleHeader";
import { getTestList, patchSample } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import { useAbortableEffect, statusType } from "../../Common/utils";
import * as Notification from "../../Utils/Notifications";
import {
  ErrorHelperText,
  NativeSelectField
} from "../Common/HelperInputFields";
import { SAMPLE_TEST_RESULT } from "../../Common/constants";

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
      width: "12vw"
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
    display: "inline-block"
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

export default function SampleViewAdmin(props: any) {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageSamples: any = null;
  const state: any = useSelector(state => state);
  const { currentUser } = state;
  const [sample, setSample] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState(initialData);
  const limit = 15;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getTestList({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setSample(res.data.results);
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

  const handleApproval = (status: number, sample: any, result: any) => {
    const sampleData = {
      id: sample.id,
      status,
      result: result || null,
      date_of_sample: null,
      date_of_result: null,
      consultation: sample.consultation_id
    };
    let statusName = "";
    if (status === 2) {
      statusName = "Approved";
    }
    if (status === 3) {
      statusName = "Denied";
    }
    if (status === 5) {
      statusName = "RECEIVED AND FORWARED";
    }
    if (status === 6) {
      statusName = "RECEIVED AT LAB";
    }
    if (status === 7) {
      statusName = "COMPLETED";
    }
    dispatch(patchSample(sample.id, sampleData)).then((resp: any) => {
      if (resp.status === 201 || resp.status === 200) {
        Notification.Success({
          msg: `Request ${statusName}`
        });
        window.location.reload();
      }
    });
  };
  let user = currentUser.data;
  let sampleList: any[] = [];
  if (sample && sample.length) {
    sampleList = sample.map((sample: any, idx: number) => {
      return (
        <div key={`usr_${sample.id}`} className="w-1/2 mt-4 px-2">
          <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black">
            <CardHeader
              className={classes.cardHeader}
              title={
                <span className={classes.title}>
                  <Tooltip
                    title={
                      <span className={classes.toolTip}>
                        Patient Name -{sample.patient_name}
                      </span>
                    }
                    interactive={true}
                  >
                    <span>{sample.patient_name}</span>
                  </Tooltip>
                </span>
              }
            />

            <CardContent>
              {sample.status === "REQUEST_SUBMITTED" &&
                user.user_type === "DistrictAdmin" && (
                  <Button
                    style={{ color: "green" }}
                    variant="outlined"
                    onClick={e => handleApproval(2, sample, null)}
                  >
                    Approve
                  </Button>
                )}{" "}
              {sample.status === "REQUEST_SUBMITTED" &&
                user.user_type === "DistrictAdmin" && (
                  <Button
                    style={{ color: "red" }}
                    variant="outlined"
                    onClick={e => handleApproval(3, sample, 4)}
                  >
                    Deny
                  </Button>
                )}
            </CardContent>
            {sample.status === "SENT_TO_COLLECTON_CENTRE" &&
              user.user_type === "DistrictAdmin" && (
                <CardContent>
                  <Button
                    style={{ color: "red" }}
                    variant="outlined"
                    onClick={e => handleApproval(5, sample, null)}
                  >
                    Recieved and forwarded
                  </Button>
                </CardContent>
              )}
            {sample.status === "RECEIVED_AND_FORWARED" &&
              user.user_type === "StateLabAdmin" && (
                <CardContent>
                  <Button
                    style={{ color: "red" }}
                    variant="outlined"
                    onClick={e => handleApproval(6, sample, null)}
                  >
                    Recieved at lab
                  </Button>
                </CardContent>
              )}
            {sample.status === "RECEIVED_AT_LAB" &&
              user.user_type === "StateLabAdmin" && (
                <CardContent>
                  <Button
                    style={{ color: "red" }}
                    variant="outlined"
                    onClick={e => handleApproval(7, sample, null)}
                  >
                    Completed
                  </Button>
                </CardContent>
              )}
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Status -{" "}
                </span>
                {sample.status}
              </Typography>
            </CardContent>
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Result -{" "}
                </span>
                {sample.result}
              </Typography>
            </CardContent>
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Date Of Sample -{" "}
                </span>
                {sample.date_of_sample}
              </Typography>
            </CardContent>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !sample) {
    manageSamples = <Loading />;
  } else if (sample && sample.length) {
    manageSamples = (
      <>
        {sampleList}
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
  } else if (sample && sample.length === 0) {
    manageSamples = (
      <Grid item xs={12} md={12} className="textMarginCenter">
        <h5 style={{ color: "red" }}>
          Its looks like samples are empty, please visit once you submit a
          sample request
        </h5>
      </Grid>
    );
  }

  return (
    <div>
      <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500">
        Sample Collection
      </div>

      <div className="flex flex-wrap mt-4">{manageSamples}</div>
    </div>
  );
}
