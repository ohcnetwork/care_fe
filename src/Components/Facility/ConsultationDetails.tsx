import { navigate } from "raviger";
import { Button, CircularProgress } from "@material-ui/core";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import * as Notification from "../../Utils/Notifications";
import { getConsultation, getPatient } from "../../Redux/actions";
import loadable from "@loadable/component";
import { ConsultationModel, ICD11DiagnosisModel } from "./models";
import { PatientModel } from "../Patient/models";
import {
  SYMPTOM_CHOICES,
  CONSULTATION_TABS,
  OptionsType,
  GENDER_TYPES,
  DISCHARGE_REASONS,
} from "../../Common/constants";
import { FileUpload } from "../Patient/FileUpload";
import { PrimaryParametersPlot } from "./Consultations/PrimaryParametersPlot";
import { MedicineTables } from "./Consultations/MedicineTables";
import { ABGPlots } from "./Consultations/ABGPlots";
import { DailyRoundsList } from "./Consultations/DailyRoundsList";
import { make as Link } from "../Common/components/Link.gen";
import { NursingPlot } from "./Consultations/NursingPlot";
import { NeurologicalTable } from "./Consultations/NeurologicalTables";
import { VentilatorPlot } from "./Consultations/VentilatorPlot";
import { NutritionPlots } from "./Consultations/NutritionPlots";
import { PressureSoreDiagrams } from "./Consultations/PressureSoreDiagrams";
import { DialysisPlots } from "./Consultations/DialysisPlots";
import ViewInvestigations from "./Investigations/ViewInvestigations";
import DoctorVideoSlideover from "./DoctorVideoSlideover";
import { Feed } from "./Consultations/Feed";
import { validateEmailAddress } from "../../Common/validation";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import InputLabel from "@material-ui/core/InputLabel";
import {
  TextInputField,
  SelectField,
  MultilineInputField,
} from "../Common/HelperInputFields";
import { discharge, dischargePatient } from "../../Redux/actions";
import ReadMore from "../Common/components/Readmore";
import ViewInvestigationSuggestions from "./Investigations/InvestigationSuggestions";
import { formatDate } from "../../Utils/utils";
import ResponsiveMedicineTable from "../Common/components/ResponsiveMedicineTables";
import PatientInfoCard from "../Patient/PatientInfoCard";
import PatientVitalsCard from "../Patient/PatientVitalsCard";
interface PreDischargeFormInterface {
  discharge_reason: string;
  discharge_notes: string;
}

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const symptomChoices = [...SYMPTOM_CHOICES];

