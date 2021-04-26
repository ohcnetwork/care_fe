import {
  Button,
  CircularProgress,
  Typography,
  Select,
  MenuItem,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { navigate } from "raviger";
import moment from "moment";
import React, { Fragment, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GENDER_TYPES, DISEASE_STATUS } from "../../Common/constants";
import loadable from "@loadable/component";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getConsultationList,
  listShiftRequests,
  getPatient,
  getSampleTestList,
  patchSample,
  discharge,
  patchPatient,
  dischargePatient,
  completeTransfer,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import AlertDialog from "../Common/AlertDialog";
import Pagination from "../Common/Pagination";
import { ConsultationCard } from "../Facility/ConsultationCard";
import { ConsultationModel } from "../Facility/models";
import { PatientModel, SampleTestModel } from "./models";
import { SampleTestCard } from "./SampleTestCard";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { TextInputField, DateInputField } from "../Common/HelperInputFields";
import { validateEmailAddress } from "../../Common/validation";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Modal from "@material-ui/core/Modal";
import FormControl from "@material-ui/core/FormControl";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: "8px",
  },
  margin: {
    margin: theme.spacing(1),
  },
  displayFlex: {
    display: "flex",
  },
  content: {
    marginTop: "10px",
    maxWidth: "560px",
    background: "white",
    padding: "20px 20px 5px",
  },
  title: {
    padding: "5px",
    marginBottom: "10px",
  },
  details: {
    marginTop: "10px",
    padding: "5px",
    marginBottom: "10px",
  },
  paginateTopPadding: {
    paddingTop: "50px",
  },
}));

type donatePlasmaOptionType = null | "yes" | "no" | "not-fit";
interface preDischargeFormInterface {
  donatePlasma: donatePlasmaOptionType;
  disease_status?: string;
  srf_id?: string;
  date_of_test?: string;
}

