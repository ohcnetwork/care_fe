import { Box, Button, CardContent, CardHeader, Grid, InputLabel, Tooltip, Typography } from "@material-ui/core";
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
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";

const useStyles = makeStyles((theme) => ({
  paginateTopPadding: {
    paddingTop: "50px",
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
            className={`block border rounded-lg bg-white shadow h-full hover:border-primary-500 p-4 text-black ${
              sample.result === "POSITIVE" ? "border-red-700 bg-red-100" : ""
              } ${
              sample.result === "NEGATIVE"
                ? "border-green-700 bg-green-100"
                : ""
              }`}
          >
            <div className="px-6 py-4 h-full flex flex-col justify-between">
              <div>
                <div className="font-bold text-xl capitalize mb-2">
                  {sample.patient_name}
                </div>
                {sample.fast_track && (<div>
                  <span className="font-semibold leading-relaxed">
                    Fast track:{" "}
                  </span>
                  {sample.fast_track}
                </div>)}
                {sample.contact_with_confirmed_carrier && (
                  <div className="flex">
                    <span className="font-semibold leading-relaxed">
                      Contact with confirmed carrier
                    </span>
                    <WarningRoundedIcon className="text-red-500"></WarningRoundedIcon>
                  </div>
                )}
                {sample.contact_with_suspected_carrier &&
                  !sample.contact_with_confirmed_carrier && (
                    <div className="flex">
                      <span className="font-semibold leading-relaxed">
                        Contact with suspected carrier
                      </span>
                      <WarningRoundedIcon className="text-yellow-500"></WarningRoundedIcon>
                    </div>
                  )}
                {sample.patient_has_sari && (<div>
                  <span className="font-semibold leading-relaxed">
                    Has SARI (Severe Acute Respiratory illness)?
                      </span>
                  <WarningRoundedIcon className="text-yellow-500"></WarningRoundedIcon>
                </div>)}
                {sample.patient_travel_history && (
                  <div className="md:col-span-2">
                    <span className="font-semibold leading-relaxed">
                      Countries travelled:{" "}
                    </span>
                    {sample.patient_travel_history.split(',').join(', ')}
                  </div>
                )}
                <div>
                  <span className="font-semibold leading-relaxed">
                    Status:{" "}
                  </span>
                  {sample.status}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    Result:{" "}
                  </span>
                  {sample.result}
                </div>
                {sample.date_of_sample && (<div>
                  <span className="font-semibold leading-relaxed">
                    Date Of Sample :{" "}
                  </span>
                  {moment(sample.date_of_sample).format("lll")}
                </div>)}
              </div>

              <div className="mt-2">
                {sample.status === "REQUEST_SUBMITTED" &&
                  user.user_type === "DistrictAdmin" && (<div className="grid grid-cols-2 gap-2">
                    <div className="flex-1">
                      <Button
                        fullWidth
                        style={{ color: "green" }}
                        variant="outlined"
                        onClick={(e) => confirmApproval(e, 2, sample, "Approve")}
                      >Approve</Button>
                    </div>
                    <div className="flex-1">
                      <Button
                        fullWidth
                        style={{ color: "red" }}
                        variant="outlined"
                        onClick={(e) => confirmApproval(e, 3, sample, "Deny")}
                      >Deny</Button>
                    </div>
                  </div>)}
                <div>
                  {sample.status === "SENT_TO_COLLECTON_CENTRE" &&
                    user.user_type === "DistrictAdmin" && (
                      <Button
                        fullWidth
                        style={{ color: "red" }}
                        variant="outlined"
                        onClick={(e) =>
                          confirmApproval(e, 5, sample, "Received and forwarded")
                        }
                      >Received and forwarded</Button>
                    )}
                  {sample.status === "RECEIVED_AND_FORWARED" &&
                    user.user_type === "StateLabAdmin" && (
                      <Button
                        fullWidth
                        style={{ color: "red" }}
                        variant="outlined"
                        onClick={(e) =>
                          confirmApproval(e, 6, sample, "Received at lab")
                        }
                      >Received at lab</Button>
                    )}
                  {sample.status === "RECEIVED_AT_LAB" &&
                    user.user_type === "StateLabAdmin" && (<div className="grid grid-cols-2 gap-2">
                      <div>
                        <InputLabel id="result-select-label">Result</InputLabel>
                        <NativeSelectField
                          name={sample.id.toString()}
                          variant="outlined"
                          value={result[sample.id.toString()]}
                          options={resultTypes}
                          onChange={handleChange}
                        />
                      </div>
                      <Button
                        fullWidth
                        style={{ color: "red" }}
                        variant="outlined"
                        disabled={!result[sample.id.toString()]}
                        onClick={(e) => handleComplete(7, sample, Number(result[sample.id.toString()]))}
                      >Complete</Button>
                    </div>)}
                </div>
                <div className="mt-2">
                  <div
                    onClick={(e) => navigate(`/facility/${sample.facility}/patient/${sample.patient}/sample/${sample.id}`)}
                    className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
                  >View Patient Details</div>
                </div>
                <div className="mt-2">
                  <div
                    onClick={(e) => navigate(`/samplelist/${sample.id}`)}
                    className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
                  >View Sample Details</div>
                </div>
              </div>
            </div>
          </div>
        </div >
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