export const ConsultationDetails = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const tab = props.tab.toUpperCase();
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const state: any = useSelector((state) => state);
  const { currentUser } = state;

  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {}
  );
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [open, setOpen] = useState(false);
  const [openDischargeDialog, setOpenDischargeDialog] = useState(false);
  const [isSendingDischargeApi, setIsSendingDischargeApi] = useState(false);

  const initDischargeSummaryForm: { email: string } = {
    email: "",
  };
  const [dischargeSummaryState, setDischargeSummaryForm] = useState(
    initDischargeSummaryForm
  );
  const [errors, setErrors] = useState<any>({});
  const [preDischargeForm, setPreDischargeForm] =
    useState<PreDischargeFormInterface>({
      discharge_reason: "",
      discharge_notes: "",
    });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleDischageClickOpen = () => {
    setOpenDischargeDialog(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDischargeClose = () => {
    setOpenDischargeDialog(false);
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
            msg: "We will be sending an email shortly. Please check your inbox.",
          });
        }
      });
      setOpen(false);
    }
  };

  const handleDischargeSummary = (e: any) => {
    e.preventDefault();
    setOpen(false);
  };

  const getPatientGender = (patientData: any) =>
    GENDER_TYPES.find((i) => i.id === patientData.gender)?.text;

  const getPatientAddress = (patientData: any) =>
    `${patientData.address},\n${patientData.ward_object?.name},\n${patientData.local_body_object?.name},\n${patientData.district_object?.name},\n${patientData.state_object?.name}`;

  const getPatientComorbidities = (patientData: any) => {
    if (
      patientData &&
      patientData.medical_history &&
      patientData.medical_history.length
    ) {
      const medHis = patientData.medical_history;
      return medHis.map((item: any) => item.disease).join(", ");
    } else {
      return "None";
    }
  };

  const handlePatientDischarge = async (value: boolean) => {
    setIsSendingDischargeApi(true);

    if (!preDischargeForm.discharge_reason) {
      setErrors({
        ...errors,
        discharge_reason: "Please select a reason for discharge",
      });
      setIsSendingDischargeApi(false);
      return;
    }

    if (
      preDischargeForm.discharge_reason == "EXP" &&
      !preDischargeForm.discharge_notes.trim()
    ) {
      setErrors({
        ...errors,
        discharge_notes: "Please enter the cause of death",
      });
      setIsSendingDischargeApi(false);
      return;
    }

    const dischargeResponse = await dispatch(
      dischargePatient(
        { discharge: value, ...preDischargeForm },
        { id: patientData.id }
      )
    );

    setIsSendingDischargeApi(false);
    if (dischargeResponse?.status === 200) {
      const dischargeData = Object.assign({}, patientData);
      dischargeData["discharge"] = value;
      setPatientData(dischargeData);

      Notification.Success({
        msg: "Patient Discharged",
      });
      setOpenDischargeDialog(false);
      window.location.reload();
    }
  };

  const handleDischargeSummaryFormChange = (e: any) => {
    const { value } = e.target;

    const errorField = Object.assign({}, errors);
    errorField["dischargeSummaryForm"] = null;
    setErrors(errorField);

    setDischargeSummaryForm({ email: value });
  };

  const dischargeSummaryFormSetUserEmail = () => {
    if (!currentUser.data.email.trim())
      return Notification.Error({
        msg: "Email not provided! Please update profile",
      });
    setDischargeSummaryForm({ email: currentUser.data.email });
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getConsultation(consultationId));
      if (!status.aborted) {
        if (res && res.data) {
          const data: ConsultationModel = {
            ...res.data,
            symptoms_text: "",
          };
          if (res.data.symptoms && res.data.symptoms.length) {
            const symptoms = res.data.symptoms
              .filter((symptom: number) => symptom !== 9)
              .map((symptom: number) => {
                const option = symptomChoices.find((i) => i.id === symptom);
                return option ? option.text.toLowerCase() : symptom;
              });
            data.symptoms_text = symptoms.join(", ");
            data.discharge_advice =
              Object.keys(res.data.discharge_advice).length === 0
                ? []
                : res.data.discharge_advice;
          }
          if (!Array.isArray(res.data.prn_prescription)) {
            data.prn_prescription = [];
          }
          setConsultationData(data);
          const id = res.data.patient;
          const patientRes = await dispatch(getPatient({ id }));
          if (patientRes && patientRes.data) {
            const patientGender = getPatientGender(patientRes.data);
            const patientAddress = getPatientAddress(patientRes.data);
            const patientComorbidities = getPatientComorbidities(
              patientRes.data
            );
            const data = {
              ...patientRes.data,
              gender: patientGender,
              address: patientAddress,
              comorbidities: patientComorbidities,
              is_declared_positive: patientRes.data.is_declared_positive
                ? "Yes"
                : "No",
              is_vaccinated: patientData.is_vaccinated ? "Yes" : "No",
            };
            setPatientData(data);
          }
        } else {
          navigate("/not-found");
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, patientData.is_vaccinated]
  );

  useAbortableEffect((status: statusType) => {
    fetchData(status);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  const tabButtonClasses = (selected: boolean) =>
    `capitalize min-w-max-content cursor-pointer border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300 font-bold whitespace-nowrap ${
      selected === true ? "border-primary-500 text-primary-600 border-b-2" : ""
    }`;

  const ShowDiagnosis = ({
    diagnoses = [],
    label = "Diagnosis",
    nshow = 2,
  }: {
    diagnoses: ICD11DiagnosisModel[] | undefined;
    label: string;
    nshow?: number;
  }) => {
    const [showMore, setShowMore] = useState(false);

    return diagnoses.length ? (
      <div className="text-sm w-full">
        <p className="font-semibold leading-relaxed">{label}</p>

        {diagnoses
          .slice(0, !showMore ? nshow : undefined)
          .map((diagnosis: any) => (
            <p>{diagnosis.label}</p>
          ))}
        {diagnoses.length > nshow && (
          <>
            {!showMore ? (
              <a
                onClick={() => setShowMore(true)}
                className="text-sm text-blue-600 hover:text-blue-300 cursor-pointer"
              >
                show more
              </a>
            ) : (
              <a
                onClick={() => setShowMore(false)}
                className="text-sm text-blue-600 hover:text-blue-300 cursor-pointer"
              >
                show less
              </a>
            )}
          </>
        )}
      </div>
    ) : null;
  };

  return (
    <div>
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
        fullWidth={true}
        open={openDischargeDialog}
        onClose={handleDischargeClose}
      >
        <DialogTitle>
          <i className="text-red-500 fas fa-exclamation-triangle"></i>
          &nbsp;Discharge Patient From Care
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-4">
            <div className="sm:w-1/2" id="discharge-reason-div">
              <InputLabel id="discharge-reason-label">
                Discharge Reason*
              </InputLabel>
              <SelectField
                name="discharge_reason"
                variant="standard"
                value={preDischargeForm.discharge_reason}
                options={[{ id: "", text: "Select" }, ...DISCHARGE_REASONS]}
                onChange={(e) =>
                  setPreDischargeForm((prev) => ({
                    ...prev,
                    discharge_reason: e.target.value,
                  }))
                }
                errors={errors?.discharge_reason}
              />
            </div>

            <div id="discharge-notes-div">
              <InputLabel id="refered-label">
                {preDischargeForm.discharge_reason == "EXP"
                  ? "Cause of death *"
                  : "Discharge notes"}
              </InputLabel>
              <MultilineInputField
                name="discharge_notes"
                variant="outlined"
                margin="dense"
                type="text"
                rows={2}
                InputLabelProps={{ shrink: !!preDischargeForm.discharge_notes }}
                value={preDischargeForm.discharge_notes}
                onChange={(e) =>
                  setPreDischargeForm((prev) => ({
                    ...prev,
                    discharge_notes: e.target.value,
                  }))
                }
                errors={errors?.discharge_notes}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="flex justify-between mt-5 px-5 border-t">
          <Button
            variant="outlined"
            className="bg-gray-200 hover:bg-gray-400"
            onClick={handleDischargeClose}
          >
            Cancel
          </Button>

          {isSendingDischargeApi ? (
            <CircularProgress size={20} />
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handlePatientDischarge(false)}
              autoFocus
            >
              Discharge
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <div className="px-2 pb-2">
        <nav className="flex justify-between flex-wrap relative">
          <PageTitle
            title="Patient Dashboard"
            className="sm:m-0 sm:p-0"
            crumbsReplacements={{
              [facilityId]: { name: patientData?.facility_object?.name },
              [patientId]: { name: patientData?.name },
              [consultationId]: {
                name: `Admitted on ${formatDate(
                  consultationData.admission_date
                    ? consultationData.admission_date
                    : "00:00"
                )}`,
              },
            }}
            breadcrumbs={true}
          />
          <div className="w-full sm:w-min lg:absolute xl:right-0 -right-6 top-0 flex sm:flex-row sm:items-center flex-col space-y-1 sm:space-y-0 sm:divide-x-2">
            {patientData.is_active && (
              <div className="w-full flex flex-col sm:flex-row px-2">
                <button
                  onClick={() => setShowDoctors(true)}
                  className="w-full btn m-1 btn-primary hover:text-white"
                >
                  Doctor Connect
                </button>
                {patientData.last_consultation?.id && (
                  <Link
                    href={`/facility/${patientData.facility}/patient/${patientData.id}/consultation/${patientData.last_consultation?.id}/feed`}
                    className="w-full btn m-1 btn-primary hover:text-white"
                  >
                    Camera Feed
                  </Link>
                )}
              </div>
            )}
            <div className="w-full flex flex-col sm:flex-row px-2">
              <Link
                href={`/facility/${patientData.facility}/patient/${patientData.id}`}
                className="w-full btn m-1 btn-primary hover:text-white"
              >
                Patient Details
              </Link>
              <Link
                href={`/facility/${patientData.facility}/patient/${patientData.id}/notes`}
                className="w-full btn m-1 btn-primary hover:text-white"
              >
                Doctor&apos;s Notes
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex md:flex-row flex-col w-full mt-2">
          <div className="border rounded-lg bg-white shadow h-full text-black w-full">
            <PatientInfoCard
              patient={patientData}
              ip_no={consultationData.ip_no}
              fetchPatientData={fetchData}
            />

            <div className="flex md:flex-row flex-col justify-between border-t px-4 pt-5">
              {consultationData.admitted_to && (
                <div className="border rounded-lg bg-gray-100 p-2 md:mt-0 mt-2">
                  <div className="border-b-2 py-1">
                    Patient
                    {consultationData.discharge_date
                      ? " Discharged from"
                      : " Admitted to"}
                    <span className="badge badge-pill badge-warning font-bold ml-2">
                      {consultationData.admitted_to}
                    </span>
                  </div>
                  {(consultationData.admission_date ||
                    consultationData.discharge_date) && (
                    <div className="text-3xl font-bold">
                      {moment(
                        consultationData.discharge_date
                          ? consultationData.discharge_date
                          : consultationData.admission_date
                      ).fromNow()}
                    </div>
                  )}
                  <div className="text-xs -mt-2">
                    {consultationData.admission_date &&
                      formatDate(consultationData.admission_date)}
                    {consultationData.discharge_date &&
                      ` - ${formatDate(consultationData.discharge_date)}`}
                  </div>
                </div>
              )}
            </div>

            <div className="flex px-4 flex-col-reverse lg:flex-row gap-2">
              <div className="flex flex-col w-3/4 h-full">
                {/*consultationData.other_symptoms && (
                  <div className="capitalize">
                    <span className="font-semibold leading-relaxed">
                      Other Symptoms:{" "}
                    </span>
                    {consultationData.other_symptoms}
                  </div>
                )*/}

                <ShowDiagnosis
                  diagnoses={
                    consultationData?.icd11_provisional_diagnoses_object
                  }
                  label="Provisional Diagnosis"
                />

                <ShowDiagnosis
                  diagnoses={[
                    ...(consultationData?.diagnosis
                      ? [
                          {
                            id: "0",
                            label: consultationData?.diagnosis,
                            parentId: null,
                          },
                        ]
                      : []),
                    ...(consultationData?.icd11_diagnoses_object || []),
                  ]}
                  label="Diagnosis"
                />

                {consultationData.verified_by && (
                  <div className="text-sm mt-2">
                    <span className="font-semibold leading-relaxed">
                      Verified By:{" "}
                    </span>
                    {consultationData.verified_by}
                    <i className="fas fa-check-circle fill-current text-lg text-green-500 ml-2"></i>
                  </div>
                )}
              </div>
              <div className="flex flex-col lg:flex-row gap-2 text-right h-full">
                <button className="btn btn-primary" onClick={handleClickOpen}>
                  <i className="fas fa-clipboard-list"></i>
                  &nbsp; Discharge Summary
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleDischageClickOpen}
                  disabled={
                    !patientData.is_active ||
                    patientData.last_consultation?.facility !== facilityId
                  }
                >
                  <i className="fas fa-hospital-user"></i>
                  &nbsp; Discharge from CARE
                </button>
              </div>
            </div>
            <div className="flex md:flex-row flex-col gap-2 justify-between p-4">
              <div className="flex flex-col text-xs text-gray-700 font-base leading-relaxed">
                <div>
                  <span className="text-gray-900">Created: </span>
                  {consultationData.created_date
                    ? formatDate(consultationData.created_date)
                    : "--:--"}{" "}
                  |
                </div>
                {consultationData.created_by && (
                  <div>
                    {` ${consultationData.created_by.first_name} ${consultationData.created_by.last_name}  `}
                    {`@${consultationData.created_by.username} (${consultationData.created_by.user_type})`}
                  </div>
                )}
              </div>
              <div className="flex flex-col text-xs md:text-right text-gray-700 font-base leading-relaxed">
                <div>
                  <span className="text-gray-900">Last Modified: </span>
                  {consultationData.modified_date
                    ? formatDate(consultationData.modified_date)
                    : "--:--"}{" "}
                  |
                </div>
                {consultationData.last_edited_by && (
                  <div>
                    {` ${consultationData.last_edited_by.first_name} ${consultationData.last_edited_by.last_name}  `}
                    {`@${consultationData.last_edited_by.username} (${consultationData.last_edited_by.user_type})`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b-2 border-gray-200 mt-4 w-full">
          <div className="sm:flex sm:items-baseline overflow-x-auto">
            <div className="mt-4 sm:mt-0">
              <nav className="pl-2 flex space-x-6 overflow-x-auto pb-2 ">
                {CONSULTATION_TABS.map((p: OptionsType) => {
                  if (p.text === "FEED") {
                    if (!consultationData?.current_bed?.bed_object?.id)
                      return null;
                  }
                  return (
                    <Link
                      key={p.text}
                      className={tabButtonClasses(tab === p.text)}
                      href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/${p.text.toLocaleLowerCase()}`}
                    >
                      {p.desc}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
        {tab === "UPDATES" && (
          <div className="flex xl:flex-row flex-col">
            <div className="xl:w-2/3 w-full">
              <PageTitle title="Info" hideBack={true} breadcrumbs={false} />
              {!consultationData.discharge_date && (
                <section className="bg-white shadow-sm rounded-md flex items-stretch w-full flex-col lg:flex-row overflow-hidden">
                  <PatientVitalsCard patient={patientData} />
                </section>
              )}
              <div className="grid lg:grid-cols-2 gap-4 mt-4">
                {consultationData.symptoms_text && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        Symptoms
                      </h3>
                      <div className="">
                        <div className="capitalize">
                          {consultationData.symptoms_text}
                        </div>
                        {consultationData.other_symptoms && (
                          <div className="capitalize">
                            <span className="font-semibold leading-relaxed">
                              Other Symptoms:{" "}
                            </span>
                            {consultationData.other_symptoms}
                          </div>
                        )}
                        <span className="font-semibold leading-relaxed text-gray-800 text-xs">
                          from{" "}
                          {consultationData.symptoms_onset_date
                            ? formatDate(consultationData.symptoms_onset_date)
                            : "--:--"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {consultationData.history_of_present_illness && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        History of Present Illness
                      </h3>
                      <div className="mt-2">
                        <ReadMore
                          text={consultationData.history_of_present_illness}
                          minChars={250}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {consultationData.examination_details && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        Examination details and Clinical conditions:{" "}
                      </h3>
                      <div className="mt-2">
                        <ReadMore
                          text={consultationData.examination_details}
                          minChars={250}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {consultationData.prescribed_medication && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        Treatment Summary
                      </h3>
                      <div className="mt-2">
                        <ReadMore
                          text={consultationData.prescribed_medication}
                          minChars={250}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {consultationData.consultation_notes && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        General Instructions
                      </h3>
                      <div className="mt-2">
                        <ReadMore
                          text={consultationData.consultation_notes}
                          minChars={250}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(consultationData.operation ||
                  consultationData.special_instruction) && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        Notes
                      </h3>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {consultationData.operation && (
                          <div className="mt-4">
                            <h5>Operation</h5>
                            <ReadMore
                              text={consultationData.operation}
                              minChars={250}
                            />
                          </div>
                        )}
                        {consultationData.special_instruction && (
                          <div className="mt-4">
                            <h5>Special Instruction</h5>
                            <ReadMore
                              text={consultationData.special_instruction}
                              minChars={250}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {consultationData.intubation_start_date && (
                <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Date/Size/LL:{" "}
                    </h3>
                    <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="">
                        Intubation Date{" - "}
                        <span className="font-semibold">
                          {formatDate(consultationData.intubation_start_date)}
                        </span>
                      </div>
                      <div className="">
                        Extubation Date{" - "}
                        <span className="font-semibold">
                          {consultationData.intubation_end_date &&
                            formatDate(consultationData.intubation_end_date)}
                        </span>
                      </div>
                      <div className="">
                        ETT/TT (mmid){" - "}
                        <span className="font-semibold">
                          {consultationData.ett_tt}
                        </span>
                      </div>
                      <div className="">
                        Cuff Pressure (mmhg){" - "}
                        <span className="font-semibold">
                          {consultationData.cuff_pressure}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {consultationData.lines?.length > 0 && (
                <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Lines and Catheters
                    </h3>
                    <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                      {consultationData.lines?.map((line: any, idx: number) => (
                        <div key={idx} className="mt-4">
                          <h5>{line.type}</h5>
                          <p className="text-justify break-word">
                            Details:
                            <br />
                            <span>{line.other_type}</span>
                          </p>
                          <p>
                            Insertion Date:{" "}
                            <span className="font-semibold">
                              {formatDate(line.start_date)}
                            </span>
                          </p>
                          <p>
                            Site/Level of Fixation: <br />
                            <span className="text-justify break-word">
                              {line.site}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                    Body Details
                  </h3>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div>
                      Gender {" - "}
                      <span className="font-semibold">
                        {patientData.gender || "-"}
                      </span>
                    </div>
                    <div>
                      Age {" - "}
                      <span className="font-semibold">
                        {patientData.age || "-"}
                      </span>
                    </div>
                    <div>
                      Weight {" - "}
                      <span className="font-semibold">
                        {consultationData.weight || "-"} Kg
                      </span>
                    </div>
                    <div>
                      Height {" - "}
                      <span className="font-semibold">
                        {consultationData.height || "-"} cm
                      </span>
                    </div>
                    <div>
                      Body Surface Area {" - "}
                      <span className="font-semibold">
                        {Math.sqrt(
                          (Number(consultationData.weight) *
                            Number(consultationData.height)) /
                            3600
                        ).toFixed(2)}{" "}
                        m<sup>2</sup>
                      </span>
                    </div>
                    <div>
                      Blood Group {" - "}
                      <span className="font-semibold">
                        {patientData.blood_group || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:w-1/3 w-full pl-4">
              <PageTitle
                title="Update Log"
                hideBack={true}
                breadcrumbs={false}
              />
              <DailyRoundsList
                facilityId={facilityId}
                patientId={patientId}
                consultationId={consultationId}
                consultationData={consultationData}
              />
            </div>
          </div>
        )}
        {tab === "FEED" && (
          <div>
            <PageTitle
              title="Camera Feed"
              breadcrumbs={false}
              hideBack={true}
              focusOnLoad={true}
            />
            <Feed
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            />
          </div>
        )}
        {tab === "SUMMARY" && (
          <div className="mt-4">
            <PageTitle
              title="Primary Parameters Plot"
              hideBack={true}
              breadcrumbs={false}
            />
            <PrimaryParametersPlot
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            ></PrimaryParametersPlot>
          </div>
        )}
        {tab === "MEDICINES" && (
          <div>
            {consultationData.discharge_advice && (
              <div className="mt-4">
                <div className="flex flex-wrap text-lg font-semibold leading-relaxed text-gray-900 mb-2">
                  <span className="mr-3">Prescription</span>
                  <div className="text-xs text-gray-600 mt-2 ">
                    <i className="fas fa-history text-sm pr-2"></i>
                    {consultationData.modified_date &&
                      formatDate(consultationData.modified_date)}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
                      <ResponsiveMedicineTable
                        theads={[
                          "Medicine",
                          "Route",
                          "Frequency",
                          "Dosage",
                          "Days",
                          "Notes",
                        ]}
                        list={consultationData.discharge_advice}
                        objectKeys={[
                          "medicine",
                          "route",
                          "dosage",
                          "dosage_new",
                          "days",
                          "notes",
                        ]}
                        fieldsToDisplay={[2, 3]}
                      />
                      {consultationData.discharge_advice.length === 0 && (
                        <div className="flex items-center justify-center text-gray-600 py-2 text-semibold">
                          No data found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {consultationData.prn_prescription && (
              <div className="mt-4">
                <div className="flex flex-wrap text-lg font-semibold leading-relaxed text-gray-900 mb-2">
                  <span className="mr-3">PRN Prescription</span>
                  <div className="text-xs text-gray-600 mt-2">
                    <i className="fas fa-history text-sm pr-2"></i>
                    {consultationData.modified_date &&
                      formatDate(consultationData.modified_date)}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
                      <ResponsiveMedicineTable
                        theads={[
                          "Medicine",
                          "Route",
                          "Dosage",
                          "Indicator Event",
                          "Max. Dosage in 24 hrs",
                          "Min. time between 2 doses",
                        ]}
                        list={consultationData.prn_prescription}
                        objectKeys={[
                          "medicine",
                          "route",
                          "dosage",
                          "indicator",
                          "max_dosage",
                          "min_time",
                        ]}
                        fieldsToDisplay={[2, 4]}
                      />
                      {consultationData.prn_prescription.length === 0 && (
                        <div className="flex items-center justify-center text-gray-600 py-2 text-semibold">
                          No data found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <MedicineTables
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            />
          </div>
        )}
        {tab === "FILES" && (
          <div>
            <FileUpload
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
              type="CONSULTATION"
              hideBack={true}
              audio={true}
              unspecified={true}
            />
          </div>
        )}

        {tab === "ABG" && (
          <div>
            <PageTitle
              title="ABG Analysis Plot"
              hideBack={true}
              breadcrumbs={false}
            />
            <ABGPlots
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            ></ABGPlots>
          </div>
        )}
        {tab === "NURSING" && (
          <div>
            <PageTitle
              title="Nursing Analysis"
              hideBack={true}
              breadcrumbs={false}
            />
            <NursingPlot
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            ></NursingPlot>
          </div>
        )}
        {tab === "NEUROLOGICAL_MONITORING" && (
          <div>
            <PageTitle
              title="Neurological Monitoring"
              hideBack={true}
              breadcrumbs={false}
            />
            <NeurologicalTable
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            ></NeurologicalTable>
          </div>
        )}
        {tab === "VENTILATOR" && (
          <div>
            <PageTitle
              title="Ventilator Parameters"
              hideBack={true}
              breadcrumbs={false}
            />
            <VentilatorPlot
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            ></VentilatorPlot>
          </div>
        )}
        {tab === "NUTRITION" && (
          <div>
            <PageTitle title="Nutrition" hideBack={true} breadcrumbs={false} />
            <NutritionPlots
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
            ></NutritionPlots>
          </div>
        )}
        {tab === "PRESSURE_SORE" && (
          <div className="mt-4">
            <PageTitle
              title="Pressure Sore"
              hideBack={true}
              breadcrumbs={false}
            />
            <PressureSoreDiagrams consultationId={consultationId} />
          </div>
        )}
        {tab === "DIALYSIS" && (
          <div>
            <PageTitle
              title="Dialysis Plots"
              hideBack={true}
              breadcrumbs={false}
            />
            <DialysisPlots consultationId={consultationId}></DialysisPlots>
          </div>
        )}
        {tab === "INVESTIGATIONS" && (
          <div>
            <div className="sm:flex justify-between">
              <PageTitle
                title="Investigations"
                hideBack={true}
                breadcrumbs={false}
              />
              <div className="pt-6">
                <button
                  className="btn btn-primary w-full"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/`
                    )
                  }
                >
                  <i className="fas fa-plus w-4 mr-3"></i> Log Lab Result
                </button>
              </div>
            </div>
            <ViewInvestigations
              consultationId={consultationId}
              facilityId={facilityId}
              patientId={patientId}
            />
            <ViewInvestigationSuggestions consultationId={consultationId} />
          </div>
        )}
      </div>

      <DoctorVideoSlideover
        facilityId={facilityId}
        show={showDoctors}
        setShow={setShowDoctors}
      />
    </div>
  );
};
