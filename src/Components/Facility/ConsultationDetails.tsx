import {
  CONSULTATION_TABS,
  GENDER_TYPES,
  OptionsType,
  SYMPTOM_CHOICES,
} from "../../Common/constants";
import { ConsultationModel, ICD11DiagnosisModel } from "./models";
import { getConsultation, getPatient } from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useCallback, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DischargeModal from "./DischargeModal";
import DischargeSummaryModal from "./DischargeSummaryModal";
import DoctorVideoSlideover from "./DoctorVideoSlideover";
import { make as Link } from "../Common/components/Link.gen";
import PatientInfoCard from "../Patient/PatientInfoCard";
import { PatientModel } from "../Patient/models";
import { formatDate } from "../../Utils/utils";
import loadable from "@loadable/component";
import moment from "moment";
import { navigate } from "raviger";
import { useDispatch } from "react-redux";
import { ConsultationTabProps } from "../../Common/constants";
import ConsultationUpdatesTab from "./ConsultationUpdatesTab";
import ConsultationFeedTab from "./ConsultationFeedTab";
import ConsultationSummaryTab from "./ConsultationSummaryTab";
import ConsultationMedicinesTab from "./ConsultationMedicinesTab";
import ConsultationFilesTab from "./ConsultationFilesTab";
import ConsultationABGTab from "./ConsultationABGTab";
import ConsultationNursingTab from "./ConsultationNursingTab";
import ConsultationNeurologicalMonitoringTab from "./ConsultationNeurologicalMonitoringTab";
import ConsultationVentilatorTab from "./ConsultationVentilatorTab";
import ConsultationNutritionTab from "./ConsultationNutritionTab";
import ConsultationPressureSoreTab from "./ConsultationPressureSoreTab";
import ConsultationDialysisTab from "./ConsultationDialysisTab";
import ConsultationInvestigationsTab from "./ConsultationInvestigationsTab";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const symptomChoices = [...SYMPTOM_CHOICES];

