import {
  Box,
  Button,
  CardContent,
  CardHeader,
  Grid,
  InputLabel,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { navigate } from "hookrouter";
import moment from "moment";
import React, { MouseEvent, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SAMPLE_TEST_RESULT } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getTestList, patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import AlertDialog from "../Common/AlertDialog";
import { NativeSelectField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: "8px",
  },
  card: {
    height: 160,
    width: "100%",
    backgroundColor: "#FFFFFF",
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
      width: "12vw",
    },
    [theme.breakpoints.down("sm")]: {
      width: "12vw",
    },
    [theme.breakpoints.down("xs")]: {
      width: "65vw",
    },
  },
  content: {
    padding: "5px 10px",
  },
  cardHeader: {
    padding: "10px",
  },
  contentText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "inline-block",
  },
  spacing: {
    marginLeft: theme.spacing(1),
  },
  margin: {
    margin: theme.spacing(1),
  },
  addUserCard: {
    marginTop: "50px",
  },
  paginateTopPadding: {
    paddingTop: "50px",
  },
  userCardSideTitle: {
    fontSize: "13px",
  },
  toolTip: {
    fontSize: "13px",
  },
}));

export default function SampleViewAdmin(props: any) {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageSamples: any = null;
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const [sample, setSample] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<any>({});
  const [fetchFlag, callFetchData] = useState(false);
  const [showAlertMessage, setAlertMessage] = useState({
    show: false,
    message: "",
    title: "",
  });
  const [selectedStatus, setSelectedStatus] = useState<{
    status: number;
    sample: any;
  }>({ status: 0, sample: null });

  const limit = 10;

  const resultTypes = [
    {
      id: 0,
      text: "Select",
    },
    ...SAMPLE_TEST_RESULT,
  ];

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
    [fetchData, fetchFlag]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const handleChange = (e: any) => {
    let results = { ...result };
    results[e.target.name] = e.target.value;
    setResult(results);
  };

  const dismissAlert = () => {
    setAlertMessage({
      show: false,
      message: "",
      title: "",
    });
  };

  const handleApproval = () => {
    const { status, sample } = selectedStatus;
    const sampleData = {
      id: sample.id,
      status,
      consultation: sample.consultation_id,
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
          msg: `Request ${statusName}`,
        });
        // window.location.reload();
        callFetchData(!fetchFlag);
      }
    });
    dismissAlert();
  };

  const handleComplete = (status: number, sample: any, result: number) => {
    const sampleData = {
      id: sample.id,
      status,
      result,
      consultation: sample.consultation_id,
    };
    let statusName = "";
    if (status === 7) {
      statusName = "COMPLETED";
    }
    dispatch(patchSample(sample.id, sampleData)).then((resp: any) => {
      if (resp.status === 201 || resp.status === 200) {
        Notification.Success({
          msg: `Request ${statusName}`,
        });
        // window.location.reload();
        callFetchData(!fetchFlag);
      }
    });
  };

  const confirmApproval = (
    e: MouseEvent,
    status: number,
    sample: any,
    msg: string
  ) => {
    e.stopPropagation();
    setSelectedStatus({ status, sample });
    setAlertMessage({
      show: true,
      message: `Are you sure you want to change the status to ${msg}`,
      title: "Confirm",
    });
  };

  let user = currentUser.data;
  let sampleList: any[] = [];
  if (sample && sample.length) {
    sampleList = sample.map((sample: any, idx: number) => {
      return (
        <div key={`usr_${sample.id}`} className="w-full md:w-1/2 mt-4 px-2">
          <div
            onClick={(e) => navigate(`/samplelist/${sample.id}`)}
            className={`block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 p-4 text-black ${
              sample.result === "POSITIVE" ? "border-red-700 bg-red-100" : ""
            } ${
              sample.result === "NEGATIVE"
                ? "border-green-700 bg-green-100"
                : ""
            }`}
          >
            <CardHeader
              className={classes.cardHeader}
              // onClick={(e) => {
              //   e.stopPropagation();
              //   navigate(`/facility/${sample.facility}/patient/${sample.patient}`)
              // }}
              title={
                <span className={classes.title}>
                  <Tooltip
                    title={
                      <span className={classes.toolTip}>
                        {sample.patient_name}
                      </span>
                    }
                    interactive={true}
                  >
                    <span>{sample.patient_name}</span>
                  </Tooltip>
                </span>
              }
            />
            <div className="px-2">
              {sample.fast_track && (
                <div className="md:col-span-2">
                  <span className="font-semibold leading-relaxed">
                    Fast track:{" "}
                  </span>
                  {sample.fast_track}
                </div>
              )}
              <div>
                <span className="font-semibold leading-relaxed">
                  Contact with confirmed carrier:{" "}
                </span>
                {sample.patient_has_confirmed_contact ? (
                  <span className="badge badge-pill badge-warning">Yes</span>
                ) : (
                  <span className="badge badge-pill badge-secondary">No</span>
                )}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Contact with suspected carrier:{" "}
                </span>
                {sample.patient_has_suspected_contact ? (
                  <span className="badge badge-pill badge-warning">Yes</span>
                ) : (
                  <span className="badge badge-pill badge-secondary">No</span>
                )}
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Has SARI?:{" "}
                </span>
                {sample.patient_has_sari ? (
                  <span className="badge badge-pill badge-warning">Yes</span>
                ) : (
                  <span className="badge badge-pill badge-secondary">No</span>
                )}
              </div>
              {sample.patient_travel_history && (
                <div className="md:col-span-2">
                  <span className="font-semibold leading-relaxed">
                    Countries travelled:{" "}
                  </span>
                  {sample.patient_travel_history}
                </div>
              )}
            </div>

            <CardContent>
              {sample.status === "REQUEST_SUBMITTED" &&
                user.user_type === "DistrictAdmin" && (
                  <Button
                    style={{ color: "green" }}
                    variant="outlined"
                    onClick={(e) => confirmApproval(e, 2, sample, "Approve")}
                  >
                    Approve
                  </Button>
                )}{" "}
              {sample.status === "REQUEST_SUBMITTED" &&
                user.user_type === "DistrictAdmin" && (
                  <Button
                    style={{ color: "red" }}
                    variant="outlined"
                    onClick={(e) => confirmApproval(e, 3, sample, "Deny")}
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
                    onClick={(e) =>
                      confirmApproval(e, 5, sample, "Received and forwarded")
                    }
                  >
                    Received and forwarded
                  </Button>
                </CardContent>
              )}
            {sample.status === "RECEIVED_AND_FORWARED" &&
              user.user_type === "StateLabAdmin" && (
                <CardContent>
                  <Button
                    style={{ color: "red" }}
                    variant="outlined"
                    onClick={(e) =>
                      confirmApproval(e, 6, sample, "Received at lab")
                    }
                  >
                    Received at lab
                  </Button>
                </CardContent>
              )}
            {sample.status === "RECEIVED_AT_LAB" &&
              user.user_type === "StateLabAdmin" && (
                <>
                  <CardContent>
                    <Box display="flex">
                      <Box flex="1" style={{ marginRight: "4px" }}>
                        <InputLabel id="result-select-label">Result</InputLabel>
                        <NativeSelectField
                          name={sample.id.toString()}
                          variant="outlined"
                          value={result[sample.id.toString()]}
                          options={resultTypes}
                          onChange={handleChange}
                        />
                      </Box>
                      <Button
                        style={{ color: "red" }}
                        variant="outlined"
                        disabled={!result[sample.id.toString()]}
                        onClick={(e) =>
                          handleComplete(
                            7,
                            sample,
                            Number(result[sample.id.toString()])
                          )
                        }
                      >
                        Completed
                      </Button>
                    </Box>
                  </CardContent>
                </>
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
            {sample.date_of_sample && (
              <CardContent className={classes.content}>
                <Typography>
                  <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                    Date Of Sample -{" "}
                  </span>
                  {moment(sample.date_of_sample).format("lll")}
                </Typography>
              </CardContent>
            )}
            <div className="mt-2">
              <div className="px-4 py-2 bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center">
                View Patient Details
              </div>
            </div>
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
      {showAlertMessage.show && (
        <AlertDialog
          title={showAlertMessage.title}
          message={showAlertMessage.message}
          handleClose={() => handleApproval()}
          handleCancel={() => dismissAlert()}
        />
      )}
      <PageTitle title="Sample Management system" hideBack={true} />
      <div className="flex flex-wrap mt-4">{manageSamples}</div>
    </div>
  );
}