export const PatientHome = (props: any) => {
  const { facilityId, id } = props;
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const [showShifts, setShowShifts] = useState(false);
  const [isShiftClicked, setIsShiftClicked] = useState(false);
  const [isShiftDataLoaded, setIsShiftDataLoaded] = useState(false);
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [consultationListData, setConsultationListData] = useState<
    Array<ConsultationModel>
  >([]);
  const [sampleListData, setSampleListData] = useState<Array<SampleTestModel>>(
    []
  );
  const [activeShiftingData, setActiveShiftingData] = useState<Array<any>>([]);
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
  const [selectedStatus, setSelectedStatus] = useState<{
    status: number;
    sample: any;
  }>({ status: 0, sample: null });
  const [showAlertMessage, setAlertMessage] = useState({
    show: false,
    message: "",
    title: "",
  });
  const [modalFor, setModalFor] = useState({
    externalId: undefined,
    loading: false,
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

  const [dischargeSummaryState, setDischargeSummaryForm] = useState(
    initDischargeSummaryForm
  );

  const handleDischargeSummaryFormChange = (e: any) => {
    const { value } = e.target;

    const errorField = Object.assign({}, errors);
    errorField["dischargeSummaryForm"] = null;
    setErrors(errorField);

    setDischargeSummaryForm({ email: value });
  };

  const handleTransferComplete = (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    dispatch(completeTransfer({ externalId: modalFor })).then(() => {
      navigate(
        `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`
      );
    });
  };

  const initPreDischargeForm: preDischargeFormInterface = {
    donatePlasma: null,
  };

  const [isSendingDischargeApi, setIsSendingDischargeApi] = useState(false);

  const [preDischargeForm, setPreDischargeForm] = useState(
    initPreDischargeForm
  );

  const handlePreDischargeFormChange = (key: string, event: any) => {
    if (key === "date_of_test") {
      setPreDischargeForm({
        ...preDischargeForm,
        date_of_test: event,
      });
    } else {
      setPreDischargeForm({
        ...preDischargeForm,
        [key]: event.target.value,
      });
    }
  };

  const handleDischargeSummarySubmit = () => {
    if (!dischargeSummaryState.email) {
      const errorField = Object.assign({}, errors);
      errorField["dischargeSummaryForm"] = "email field can not be blank.";
      setErrors(errorField);
    } else if (!validateEmailAddress(dischargeSummaryState.email)) {
      const errorField = Object.assign({}, errors);
      errorField["dischargeSummaryForm"] = "Please Enter a Valid Email Address";
      setErrors(errorField);
    } else {
      dispatch(
        discharge(
          { email: dischargeSummaryState.email },
          { external_id: patientData.id }
        )
      ).then((response: any) => {
        if ((response || {}).status === 200) {
          Notification.Success({
            msg:
              "We will be sending an email shortly. Please check your inbox.",
          });
        }
      });
      setOpen(false);
    }
  };

  const handlePatientTransfer = (value: boolean) => {
    let dummyPatientData = Object.assign({}, patientData);
    dummyPatientData["allow_transfer"] = value;

    dispatch(
      patchPatient({ allow_transfer: value }, { id: patientData.id })
    ).then((response: any) => {
      if ((response || {}).status === 200) {
        let dummyPatientData = Object.assign({}, patientData);
        dummyPatientData["allow_transfer"] = value;
        setPatientData(dummyPatientData);

        Notification.Success({
          msg: "Transfer status updated.",
        });
      }
    });
  };

  const handlePatientDischarge = async (value: boolean) => {
    setIsSendingDischargeApi(true);
    let dischargeData = Object.assign({}, patientData);
    dischargeData["discharge"] = value;

    // calling patchPatient and dischargePatient together caused problems check https://github.com/coronasafe/care_fe/issues/758

    // using preDischargeForm form data to update patient data
    let preDischargeFormData = formatPreDischargeFormData(preDischargeForm);

    if (Object.keys(preDischargeFormData).length) {
      // skip calling patient update api if nothing to update
      await dispatch(
        patchPatient(preDischargeFormData, {
          id: patientData.id,
        })
      );
    }
    // discharge call
    let dischargeResponse = await dispatch(
      dischargePatient({ discharge: value }, { id: patientData.id })
    );

    setIsSendingDischargeApi(false);
    if (dischargeResponse?.status === 200) {
      let dischargeData = Object.assign({}, patientData);
      dischargeData["discharge"] = value;
      setPatientData(dischargeData);

      Notification.Success({
        msg: "Patient Discharged",
      });
      setOpenDischargeDialog(false);
      window.location.reload();
    }
  };

  const formatPreDischargeFormData = (
    preDischargeForm: preDischargeFormInterface
  ) => {
    let data: any = { ...preDischargeForm };
    let donatePlasma = preDischargeForm.donatePlasma;

    if (donatePlasma) {
      if (donatePlasma === "yes") {
        data["will_donate_blood"] = true;
        data["fit_for_blood_donation"] = true;
      } else if (donatePlasma === "no") {
        data["will_donate_blood"] = false;
      } else if (donatePlasma === "not-fit") {
        data["will_donate_blood"] = true;
        data["fit_for_blood_donation"] = false;
      }
    }

    delete data.donatePlasma;
    return data;
  };

  function Badge(props: { color: string; icon: string; text: string }) {
    return (
      <span
        className="m-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-gray-100 text-gray-700"
        title={props.text}
      >
        <i
          className={
            "mr-2 text-md text-" + props.color + "-500 fas fa-" + props.icon
          }
        ></i>
        {props.text}
      </span>
    );
  }

  const dischargeSummaryFormSetUserEmail = () => {
    setDischargeSummaryForm({ email: currentUser.data.email });
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleDischageClickOpen = () => {
    setOpenDischargeDialog(true);
  };

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
      const consultationRes = await dispatch(
        getConsultationList({ patient: id, limit, offset: consultationOffset })
      );
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
      const sampleRes = await dispatch(
        getSampleTestList(
          { limit, offset: sampleListOffset },
          { patientId: id }
        )
      );
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

  const fetchActiveShiftingData = useCallback(
    async (status: statusType) => {
      const shiftingRes = isShiftClicked
        ? await dispatch(listShiftRequests({ patient: id }, "shift-list-call"))
        : activeShiftingData;
      setIsShiftDataLoaded(isShiftClicked);
      if (!status.aborted) {
        if (shiftingRes && shiftingRes.data && shiftingRes.data.results) {
          const activeShiftingRes: any[] = shiftingRes.data.results;
          setActiveShiftingData(activeShiftingRes);
        }
      }
    },
    [dispatch, id, isShiftClicked]
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

  useAbortableEffect(
    (status: statusType) => {
      fetchActiveShiftingData(status);
    },
    [dispatch, fetchActiveShiftingData]
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
    });
  };

  const confirmApproval = (status: number, sample: any) => {
    setSelectedStatus({ status, sample });
    setAlertMessage({
      show: true,
      message: `Are you sure you want to sent the sample to Collection Centre?`,
      title: "Confirm",
    });
  };

  const handleDischargeSummary = (e: any) => {
    e.preventDefault();
    setOpen(false);
  };

  const handleApproval = async () => {
    const { status, sample } = selectedStatus;
    const sampleData = {
      id: sample.id,
      status,
      consultation: sample.consultation,
    };
    let statusName = "";
    if (status === 4) {
      statusName = "SENT_TO_COLLECTON_CENTRE";
    }

    const res = await dispatch(patchSample(sample.id, sampleData));
    if (res && (res.status === 201 || res.status === 200)) {
      Notification.Success({
        msg: `Request ${statusName}`,
      });
      callSampleList(!sampleFlag);
    }

    dismissAlert();
  };

  if (isLoading) {
    return <Loading />;
  }

  const patientGender = GENDER_TYPES.find((i) => i.id === patientData.gender)
    ?.text;

  let patientMedHis: any[] = [];
  if (
    patientData &&
    patientData.medical_history &&
    patientData.medical_history.length
  ) {
    const medHis = patientData.medical_history;
    patientMedHis = medHis.map((item: any, idx: number) => (
      <div className="sm:col-span-1" key={`med_his_${idx}`}>
        {item?.disease != "NO" && (
          <>
            <div className="text-sm leading-5 font-medium text-gray-500">
              {item.disease}
            </div>
            <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre-wrap">
              {item.details}
            </div>
          </>
        )}
      </div>
    ));
  }

  let consultationList, sampleList;

  if (isConsultationLoading) {
    consultationList = <CircularProgress size={20} />;
  } else if (consultationListData.length === 0) {
    consultationList = <Typography>No Consultation available.</Typography>;
  } else if (consultationListData.length > 0) {
    consultationList = consultationListData.map((itemData, idx) => (
      <ConsultationCard
        itemData={itemData}
        key={idx}
        isLastConsultation={itemData.id === patientData.last_consultation?.id}
      />
    ));
  }

  if (isSampleLoading) {
    sampleList = <CircularProgress size={20} />;
  } else if (sampleListData.length === 0) {
    sampleList = <Typography>No sample test available.</Typography>;
  } else if (sampleListData.length > 0) {
    sampleList = sampleListData.map((itemData, idx) => (
      <SampleTestCard
        itemData={itemData}
        key={idx}
        handleApproval={confirmApproval}
        facilityId={facilityId}
        patientId={id}
      />
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

      <div id="revamp">
        <PageTitle title={`Covid Suspect Details`} />
        {patientData?.last_consultation?.assigned_to_object && (
          <div className="relative rounded-lg shadow bg-green-200 mt-2">
            <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
              <div className="pr-16 sm:text-center sm:px-16">
                <p className="font-bold text-green-800">
                  <span className="inline">
                    Assigned to:{" "}
                    {
                      patientData.last_consultation.assigned_to_object
                        .first_name
                    }{" "}
                    {patientData.last_consultation.assigned_to_object.last_name}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        {patientData?.facility != patientData?.last_consultation?.facility && (
          <div className="relative mt-2">
            <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8 rounded-lg shadow bg-red-200 ">
              <div className="text-center">
                <p className="font-bold text-red-800">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <span className="inline">
                    You have not created a consultation for the patient in{" "}
                    <strong>{patientData.facility_object?.name || "-"} </strong>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center mt-4">
              <button
                className="btn btn-primary w-full"
                disabled={!patientData.is_active}
                onClick={() =>
                  navigate(`/facility/${facilityId}/patient/${id}/consultation`)
                }
              >
                Create Consultation
              </button>
            </div>
          </div>
        )}
        <section className="md:flex items-center mt-4 space-y-2">
          <div className="md:w-2/3 mx-2 h-full">
            <div className="bg-white rounded-lg shadow p-4 h-full">
              <h1 className="font-bold text-3xl">
                {" "}
                {patientData.name} - {patientData.age}
              </h1>
              <h3 className="font-semibold text-lg">
                <i className="fas fa-hospital mr-2"></i>
                {patientData.facility_object?.name || "-"}
              </h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:gap-y-8 sm:grid-cols-3 mt-2">
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    Gender, Date of Birth
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900">
                    {patientData?.date_of_birth}, {patientGender}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    Phone
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900">
                    <a href={`tel:${patientData.phone_number}`}>
                      {patientData.phone_number || "-"}
                    </a>
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    Emergency Contact
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900">
                    <a href={`tel:${patientData.emergency_phone_number}`}>
                      {patientData.emergency_phone_number || "-"}
                    </a>
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    Blood Group
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900">
                    {patientData.blood_group || "-"}
                  </div>
                </div>
                {patientData.date_of_return && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-medium text-gray-500">
                      Date of Return
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900">
                      {moment(patientData.date_of_return).format("LL")}
                    </div>
                  </div>
                )}
                {patientData.countries_travelled &&
                  !!patientData.countries_travelled.length && (
                    <div className="sm:col-span-1">
                      <div className="text-sm leading-5 font-medium text-gray-500">
                        Countries travelled
                      </div>
                      <div className="mt-1 text-sm leading-5 text-gray-900">
                        {Array.isArray(patientData.countries_travelled)
                          ? patientData.countries_travelled.join(", ")
                          : patientData.countries_travelled
                              .split(",")
                              .join(", ")}
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex flex-wrap mt-2">
                {patientData.is_vaccinated ? (
                  <Badge color="blue" icon="syringe" text="Vaccinated" />
                ) : (
                  <Badge
                    color="yellow"
                    icon="exclamation-triangle"
                    text="Not Vaccinated"
                  />
                )}

                {patientData.allow_transfer ? (
                  <Badge color="yellow" icon="unlock" text="Transfer Allowed" />
                ) : (
                  <Badge color="green" icon="lock" text="Transfer Blocked" />
                )}
                {patientData.is_antenatal && patientData.is_active && (
                  <Badge color="blue" icon="baby-carriage" text="Antenatal" />
                )}
                {patientData.contact_with_confirmed_carrier && (
                  <Badge
                    color="red"
                    icon="exclamation-triangle"
                    text="Contact with confirmed carrier"
                  />
                )}
                {patientData.contact_with_suspected_carrier && (
                  <Badge
                    color="yellow"
                    icon="exclamation-triangle"
                    text="Contact with suspected carrier"
                  />
                )}
                {patientData.past_travel && (
                  <Badge
                    color="yellow"
                    icon="exclamation-triangle"
                    text="Travel (within last 28 days)"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="md:w-1/3 mx-2 h-full">
            <div
              id="actions"
              className="space-y-2 flex-col justify-between flex h-full"
            >
              <div>
                {patientData.review_time && (
                  <div
                    className={
                      "mb-2 inline-flex items-center px-3 py-1 rounded-lg text-xs leading-4 font-semibold p-1 w-full justify-center " +
                      (moment().isBefore(patientData.review_time)
                        ? " bg-gray-100"
                        : " p-1 bg-red-400 text-white")
                    }
                  >
                    <i className="mr-2 text-md fas fa-clock"></i>
                    {(moment().isBefore(patientData.review_time)
                      ? "Review at: "
                      : "Review Missed: ") +
                      moment(patientData.review_time).format("lll")}
                  </div>
                )}
                <div className="p-2 bg-white rounded-lg shadow text-center">
                  <div className="flex justify-between">
                    <div className="w-1/2 border-r-2 truncate">
                      <div className="text-sm leading-5 font-medium text-gray-500">
                        Disease Status
                      </div>
                      <div className="mt-1 text-xl font-semibold leading-5 text-gray-900">
                        {patientData.disease_status}
                      </div>
                    </div>
                    <div className="w-1/2 truncate">
                      <div className="text-sm leading-5 font-medium text-gray-500">
                        Status
                      </div>
                      <div className="mt-1 text-xl font-semibold leading-5 text-gray-900">
                        {patientData.is_active ? "Live" : "Discharged"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between p-2 bg-white rounded-lg shadow text-center px-4 mt-2">
                  <div className="w-1/2 border-r-2 truncate">
                    <div className="text-sm leading-5 font-medium text-gray-500">
                      Created
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre">
                      <div className="text-sm">
                        {patientData?.created_by?.first_name}{" "}
                        {patientData?.created_by?.last_name}
                      </div>
                      <div className="text-xs">
                        {patientData.created_date &&
                          moment(patientData.created_date).format("lll")}
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 truncate">
                    <div className="text-sm leading-5 font-medium text-gray-500">
                      Last Edited
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre">
                      <div className="text-sm">
                        {patientData?.last_edited?.first_name}{" "}
                        {patientData?.last_edited?.last_name}
                      </div>
                      <div className="text-xs">
                        {patientData.modified_date &&
                          moment(patientData.modified_date).format("lll")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 py-2">
                <div>
                  <button
                    className="btn btn-primary w-full"
                    disabled={!patientData.is_active}
                    onClick={() =>
                      navigate(`/facility/${facilityId}/patient/${id}/update`)
                    }
                  >
                    <i className="fas fa-pencil-alt mr-2" />
                    Update Details
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-full"
                    disabled={
                      !consultationListData ||
                      !consultationListData.length ||
                      !patientData.is_active
                    }
                    onClick={() =>
                      handlePatientTransfer(!patientData.allow_transfer)
                    }
                  >
                    <i className="fas fa-lock mr-2" />
                    {patientData.allow_transfer
                      ? "Disable Transfer"
                      : "Allow Transfer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className=" bg-white rounded-lg shadow p-4 h-full space-y-2 text-gray-100 mt-4">
          <div
            className="flex justify-between border-b border-dashed text-gray-900 font-semibold text-left text-lg pb-2"
            onClick={() => {
              setShowShifts(!showShifts);
              setIsShiftClicked(true);
            }}
          >
            <div>Shifting</div>
            {showShifts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>
          <div
            className={
              showShifts
                ? activeShiftingData.length
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : ""
                : "hidden"
            }
          >
            {activeShiftingData.length ? (
              activeShiftingData.map((shift: any) => (
                <div key={`shift_${shift.id}`} className="mx-2 ">
                  <div className="overflow-hidden shadow rounded-lg bg-white h-full">
                    <div
                      className={
                        "p-4 h-full flex flex-col justify-between " +
                        (shift.patient_object.disease_status === "POSITIVE"
                          ? "bg-red-50"
                          : "")
                      }
                    >
                      <div>
                        <div className="flex justify-between mt-1">
                          <div>
                            {shift.emergency && (
                              <span className="flex-shrink-0 inline-block px-2 py-0.5 text-red-800 text-xs leading-4 font-medium bg-red-100 rounded-full">
                                Emergency
                              </span>
                            )}
                          </div>
                        </div>
                        <dl className="grid grid-cols-1 col-gap-1 row-gap-2 sm:grid-cols-1">
                          <div className="sm:col-span-1">
                            <dt
                              title="Shifting status"
                              className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                            >
                              <i className="fas fa-truck mr-2" />
                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {shift.status}
                              </dd>
                            </dt>
                          </div>
                          <div className="sm:col-span-1">
                            <dt
                              title=" Origin facility"
                              className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                            >
                              <i className="fas fa-plane-departure mr-2"></i>
                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {(shift.orgin_facility_object || {})?.name}
                              </dd>
                            </dt>
                          </div>
                          <div className="sm:col-span-1">
                            <dt
                              title="Shifting approving facility"
                              className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                            >
                              <i className="fas fa-user-check mr-2"></i>
                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {
                                  (
                                    shift.shifting_approving_facility_object ||
                                    {}
                                  )?.name
                                }
                              </dd>
                            </dt>
                          </div>
                          <div className="sm:col-span-1">
                            <dt
                              title=" Assigned facility"
                              className="text-sm leading-5 font-medium text-gray-500 flex items-center"
                            >
                              <i className="fas fa-plane-arrival mr-2"></i>

                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {(shift.assigned_facility_object || {})?.name ||
                                  "Yet to be decided"}
                              </dd>
                            </dt>
                          </div>

                          <div className="sm:col-span-1">
                            <dt
                              title="  Last Modified"
                              className={
                                "text-sm leading-5 font-medium flex items-center " +
                                (moment()
                                  .subtract(2, "hours")
                                  .isBefore(shift.modified_date)
                                  ? "text-gray-900"
                                  : "rounded p-1 bg-red-400 text-white")
                              }
                            >
                              <i className="fas fa-stopwatch mr-2"></i>
                              <dd className="font-bold text-sm leading-5">
                                {moment(shift.modified_date).format("LLL") ||
                                  "--"}
                              </dd>
                            </dt>
                          </div>
                        </dl>
                      </div>
                      <div className="mt-2 flex">
                        <button
                          onClick={(_) =>
                            navigate(`/shifting/${shift.external_id}`)
                          }
                          className="btn w-full btn-default bg-white mr-2"
                        >
                          <i className="fas fa-eye mr-2" /> All Details
                        </button>
                      </div>
                      {shift.status === "TRANSFER IN PROGRESS" &&
                        shift.assigned_facility && (
                          <div className="mt-2">
                            <Button
                              size="small"
                              variant="outlined"
                              fullWidth
                              onClick={() => setModalFor(shift.external_id)}
                            >
                              TRANSFER TO RECEIVING FACILITY
                            </Button>

                            <Modal
                              open={modalFor === shift.external_id}
                              onClose={(_) =>
                                setModalFor({
                                  externalId: undefined,
                                  loading: false,
                                })
                              }
                            >
                              <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
                                <div className="bg-white rounded shadow p-8 m-4 max-w-sm max-h-full text-center">
                                  <div className="mb-4">
                                    <h1 className="text-2xl">
                                      Confirm Transfer Complete!
                                    </h1>
                                  </div>
                                  <div className="mb-8">
                                    <p>
                                      Are you sure you want to mark this
                                      transfer as complete? The Origin facility
                                      will no longer have access to this patient
                                    </p>
                                  </div>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      fullWidth
                                      onClick={() => {
                                        setModalFor({
                                          externalId: undefined,
                                          loading: false,
                                        });
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      fullWidth
                                      onClick={(_) =>
                                        handleTransferComplete(shift)
                                      }
                                    >
                                      Confirm
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Modal>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className=" text-center text-gray-500">
                {isShiftDataLoaded ? "No Shifting Records!" : "Loading..."}
              </div>
            )}
          </div>
        </section>

        <section className="md:flex mt-4 space-y-2">
          <div className="md:w-1/3 mx-2">
            <div className="bg-white rounded-lg shadow p-4 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-semibold text-center text-lg pb-2">
                Location
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Address
                </div>
                <div className="mt-1 text-sm leading-5 whitespace-normal text-gray-900 break-words">
                  {patientData.address || "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Village
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData.village || "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Ward
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {(patientData.ward_object &&
                    patientData.ward_object.number +
                      ", " +
                      patientData.ward_object.name) ||
                    "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Local Body
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData.local_body_object?.name || "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  State, Country - Pincode
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData?.state_object?.name},{" "}
                  {patientData.nationality || "-"} - {patientData.pincode}
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/3 mx-2">
            <div className="bg-white rounded-lg shadow p-4 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-semibold text-center text-lg pb-2">
                Tracing
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Medical Worker
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900 break-all">
                  {patientData.is_medical_worker
                    ? "Yes" +
                      (patientData.designation_of_health_care_worker
                        ? ", " + patientData.designation_of_health_care_worker
                        : "") +
                      (patientData.instituion_of_health_care_worker
                        ? ", " + patientData.instituion_of_health_care_worker
                        : "")
                    : "No"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Frontline Worker
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData.frontline_worker || "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Guest worker
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData.is_migrant_worker ? "Yes" : "No"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Estimated Contact Date
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData.estimated_contact_date
                    ? moment(patientData.estimated_contact_date).format("LL")
                    : ""}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Contact Name / Cluster
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData.cluster_name}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Number of Contacts
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {"Primary: " +
                    (patientData.number_of_primary_contacts || 0) +
                    ", Secondary: " +
                    (patientData.number_of_secondary_contacts || 0)}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Number of Dependents
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {"Above 60: " +
                    (patientData.number_of_aged_dependents || 0) +
                    ", Chronic Diseased: " +
                    (patientData.number_of_chronic_diseased_dependents || 0)}
                </div>
              </div>
              {patientData.transit_details && (
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    Transit Details
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900">
                    {patientData.transit_details}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="md:w-1/3 mx-2">
            <div className="bg-white rounded-lg shadow p-4 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-semibold text-center text-lg pb-2">
                Testing
              </div>
              {patientData.covin_id && (
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    Vaccinated (COVIN ID)
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900">
                    {patientData?.covin_id || "-"}
                  </div>
                </div>
              )}
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  SRF ID
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData?.srf_id || "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Test Type
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {patientData?.test_type || "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Date of Test
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {(patientData.date_of_test &&
                    moment(patientData.date_of_test).format("LL")) ||
                    "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Date of Result
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {(patientData.date_of_result &&
                    moment(patientData.date_of_result).format("LL")) ||
                    "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Declared Positive
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {(patientData?.is_declared_positive ? "Yes" : "No") || "-"}
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-medium text-gray-500">
                  Declared on
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-900">
                  {(patientData.date_declared_positive &&
                    moment(patientData.date_declared_positive).format("LL")) ||
                    "-"}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="md:flex mt-4 space-y-2">
          <div className="md:w-2/3 mx-2">
            <div className="bg-white rounded-lg shadow p-4 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-semibold text-center text-lg pb-2">
                Medical
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:gap-y-8 sm:grid-cols-3 mt-2">
                {patientData.present_health && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-medium text-gray-500">
                      Present Health
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre-wrap">
                      {patientData.ongoing_medication}
                    </div>
                  </div>
                )}
                {patientData.ongoing_medication && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-medium text-gray-500">
                      Ongoing Medications
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre-wrap">
                      {patientData.ongoing_medication}
                    </div>
                  </div>
                )}
                {patientData.allergies && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-medium text-gray-500">
                      Allergies
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre-wrap">
                      {patientData.allergies}
                    </div>
                  </div>
                )}
                {patientData.is_antenatal && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-medium text-gray-500">
                      Is pregnant
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900">
                      Yes
                    </div>
                  </div>
                )}
                {patientMedHis}
              </div>
            </div>
          </div>
          <div className="md:w-1/3 mx-2">
            <div className="bg-white rounded-lg shadow p-4 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-semibold text-center text-lg space-y-2">
                <div>
                  <button
                    className="btn btn-primary w-full"
                    disabled={!patientData.is_active}
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${id}/consultation`
                      )
                    }
                  >
                    Add Consultation
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      navigate(`/patient/${id}/investigation_reports`)
                    }
                  >
                    Investigations Summary
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      navigate(`/facility/${facilityId}/patient/${id}/files/`)
                    }
                  >
                    View/Upload Patient Files
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-full"
                    disabled={
                      !patientData.is_active ||
                      !(patientData?.last_consultation?.facility == facilityId)
                    }
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${id}/shift/new`
                      )
                    }
                  >
                    SHIFT PATIENT
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-full"
                    disabled={
                      !patientData.is_active ||
                      !(patientData?.last_consultation?.facility == facilityId)
                    }
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${id}/sample-test`
                      )
                    }
                  >
                    Request Sample Test
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleClickOpen}
                  >
                    Discharge Summary
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleDischageClickOpen}
                    disabled={
                      !patientData.is_active ||
                      !(patientData?.last_consultation?.facility == facilityId)
                    }
                  >
                    Discharge from CARE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={open} onClose={handleDischargeSummary}>
        <DialogTitle id="form-dialog-title">
          Download Discharge Summary
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter your email id to receive the discharge summary.
            Disclaimer: This is an automatically Generated email using your info
            Captured in Care System.
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="block sm:inline font-bold">
                Please check your email id before continuing. We cannot deliver
                the email if the email id is invalid
              </strong>
            </div>
          </DialogContentText>
          <div className="flex justify-end">
            <a
              href="#"
              className="text-xs"
              onClick={dischargeSummaryFormSetUserEmail}
            >
              Fill email input with my email.
            </a>
          </div>
          <TextInputField
            type="email"
            name="email"
            label="email"
            variant="outlined"
            margin="dense"
            autoComplete="off"
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
      <Dialog
        maxWidth={"md"}
        open={openDischargeDialog}
        onClose={handleDischargeClose}
      >
        <DialogTitle className="flex justify-center bg-green-100">
          Before we discharge {patientData.name}
        </DialogTitle>
        <DialogContent className="px-20">
          <FormControl variant="outlined">
            <label className="flex justify-center w-full text-gray-900 mt-2">
              Is the patient willing to donate blood for Plasma?
            </label>
            <RadioGroup
              className="flex-row justify-center gap-15 mt-2 ml-10"
              name="blood-donate"
              value={preDischargeForm.donatePlasma}
              onChange={(event) =>
                handlePreDischargeFormChange("donatePlasma", event)
              }
            >
              <FormControlLabel
                value="yes"
                control={<Radio />}
                label="Yes"
                className="mr-0"
              />
              <FormControlLabel
                value="no"
                control={<Radio />}
                label="No"
                className="mr-0"
              />
              <FormControlLabel
                value="not-fit"
                control={<Radio />}
                label="Not fit for donation currently"
                className="w-48 mr-0"
              />
            </RadioGroup>

            <div className="flex flex-col items-center">
              <Fragment>
                <label
                  id="covid-status-pre-form"
                  className="flex justify-center w-full text-gray-900 mb-2 mt-5"
                >
                  Has the patient's disease status changed? If so, to what?
                </label>
                <Select
                  className="h-10"
                  labelId="covid-status-pre-form"
                  value={preDischargeForm.disease_status}
                  onChange={(event) =>
                    handlePreDischargeFormChange("disease_status", event)
                  }
                >
                  {DISEASE_STATUS.map((value) => (
                    <MenuItem value={value}>{value}</MenuItem>
                  ))}
                </Select>
              </Fragment>

              <label className="flex justify-center w-full mt-5 text-gray-900">
                Would you like to update the patient's SRF ID and Test date?
              </label>

              <div className="flex">
                <TextInputField
                  className="flex flex-1 mr-10"
                  name="srf_id"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  placeholder="SRF ID"
                  value={preDischargeForm.srf_id || patientData.srf_id}
                  onChange={(event) =>
                    handlePreDischargeFormChange("srf_id", event)
                  }
                  errors=""
                />

                <DateInputField
                  className="flex flex-1 ml-5"
                  fullWidth={true}
                  label="Date of test"
                  value={
                    preDischargeForm.date_of_test ||
                    (patientData.date_of_test as string)
                  }
                  onChange={(event) =>
                    handlePreDischargeFormChange("date_of_test", event)
                  }
                  inputVariant="outlined"
                  margin="dense"
                  disableFuture={true}
                  errors={""}
                />
              </div>
            </div>
          </FormControl>
        </DialogContent>
        <DialogActions className="flex justify-between mt-5 px-5 border-t">
          <Button onClick={handleDischargeClose}>Cancel</Button>

          {isSendingDischargeApi ? (
            <CircularProgress size={20} />
          ) : (
            <Button
              color="primary"
              onClick={() => handlePatientDischarge(false)}
              autoFocus
              disabled={preDischargeForm.disease_status ? false : true}
            >
              Proceed with Discharge
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <div>
        <PageTitle title="Consultation History" hideBack={true} />
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
