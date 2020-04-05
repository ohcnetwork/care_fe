import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import { navigate } from "hookrouter";
import moment from "moment";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SAMPLE_TEST_STATUS, ROLE_STATUS_MAP } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getTestList, patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { SampleListModel } from "./models";
import UpdateStatusDialog from "./UpdateStatusDialog";

const useStyles = makeStyles((theme) => ({
  paginateTopPadding: {
    paddingTop: "50px",
  },
}));

const statusChoices = [ ...SAMPLE_TEST_STATUS ];

const roleStatusMap = { ...ROLE_STATUS_MAP };

export default function SampleViewAdmin(props: any) {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageSamples: any = null;
  const [sample, setSample] = useState<Array<SampleListModel>>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [fetchFlag, callFetchData] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ show: boolean; sample: SampleListModel }>({ show: false, sample: {} });
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const userType: "Staff" | "DistrictAdmin" | "StateLabAdmin" = currentUser.data.user_type;

  const limit = 10;

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

  // const handleChange = (e: any) => {
  //   let results = { ...result };
  //   results[e.target.name] = e.target.value;
  //   setResult(results);
  // };

  const handleApproval = async (sample: SampleListModel, status: number, result: number) => {
    let sampleData: any = {
      id: sample.id,
      status,
      consultation: sample.consultation,
    };
    if (status === 7) {
      sampleData.result = result;
    }
    const statusName = SAMPLE_TEST_STATUS.find(i => i.id === status)?.desc;
    const res = await dispatch(patchSample(Number(sample.id), sampleData));
    if (res && (res.status === 201 || res.status === 200)) {
      Notification.Success({
        msg: `Success - ${statusName}`,
      });
      callFetchData(!fetchFlag);
    }
    dismissUpdateStatus();
  };

  const showUpdateStatus = (sample: SampleListModel) => {
    console.log(sample)
    setStatusDialog({
      show: true,
      sample,
    });
  }

  const dismissUpdateStatus = () => {
    setStatusDialog({
      show: false,
      sample: {},
    });
  }

  let sampleList: any[] = [];
  if (sample && sample.length) {
    sampleList = sample.map((item: SampleListModel, idx: number) => {
      const statusText = SAMPLE_TEST_STATUS.find(i => i.text === item.status)?.desc;
      const validStatusChoices = statusChoices
        .filter(i => roleStatusMap[userType].includes(i.text))
        .filter(i => i.id > Number(SAMPLE_TEST_STATUS.find(i => i.text === item.status)?.id))
      return (
        <div key={`usr_${item.id}`} className="w-full md:w-1/2 mt-4 px-2">
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
                {item.facility_object && (<div>
                  <span className="font-semibold leading-relaxed"> Facility - {item.facility_object.name} </span>
                  {/* ({item.facility_object.facility_type?.name || "-"}) */}
                </div>)}
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
                  {statusText}
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
                {!!validStatusChoices.length && (<div className="mt-2">
                  <button
                    onClick={(e) => showUpdateStatus(item)}
                    className="w-full text-sm bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow text-center"
                  >UPDATE SAMPLE TEST STATUS</button>
                </div>)}
                <div className="mt-2">
                  <button
                    onClick={(e) => navigate(`/samplelist/${item.id}`)}
                    className="w-full text-sm bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow text-center"
                  >View Sample Details</button>
                </div>
                <div className="mt-2">
                  <button
                    onClick={(e) => navigate(`/facility/${item.facility}/patient/${item.patient}`)}
                    className="w-full text-sm bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow text-center"
                  >View Patient Details</button>
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
        <h5 style={{ color: "red" }}>h
        Its looks like samples are empty, please visit once you submit a
        sample request
        </h5>
      </Grid>
    );
  }

  return (
    <div>
      {statusDialog.show && (<UpdateStatusDialog
        sample={statusDialog.sample}
        handleOk={handleApproval}
        handleCancel={dismissUpdateStatus}
        userType={userType}
      />)}
      <PageTitle title="Sample Management system" hideBack={true} />
      <div className="flex flex-wrap mt-4">{manageSamples}</div>
    </div>
  );
}
