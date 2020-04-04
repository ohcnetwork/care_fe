import { Box, Button, CardContent, CardHeader, Grid, InputLabel, Tooltip, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { navigate } from "hookrouter";
import moment from "moment";
import React, { MouseEvent, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SAMPLE_TEST_RESULT, SAMPLE_TEST_STATUS } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getTestList, patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import AlertDialog from "../Common/AlertDialog";
import { NativeSelectField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import { SampleListModel } from "./models";

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
  const [sample, setSample] = useState<Array<SampleListModel>>(initialData);
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
    if (status === 7) {
      handleComplete();
      return;
    }
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

  const handleComplete = () => {
    const { status, sample } = selectedStatus;
    const sampleData = {
      id: sample.id,
      status,
      result: Number(result[sample.id.toString()]),
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
    dismissAlert();
  };

  const confirmApproval = (e: MouseEvent, status: number, sample: any, msg: string) => {
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
    sampleList = sample.map((item: SampleListModel, idx: number) => {
      return (
        <div key={`usr_itemid}`} className="w-full md:w-1/2 mt-4 px-2">
          <div
            className={`block border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black ${
              item.result === "POSITIVE" ? "border-red-700 bg-red-100" : ""
              } ${
              item.result === "NEGATIVE"
                ? "border-green-700 bg-green-100"
                : ""
              }`}
          >
            <div className="px-6 py-4 h-full flex flex-col justify-between">
              <div>
                <div className="font-bold text-xl capitalize mb-2">
                  {item.patient_name}
                </div>
                {item.fast_track && (<div>
                  <span className="font-semibold leading-relaxed">
                    Fast track:{" "}
                  </span>
                  {item.fast_track}
                </div>)}
                {item.patient_has_confirmed_contact && (
                  <div className="flex">
                    <span className="font-semibold leading-relaxed">
                      Contact with confirmed carrier
                    </span>
                    <WarningRoundedIcon className="text-red-500"></WarningRoundedIcon>
                  </div>
                )}
                {item.patient_has_suspected_contact &&
                  !item.patient_has_confirmed_contact && (
                    <div className="flex">
                      <span className="font-semibold leading-relaxed">
                        Contact with suspected carrier
                      </span>
                      <WarningRoundedIcon className="text-yellow-500"></WarningRoundedIcon>
                    </div>
                  )}
                {item.patient_has_sari && (<div>
                  <span className="font-semibold leading-relaxed">
                    Severe Acute Respiratory illness
                  </span>
                  <WarningRoundedIcon className="text-yellow-500"></WarningRoundedIcon>
                </div>)}
                {item.patient_travel_history && (
                  <div className="md:col-span-2">
                    <span className="font-semibold leading-relaxed">
                      Countries travelled:{" "}
                    </span>
                    {item.patient_travel_history.split(',').join(', ')}
                  </div>
                )}
                <div>
                  <span className="font-semibold leading-relaxed">
                    Status:{" "}
                  </span>
                  {item.status ? SAMPLE_TEST_STATUS[item.status] : "-"}
                </div>
                <div className="capitalize">
                  <span className="font-semibold leading-relaxed">
                    Result:{" "}
                  </span>
                  {item.result ? item.result.toLocaleLowerCase() : "-"}
                </div>
                {item.date_of_sample && (<div>
                  <span className="font-semibold leading-relaxed">
                    Date Of Sample :{" "}
                  </span>
                  {moment(item.date_of_sample).format("lll")}
                </div>)}
              </div>

              <div className="mt-2">
                {item.status === "REQUEST_SUBMITTED" &&
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
                  {item.status === "SENT_TO_COLLECTON_CENTRE" &&
                    user.user_type === "DistrictAdmin" && (
                      <Button
                        fullWidth
                        style={{ color: "red" }}
                        variant="outlined"
                        onClick={(e) => confirmApproval(e, 5, sample, "Received and forwarded")}
                      >Received and forwarded</Button>
                    )}
                  {item.status === "RECEIVED_AND_FORWARED" &&
                    user.user_type === "StateLabAdmin" && (
                      <Button
                        fullWidth
                        style={{ color: "red" }}
                        variant="outlined"
                        onClick={(e) => confirmApproval(e, 6, sample, "Received at lab")}
                      >Received at lab</Button>
                    )}
                  {item.status === "RECEIVED_AT_LAB" &&
                    user.user_type === "StateLabAdmin" && (<div className="grid grid-cols-2 gap-2">
                      <div>
                        <InputLabel id="result-select-label">Result</InputLabel>
                        <NativeSelectField
                          name={String(item.id)}
                          variant="outlined"
                          value={result[String(item.id)]}
                          options={resultTypes}
                          onChange={handleChange}
                        />
                      </div>
                      <Button
                        fullWidth
                        style={{ color: "red" }}
                        variant="outlined"
                        disabled={!result[String(item.id)]}
                        onClick={(e) => confirmApproval(e, 7, sample, "Complete")}
                      >Complete</Button>
                    </div>)}
                </div>
                <div className="mt-2">
                  <div
                    onClick={(e) => navigate(`/facility/${item.facility}/patient/${item.patient}/sample/${item.id}`)}
                    className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
                  >View Patient Details</div>
                </div>
                <div className="mt-2">
                  <div
                    onClick={(e) => navigate(`/samplelist/${item.id}`)}
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