export const ConsultationDetails = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const tab = props.tab.toUpperCase();
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);

  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {} as ConsultationModel
  );
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [openDischargeSummaryDialog, setOpenDischargeSummaryDialog] =
    useState(false);
  const [openDischargeDialog, setOpenDischargeDialog] = useState(false);

  const getPatientGender = (patientData: any) =>
    GENDER_TYPES.find((i) => i.id === patientData.gender)?.text;

  const getPatientAddress = (patientData: any) =>
    `${patientData.address},\n${patientData.ward_object?.name},\n${patientData.local_body_object?.name},\n${patientData.district_object?.name},\n${patientData.state_object?.name}`;

  const getPatientComorbidities = (patientData: any) => {
    if (patientData?.medical_history?.length) {
      const medHis = patientData.medical_history;
      return medHis.map((item: any) => item.disease).join(", ");
    } else {
      return "None";
    }
  };

  const CONSULTATION_TAB: {
    [key: string]: (props: ConsultationTabProps) => JSX.Element;
  } = {
    UPDATES: ConsultationUpdatesTab,
    FEED: ConsultationFeedTab,
    SUMMARY: ConsultationSummaryTab,
    MEDICINES: ConsultationMedicinesTab,
    FILES: ConsultationFilesTab,
    ABG: ConsultationABGTab,
    NURSING: ConsultationNursingTab,
    NEUROLOGICAL_MONITORING: ConsultationNeurologicalMonitoringTab,
    VENTILATOR: ConsultationVentilatorTab,
    NUTRITION: ConsultationNutritionTab,
    PRESSURE_SORE: ConsultationPressureSoreTab,
    DIALYSIS: ConsultationDialysisTab,
    INVESTIGATIONS: ConsultationInvestigationsTab,
  };
  const SelectedTab = CONSULTATION_TAB[tab];

  const consultationProps: ConsultationTabProps = {
    consultationData: consultationData,
    patientData: patientData,
    facilityId: facilityId,
    patientId: patientId,
    consultationId: consultationId,
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getConsultation(consultationId));
      if (!status.aborted) {
        if (res?.data) {
          const data: ConsultationModel = {
            ...res.data,
            symptoms_text: "",
          };
          if (res.data.symptoms?.length) {
            const symptoms = res.data.symptoms
              .filter((symptom: number) => symptom !== 9)
              .map((symptom: number) => {
                const option = symptomChoices.find((i) => i.id === symptom);
                return option ? option.text.toLowerCase() : symptom;
              });
            data.symptoms_text = symptoms.join(", ");
          }
          setConsultationData(data);
          const id = res.data.patient;
          const patientRes = await dispatch(getPatient({ id }));
          if (patientRes?.data) {
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

        {diagnoses.slice(0, !showMore ? nshow : undefined).map((diagnosis) => (
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
      <DischargeSummaryModal
        consultation={consultationData}
        show={openDischargeSummaryDialog}
        onClose={() => setOpenDischargeSummaryDialog(false)}
      />

      <DischargeModal
        show={openDischargeDialog}
        onClose={() => setOpenDischargeDialog(false)}
        consultationData={consultationData}
      />

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
            backUrl="/patients"
          >
            <div className="w-full sm:w-min lg:absolute xl:right-0 -right-6 top-0 flex sm:flex-row sm:items-center flex-col space-y-1 sm:space-y-0 sm:divide-x-2">
              {!consultationData.discharge_date && (
                <div className="w-full flex flex-col sm:flex-row px-2">
                  <ButtonV2
                    onClick={() =>
                      navigate(
                        `/facility/${patientData.facility}/patient/${patientData.id}/shift/new`
                      )
                    }
                    className="w-full btn m-1 btn-primary hover:text-white"
                  >
                    <CareIcon className="care-l-ambulance w-5 h-5" />
                    Shift Patient
                  </ButtonV2>
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
          </PageTitle>
        </nav>
        <div className="flex md:flex-row flex-col w-full mt-2">
          <div className="border rounded-lg bg-white shadow h-full text-black w-full">
            <PatientInfoCard
              patient={patientData}
              consultation={consultationData}
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
                  {(consultationData.admission_date ??
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
                consultationData.other_symptoms && (
                <div className="capitalize">
                  <span className="font-semibold leading-relaxed">
                    Other Symptoms:{" "}
                  </span>
                  {consultationData.other_symptoms}
                </div>
                )
                <ShowDiagnosis
                  diagnoses={
                    consultationData?.icd11_provisional_diagnoses_object
                  }
                  label="Provisional Diagnosis (as per ICD-11 recommended by WHO)"
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
                    ...(consultationData?.icd11_diagnoses_object ?? []),
                  ]}
                  label="Diagnosis (as per ICD-11 recommended by WHO)"
                />
                {consultationData.verified_by && (
                  <div className="text-sm mt-2">
                    <span className="font-semibold leading-relaxed">
                      Verified By:{" "}
                    </span>
                    {consultationData.verified_by}
                    <i className="fas fa-check fill-current text-lg text-green-500 ml-2"></i>
                  </div>
                )}
              </div>
              <div className="flex flex-col lg:flex-row gap-2 text-right h-full">
                <button
                  className="btn btn-primary"
                  onClick={() => setOpenDischargeSummaryDialog(true)}
                >
                  <i className="fas fa-clipboard-list"></i>
                  &nbsp; Discharge Summary
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => setOpenDischargeDialog(true)}
                  disabled={!!consultationData.discharge_date}
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
                    if (
                      !consultationData?.current_bed?.bed_object?.id ??
                      consultationData?.discharge_date !== null
                    )
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
        <SelectedTab {...consultationProps} />
        </div>
   

      <DoctorVideoSlideover
        facilityId={facilityId}
        show={showDoctors}
        setShow={setShowDoctors}
      />
    </div>
  );
};
