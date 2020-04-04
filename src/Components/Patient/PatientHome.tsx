import { Button, CircularProgress, Grid, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { navigate } from "hookrouter";
import moment from "moment";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { GENDER_TYPES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getConsultationList, getPatient, getSampleTestList, patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import AlertDialog from "../Common/AlertDialog";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { ConsultationCard } from "../Facility/ConsultationCard";
import { ConsultationModal } from "../Facility/models";
import { PatientModel, SampleTestModel } from "./models";
import { SampleTestCard } from "./SampleTestCard";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: "8px"
  },
  margin: {
    margin: theme.spacing(1)
  },
  displayFlex: {
    display: "flex"
  },
  content: {
    marginTop: "10px",
    maxWidth: "560px",
    background: "white",
    padding: "20px 20px 5px"
  },
  title: {
    padding: "5px",
    marginBottom: "10px"
  },
  details: {
    marginTop: "10px",
    padding: "5px",
    marginBottom: "10px"
  },
  paginateTopPadding: {
    paddingTop: "50px"
  },
}));

export const PatientHome = (props: any) => {
  const { facilityId, id } = props;
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [consultationListData, setConsultationListData] = useState<Array<ConsultationModal>>([]);
  const [sampleListData, setSampleListData] = useState<Array<SampleTestModel>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalConsultationCount, setTotalConsultationCount] = useState(0);
  const [currentConsultationPage, setCurrentConsultationPage] = useState(1);
  const [consultationOffset, setConsultationOffset] = useState(0);
  const [totalSampleListCount, setTotalSampleListCount] = useState(0);
  const [currentSampleListPage, setCurrentSampleListPage] = useState(1);
  const [sampleListOffset, setSampleListOffset] = useState(0);
  const [isConsultationLoading, setIsConsultationLoading] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [sampleFlag, callSampleList] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{ status: number, sample: any }>({ status: 0, sample: null });
  const [showAlertMessage, setAlertMessage] = useState({
    show: false,
    message: "",
    title: "",
  });

  const limit = 5;

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const patientRes = await dispatch(getPatient({ id }));
      if (!status.aborted) {
        if (patientRes && patientRes.data) {
          setPatientData(patientRes.data);
        }
        setIsLoading(false);
      }
    },
    [dispatch, id]
  );

  const fetchConsultation = useCallback(
    async (status: statusType) => {
      setIsConsultationLoading(true);
      const consultationRes = await dispatch(getConsultationList({ patient: id, limit, offset: consultationOffset }));
      if (!status.aborted) {
        if (
          consultationRes &&
          consultationRes.data &&
          consultationRes.data.results
        ) {
          setConsultationListData(consultationRes.data.results);
          setTotalConsultationCount(consultationRes.data.count);
        }
        setIsConsultationLoading(false);
      }
    },
    [dispatch, id, consultationOffset]
  );

  const fetchSampleTest = useCallback(
    async (status: statusType) => {
      setIsSampleLoading(true);
      const sampleRes = await dispatch(getSampleTestList({ limit, offset: sampleListOffset }, { patientId: id }));
      if (!status.aborted) {
        if (sampleRes && sampleRes.data && sampleRes.data.results) {
          setSampleListData(sampleRes.data.results);
          setTotalSampleListCount(sampleRes.data.count);
        }
        setIsSampleLoading(false);
      }
    },
    [dispatch, id, sampleListOffset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchpatient(status);
    },
    [dispatch, fetchpatient]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchConsultation(status);
    },
    [dispatch, fetchConsultation]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchSampleTest(status);
    },
    [dispatch, fetchSampleTest, sampleFlag]
  );

  const handleConsultationPagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentConsultationPage(page);
    setConsultationOffset(offset);
  };

  const handleSampleListPagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentSampleListPage(page);
    setSampleListOffset(offset);
  };

  const dismissAlert = () => {
    setAlertMessage({
      show: false,
      message: "",
      title: "",
    })
  };

  const confirmApproval = (status: number, sample: any) => {
    setSelectedStatus({ status, sample });
    setAlertMessage({
      show: true,
      message: `Are you sure you want to sent the sample to Collection Centre?`,
      title: "Confirm",
    });
  }

  const handleApproval = () => {
    const { status, sample } = selectedStatus;
    const sampleData = {
      id: sample.id,
      status,
      consultation: sample.consultation
    };
    let statusName = "";
    if (status === 4) {
      statusName = "SENT_TO_COLLECTON_CENTRE";
    }

    dispatch(patchSample(Number(sample.id), sampleData)).then((resp: any) => {
      if (resp.status === 201 || resp.status === 200) {
        Notification.Success({
          msg: `Request ${statusName}`
        });
        // window.location.reload();
        callSampleList(!sampleFlag);
      }
    });

    dismissAlert()
  };

  if (isLoading) {
    return <Loading />;
  }

  const patientGender = GENDER_TYPES.find(i => i.id === patientData.gender)
    ?.text;

  let patientMedHis: any[] = [];
  if (
    patientData &&
    patientData.medical_history &&
    patientData.medical_history.length
  ) {
    const medHis = patientData.medical_history;
    patientMedHis = medHis.map((item: any, idx: number) => (
      <tr className="white border" key={`med_his_${idx}`}>
        <td className="border px-4 py-2">{item.disease}</td>
        <td className="border px-4 py-2">{item.details}</td>
      </tr>
    ));
  }

  let consultationList, sampleList;

  if (isConsultationLoading) {
    consultationList = <CircularProgress size={20} />;
  } else if (consultationListData.length === 0) {
    consultationList = <Typography>No OP Triage / Consultation available.</Typography>
  } else if (consultationListData.length > 0) {
    consultationList = consultationListData.map((itemData, idx) => (
      <ConsultationCard itemData={itemData} key={idx} />
    ));
  }

  if (isSampleLoading) {
    sampleList = <CircularProgress size={20} />;
  } else if (sampleListData.length === 0) {
    sampleList = <Typography>No sample test available.</Typography>
  } else if (sampleListData.length > 0) {
    sampleList = sampleListData.map((itemData, idx) => (
      <SampleTestCard itemData={itemData} key={idx} handleApproval={confirmApproval} facilityId={facilityId} patientId={id} />
    ));
  }

  return (
    <div className="px-2">
      {showAlertMessage.show && (
        <AlertDialog
          title={showAlertMessage.title}
          message={showAlertMessage.message}
          handleClose={() => handleApproval()}
          handleCancel={() => dismissAlert()}
        />
      )}
      <PageTitle title={`Covid Suspect #${id}`} />
      <div className="border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4 p-4">
        <div className="flex justify-between">
          <div className="max-w-md">
            <div>
              <span className="font-semibold leading-relaxed">Name: </span>
              {patientData.name}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Age: </span>
              {patientData.age}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Gender: </span>
              {patientGender}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Phone: </span>
              {patientData.phone_number}
            </div>
          </div>

          <div>
            <div className="mt-2">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="small"
                onClick={() =>
                  navigate(`/facility/${facilityId}/patient/${id}/update`)
                }
              >Update Details</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div>
            <span className="font-semibold leading-relaxed">Address: </span>
            {patientData.address}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Present health status: </span>
            {patientData.present_health}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Contact with confirmed carrier: </span>
            {patientData.contact_with_confirmed_carrier ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Contact with suspected carrier: </span>
            {patientData.contact_with_suspected_carrier ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {patientData.estimated_contact_date && (<div>
            <span className="font-semibold leading-relaxed">Estimated contact date: </span>
            {moment(patientData.estimated_contact_date).format("LL")}
          </div>)}
          <div>
            <span className="font-semibold leading-relaxed">Has SARI (Severe Acute Respiratory illness)?: </span>
            {patientData.has_SARI ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Domestic/international Travel (within last 28 days): </span>
            {patientData.past_travel ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {patientData.countries_travelled && (<div>
            <span className="font-semibold leading-relaxed">Countries travelled: </span>
            {patientData.countries_travelled.split(',').join(', ')}
          </div>)}
          {patientData.ongoing_medication &&
            <div>
              <span className="font-semibold leading-relaxed">Ongoing Medications </span>
              {patientData.ongoing_medication}
            </div>
          }
        </div>

        <div className="flex mt-4">
          <div className="flex-1 mr-2">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="small"
              onClick={() =>
                navigate(`/facility/${facilityId}/patient/${id}/consultation`)
              }
            >Add OP Triage / Consultation</Button>
          </div>
          <div className="flex-1 ml-2">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="small"
              disabled={!consultationListData || !consultationListData.length}
              onClick={() =>
                navigate(`/facility/${facilityId}/patient/${id}/sample-test`)
              }
            >Request Sample Test</Button>
          </div>
        </div>
      </div>

      <Grid item xs={12}>
        <PageTitle title="Medical History" hideBack={true} />
        <div className={classes.details}>
          {patientMedHis.length > 0 ? (
            <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mt-4">
              <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200 mt-4">

                <table className="min-w-full border-2 rounded overflow-hidden bg-white">
                  <thead>
                    <tr className="white border" >
                      <th className="border px-4 py-2">Disease</th>
                      <th className="border px-4 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>{patientMedHis}</tbody>
                </table>
              </div>
            </div>
          ) : (
              <span className="w3-center">
                <h6 className="w3-text-grey">No Medical History so far</h6>
              </span>
            )}
        </div>
      </Grid>

      <div>
        <PageTitle title="OP Triage / Consultation History" hideBack={true} />
        {consultationList}
        {!isConsultationLoading && totalConsultationCount > limit && (
          <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
            <Pagination
              cPage={currentConsultationPage}
              defaultPerPage={limit}
              data={{ totalCount: totalConsultationCount }}
              onChange={handleConsultationPagination}
            />
          </Grid>
        )}
      </div>

      <div>
        <PageTitle title="Sample Test History" hideBack={true} />
        {sampleList}
        {!isSampleLoading && totalSampleListCount > limit && (
          <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
            <Pagination
              cPage={currentSampleListPage}
              defaultPerPage={limit}
              data={{ totalCount: totalSampleListCount }}
              onChange={handleSampleListPagination}
            />
          </Grid>
        )}
      </div>
    </div>
  );
};
