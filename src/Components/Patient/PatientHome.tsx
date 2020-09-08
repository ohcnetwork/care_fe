import { Button, CircularProgress, Grid, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { navigate } from "hookrouter";
import moment from "moment";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GENDER_TYPES } from "../../Common/constants";
import loadable from '@loadable/component';
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getConsultationList,
  getPatient,
  getSampleTestList,
  patchSample,
  discharge,
  patchPatient,
  dischargePatient
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import AlertDialog from "../Common/AlertDialog";
import Pagination from "../Common/Pagination";
import { ConsultationCard } from "../Facility/ConsultationCard";
import { ConsultationModel } from "../Facility/models";
import { PatientModel, SampleTestModel } from "./models";
import { SampleTestCard } from "./SampleTestCard";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { TextInputField } from "../Common/HelperInputFields";
import { validateEmailAddress } from "../../Common/validation";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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
  const [consultationListData, setConsultationListData] = useState<Array<ConsultationModel>>([]);
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
  const [open, setOpen] = React.useState(false);
  const [openDischargeDialog, setOpenDischargeDialog] = React.useState(false);
  const state: any = useSelector((state) => state);
  const { currentUser } = state;

  const initErr: any = {};
  const [errors, setErrors] = useState(initErr);
  const initDischargeSummaryForm: { email: string } = {
    email: "",
  };
  const [dischargeSummaryState, setDischargeSummaryForm] = useState(initDischargeSummaryForm);

  const handleDischargeSummaryFormChange = (e: any) => {
    const { value } = e.target;

    const errorField = Object.assign({}, errors);
    errorField['dischargeSummaryForm'] = null;
    setErrors(errorField);

    setDischargeSummaryForm({ email: value });
  }

  const handleDischargeSummarySubmit = () => {
    if (!dischargeSummaryState.email) {
      const errorField = Object.assign({}, errors);
      errorField['dischargeSummaryForm'] = 'email field can not be blank.';
      setErrors(errorField);
    } else if (!validateEmailAddress(dischargeSummaryState.email)) {
      const errorField = Object.assign({}, errors);
      errorField['dischargeSummaryForm'] = 'Please Enter a Valid Email Address';
      setErrors(errorField);
    } else {
      dispatch(discharge({ email: dischargeSummaryState.email }, { external_id: patientData.id }))
        .then((response: any) => {
          if ((response || {}).status === 200) {
            Notification.Success({
              msg: "We will be sending an email shortly. Please check your inbox."
            });
          }
        })
      setOpen(false);
    }
  }

  const handlePatientTransfer = (value: boolean) => {
    let dummyPatientData = Object.assign({}, patientData);
    dummyPatientData['allow_transfer'] = value;

    dispatch(patchPatient({ 'allow_transfer': value }, { id: patientData.id }))
      .then((response: any) => {
        if ((response || {}).status === 200) {
          let dummyPatientData = Object.assign({}, patientData);
          dummyPatientData['allow_transfer'] = value;
          setPatientData(dummyPatientData);

          Notification.Success({
            msg: "Transfer status updated."
          });
        }
      }
      );
  }

  const handlePatientDischarge = (value: boolean) => {
    let dischargeData = Object.assign({}, patientData);
    dischargeData['discharge'] = value;

    dispatch(dischargePatient({ 'discharge': value }, { id: patientData.id }))
      .then((response: any) => {
        if ((response || {}).status === 200) {
          let dischargeData = Object.assign({}, patientData);
          dischargeData['discharge'] = value;
          setPatientData(dischargeData);

          Notification.Success({
            msg: "Patient Discharged"
          });
          setOpenDischargeDialog(false);
          window.location.reload();
        }
      });
  }
  const dischargeSummaryFormSetUserEmail = () => {
    setDischargeSummaryForm({ email: currentUser.data.email });
  }

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleDischageClickOpen = () => {
    setOpenDischargeDialog(true);
  }

  const handleDischargeClose = () => {
    setOpenDischargeDialog(false);
  };

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

  const handleDischargeSummary = (e: any) => {
    e.preventDefault();
    setOpen(false);
  }

  const handleApproval = async () => {
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

    const res = await dispatch(patchSample(sample.id, sampleData));
    if (res && (res.status === 201 || res.status === 200)) {
      Notification.Success({
        msg: `Request ${statusName}`
      });
      callSampleList(!sampleFlag);
    }

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
      <ConsultationCard itemData={itemData} key={idx} isLastConsultation={itemData.id === patientData.last_consultation?.id} />
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
    <div className="px-2 pb-2">
      {showAlertMessage.show && (
        <AlertDialog
          title={showAlertMessage.title}
          message={showAlertMessage.message}
          handleClose={() => handleApproval()}
          handleCancel={() => dismissAlert()}
        />
      )}
      <PageTitle title={`Covid Suspect Details`} />
      <div className="border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black mt-4 p-4">
        <div className="flex justify-between">
          <div className="grid gap-2 grid-cols-1">
            <div className="flex items-baseline">
              <div>
                <span className="font-semibold leading-relaxed">Name: </span>
                {patientData.name}
              </div>
              <div>
                {!patientData.is_active && (
                  <span className="ml-2 badge badge-pill badge-dark">
                    Inactive
                  </span>
                )}
              </div>
              <div>
                {patientData.allow_transfer && (
                  <span className="ml-2 badge badge-pill badge-success">
                    Transfer Allowed
                  </span>
                )}
              </div>
              <div>
                {!patientData.allow_transfer && (
                  <span className="ml-2 badge badge-pill badge-warning">
                    Transfer Not Allowed
                  </span>
                )}
              </div>
            </div>
            {patientData.is_medical_worker && (<div>
              <span className="font-semibold leading-relaxed">Medical Worker: </span>
              <span className="badge badge-pill badge-primary">Yes</span>
            </div>)}
            <div>
              <span className="font-semibold leading-relaxed">Disease Status: </span>
              <span className="badge badge-pill badge-danger">{patientData.disease_status}</span>
            </div>
          </div>
          {patientData.is_active &&
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
          }
        </div>

        <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mt-2">
          <div>
            <span className="font-semibold leading-relaxed">Facility: </span>
            {patientData.facility_object?.name || '-'}
          </div>
          {patientData.date_of_birth ? (<div>
            <span className="font-semibold leading-relaxed">Date of birth: </span>
            {patientData.date_of_birth}
          </div>) : (<div>
            <span className="font-semibold leading-relaxed">Age: </span>
            {patientData.age}
          </div>)}
          <div>
            <span className="font-semibold leading-relaxed">Gender: </span>
            {patientGender}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Phone: </span>
            <a href={`tel:${patientData.phone_number}`}>{patientData.phone_number || "-"}</a>
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Nationality: </span>
            {patientData.nationality || '-'}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Blood Group: </span>
            {patientData.blood_group || '-'}
          </div>
          {patientData.nationality !== 'India' && <div>
            <span className="font-semibold leading-relaxed">Passport Number: </span>
            {patientData.passport_no || '-'}
          </div>}
          {patientData.nationality === 'India' && (<>
            <div>
              <span className="font-semibold leading-relaxed">State: </span>
              {patientData.state_object?.name}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">District: </span>
              {patientData.district_object?.name || '-'}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Local Body: </span>
              {patientData.local_body_object?.name || '-'}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Ward : </span>
              {patientData.ward || '-'}
            </div>
          </>)}
          <div>
            <span className="font-semibold leading-relaxed">Address: </span>
            {patientData.address || '-'}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Emergency Contact number: </span>
            <a href={`tel:${patientData.emergency_phone_number}`}>{patientData.emergency_phone_number || "-"}</a>
          </div>

          {patientData.is_antenatal &&
            <div>
              <span className="font-semibold leading-relaxed"> Is pregnant </span>
              {patientData.is_antenatal ? <span className="badge badge-pill badge-danger">Yes</span> :
                <span className="badge badge-pill badge-warning">No</span>}
            </div>
          }
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
          {/*<div className="md:col-span-2">*/}
          {/*  <span className="font-semibold leading-relaxed">Has SARI (Severe Acute Respiratory illness)?: </span>*/}
          {/*  {patientData.has_SARI ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}*/}
          {/*</div>*/}
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Domestic/international Travel (within last 28 days): </span>
            {patientData.past_travel ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {patientData.countries_travelled && !!patientData.countries_travelled.length && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Countries travelled: </span>
            {Array.isArray(patientData.countries_travelled) ? patientData.countries_travelled.join(", ") : patientData.countries_travelled.split(',').join(', ')}
          </div>)}
          {patientData.ongoing_medication && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Ongoing Medications </span>
            {patientData.ongoing_medication}
          </div>)}
          {
            patientData.allergies &&
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">Allergies:  </span>
              {patientData.allergies}
            </div>
          }
          {!!patientData.number_of_aged_dependents && (<div>
            <span className="font-semibold leading-relaxed">Number Of Aged Dependents (Above 60): </span>
            {patientData.number_of_aged_dependents}
          </div>)}
          {!!patientData.number_of_chronic_diseased_dependents && (<div>
            <span className="font-semibold leading-relaxed">Number Of Chronic Diseased Dependents: </span>
            {patientData.number_of_chronic_diseased_dependents}
          </div>)}
        </div>
        <div className="flex mt-4">
          <div className="flex-1">
            <Button fullWidth
              variant="contained"
              color="primary"
              size="small" onClick={handleClickOpen}>
              Discharge Summary
            </Button>
            <Dialog open={open} onClose={handleDischargeSummary}>
              <DialogTitle id="form-dialog-title">Download Discharge Summary</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Please enter your email id to receive the discharge summary.
                  Disclaimer: This is an automatically Generated email using your info Captured in Care System.
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    role="alert">
                    <strong className="block sm:inline font-bold">Please check your email id before continuing. We cannot deliver the email if the email id is invalid</strong>
                  </div>
                </DialogContentText>
                <div className="flex justify-end">
                  <a href="#"
                    className="text-xs"
                    onClick={dischargeSummaryFormSetUserEmail}>
                    Fill email input with my email.
                  </a>
                </div>
                <TextInputField
                  type="email"
                  name="email"
                  label="email"
                  variant="outlined"
                  margin="dense"
                  autoComplete='off'
                  value={dischargeSummaryState.email}
                  InputLabelProps={{ shrink: !!dischargeSummaryState.email }}
                  onChange={handleDischargeSummaryFormChange}
                  errors={errors.dischargeSummaryForm}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} color="primary">
                  Cancel
                </Button>
                <Button onClick={handleDischargeSummarySubmit} color="primary">
                  Submit
                </Button>
              </DialogActions>
            </Dialog>
          </div>
          {patientData.is_active &&
            <div className="flex-1 ml-2">
              <Button fullWidth
                variant="contained"
                color="primary"
                size="small"
                onClick={handleDischageClickOpen}>
                Discharge
            </Button>
              <Dialog
                open={openDischargeDialog}
                onClose={handleDischargeClose}
              >
                <DialogTitle id="alert-dialog-title">Authorize Patient Discharge</DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    Please confirm patient Discharge
                </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleDischargeClose} color="primary">
                    Disagree
                </Button>
                  <Button color="primary"
                    onClick={() => handlePatientDischarge(false)} autoFocus>
                    Agree
                </Button>
                </DialogActions>
              </Dialog>
            </div>
          }
          {!patientData.allow_transfer && patientData.is_active &&
            <div className="flex-1 ml-2">
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="small"
                disabled={!consultationListData || !consultationListData.length}
                onClick={() => handlePatientTransfer(true)}
              >Allow Transfer</Button>
            </div>
          }
          {patientData.allow_transfer && patientData.is_active &&
            <div className="flex-1 ml-2">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="small"
                disabled={!consultationListData || !consultationListData.length}
                onClick={() => handlePatientTransfer(false)}
              >Disable Transfer</Button>
            </div>
          }
        </div>
        {
          patientData.is_active &&
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
        }
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
              <span className="flex items-center justify-center">
                <h6 className="text-gray-700">No Medical History so far</h6>
              </span>
            )}
        </div>
      </Grid>

      <div>
        <PageTitle title="OP Triage / Consultation History" hideBack={true} />
        {consultationList}
        {!isConsultationLoading && totalConsultationCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentConsultationPage}
              defaultPerPage={limit}
              data={{ totalCount: totalConsultationCount }}
              onChange={handleConsultationPagination}
            />
          </div>
        )}
      </div>

      <div>
        <PageTitle title="Sample Test History" hideBack={true} />
        {sampleList}
        {!isSampleLoading && totalSampleListCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentSampleListPage}
              defaultPerPage={limit}
              data={{ totalCount: totalSampleListCount }}
              onChange={handleSampleListPagination}
            />
          </div>
        )}
      </div>
    </div>
  );
};
