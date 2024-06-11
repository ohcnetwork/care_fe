import { CONSULTATION_TABS, GENDER_TYPES } from "../../../Common/constants";
import { ConsultationModel } from "../models";
import {
  getConsultation,
  getPatient,
  listAssetBeds,
  listShiftRequests,
} from "../../../Redux/actions";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { lazy, useCallback, useState } from "react";
import DoctorVideoSlideover from "../DoctorVideoSlideover";
import { make as Link } from "../../Common/components/Link.bs";
import { PatientModel } from "../../Patient/models";
import { formatDateTime, relativeTime } from "../../../Utils/utils";

import { navigate, useQueryParams } from "raviger";
import { useDispatch } from "react-redux";
import { triggerGoal } from "../../../Integrations/Plausible";
import useAuthUser from "../../../Common/hooks/useAuthUser";
import { ConsultationUpdatesTab } from "./ConsultationUpdatesTab";
import { ConsultationABGTab } from "./ConsultationABGTab";
import { ConsultationNursingTab } from "./ConsultationNursingTab";
import { ConsultationFeedTab } from "./ConsultationFeedTab";
import { ConsultationSummaryTab } from "./ConsultationSummaryTab";
import { ConsultationFilesTab } from "./ConsultationFilesTab";
import { ConsultationMedicinesTab } from "./ConsultationMedicinesTab";
import { ConsultationInvestigationsTab } from "./ConsultationInvestigationsTab";
import { ConsultationVentilatorTab } from "./ConsultationVentilatorTab";
import { ConsultationPressureSoreTab } from "./ConsultationPressureSoreTab";
import { ConsultationDialysisTab } from "./ConsultationDialysisTab";
import { ConsultationNeurologicalMonitoringTab } from "./ConsultationNeurologicalMonitoringTab";
import ABDMRecordsTab from "../../ABDM/ABDMRecordsTab";
import { ConsultationNutritionTab } from "./ConsultationNutritionTab";
import PatientNotesSlideover from "../PatientNotesSlideover";
import { AssetBedModel } from "../../Assets/AssetTypes";
import PatientInfoCard from "../../Patient/PatientInfoCard";
import RelativeDateUserMention from "../../Common/RelativeDateUserMention";
import DiagnosesListAccordion from "../../Diagnosis/DiagnosesListAccordion";
import { CameraFeedPermittedUserTypes } from "../../../Utils/permissions";
import Error404 from "../../ErrorPages/404";

const Loading = lazy(() => import("../../Common/Loading"));
const PageTitle = lazy(() => import("../../Common/PageTitle"));

export interface ConsultationTabProps {
  consultationId: string;
  facilityId: string;
  patientId: string;
  consultationData: ConsultationModel;
  patientData: PatientModel;
}

const TABS = {
  UPDATES: ConsultationUpdatesTab,
  FEED: ConsultationFeedTab,
  SUMMARY: ConsultationSummaryTab,
  MEDICINES: ConsultationMedicinesTab,
  FILES: ConsultationFilesTab,
  INVESTIGATIONS: ConsultationInvestigationsTab,
  ABG: ConsultationABGTab,
  NURSING: ConsultationNursingTab,
  NEUROLOGICAL_MONITORING: ConsultationNeurologicalMonitoringTab,
  VENTILATOR: ConsultationVentilatorTab,
  NUTRITION: ConsultationNutritionTab,
  PRESSURE_SORE: ConsultationPressureSoreTab,
  DIALYSIS: ConsultationDialysisTab,
  ABDM: ABDMRecordsTab,
};

export const ConsultationDetails = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  let tab = undefined;
  if (Object.keys(TABS).includes(props.tab.toUpperCase())) {
    tab = props.tab.toUpperCase() as keyof typeof TABS;
  }
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [qParams, _] = useQueryParams();

  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {} as ConsultationModel,
  );
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [activeShiftingData, setActiveShiftingData] = useState<Array<any>>([]);
  const [isCameraAttached, setIsCameraAttached] = useState(false);

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
  const [showPatientNotesPopup, setShowPatientNotesPopup] = useState(false);

  const authUser = useAuthUser();

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
          // if (res.data.symptoms?.length) {
          //   const symptoms = res.data.symptoms
          //     .filter((symptom: number) => symptom !== 9)
          //     .map((symptom: number) => {
          //       const option = symptomChoices.find((i) => i.id === symptom);
          //       return option ? option.text.toLowerCase() : symptom;
          //     });
          //   data.symptoms_text = symptoms.join(", ");
          // }
          if (facilityId != data.facility || patientId != data.patient) {
            navigate(
              `/facility/${data.facility}/patient/${data.patient}/consultation/${data?.id}`,
            );
          }
          setConsultationData(data);
          const assetRes = data?.current_bed?.bed_object?.id
            ? await dispatch(
                listAssetBeds({
                  bed: data?.current_bed?.bed_object?.id,
                }),
              )
            : null;
          const isCameraAttachedRes =
            assetRes != null
              ? assetRes.data.results.some((asset: AssetBedModel) => {
                  return asset?.asset_object?.asset_class === "ONVIF";
                })
              : false;
          setIsCameraAttached(isCameraAttachedRes);
          const id = res.data.patient;
          const patientRes = await dispatch(getPatient({ id }));
          if (patientRes?.data) {
            const patientGender = getPatientGender(patientRes.data);
            const patientAddress = getPatientAddress(patientRes.data);
            const patientComorbidities = getPatientComorbidities(
              patientRes.data,
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

          // Get shifting data
          const shiftingRes = await dispatch(
            listShiftRequests({ patient: id }, "shift-list-call"),
          );
          if (shiftingRes?.data?.results) {
            const data = shiftingRes.data.results;
            setActiveShiftingData(data);
          }
        } else {
          navigate("/not-found");
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, patientData.is_vaccinated],
  );

  useAbortableEffect((status: statusType) => {
    fetchData(status);
    triggerGoal("Patient Consultation Viewed", {
      facilityId: facilityId,
      consultationId: consultationId,
      userId: authUser.id,
    });
  }, []);

  const consultationTabProps: ConsultationTabProps = {
    consultationId,
    consultationData,
    patientId: consultationData.patient,
    facilityId: consultationData.facility,
    patientData,
  };

  if (!tab) {
    return <Error404 />;
  }

  const SelectedTab = TABS[tab];

  if (isLoading) {
    return <Loading />;
  }

  const tabButtonClasses = (selected: boolean) =>
    `capitalize min-w-max-content cursor-pointer border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300 font-bold whitespace-nowrap ${
      selected === true ? "border-primary-500 text-primary-600 border-b-2" : ""
    }`;

  return (
    <div>
      <div className="px-2 pb-2">
        <nav className="relative flex flex-wrap items-start justify-between">
          <PageTitle
            title="Patient Dashboard"
            className="sm:m-0 sm:p-0"
            crumbsReplacements={{
              [facilityId]: { name: patientData?.facility_object?.name },
              [patientId]: { name: patientData?.name },
              [consultationId]: {
                name:
                  consultationData.suggestion === "A"
                    ? `Admitted on ${formatDateTime(
                        consultationData.encounter_date!,
                      )}`
                    : consultationData.suggestion_text,
              },
            }}
            breadcrumbs={true}
            backUrl="/patients"
          />
          <div
            className="flex w-full flex-col min-[1150px]:w-min min-[1150px]:flex-row min-[1150px]:items-center"
            id="consultationpage-header"
          >
            {!consultationData.discharge_date && (
              <>
                <button
                  onClick={() => {
                    triggerGoal("Doctor Connect Clicked", {
                      consultationId,
                      facilityId: patientData.facility,
                      userId: authUser.id,
                      page: "ConsultationDetails",
                    });
                    setShowDoctors(true);
                  }}
                  className="btn btn-primary m-1 w-full hover:text-white"
                >
                  Doctor Connect
                </button>
                {patientData.last_consultation?.id &&
                  isCameraAttached &&
                  CameraFeedPermittedUserTypes.includes(authUser.user_type) && (
                    <Link
                      href={`/facility/${patientData.facility}/patient/${patientData.id}/consultation/${patientData.last_consultation?.id}/feed`}
                      className="btn btn-primary m-1 w-full hover:text-white"
                    >
                      Camera Feed
                    </Link>
                  )}
              </>
            )}
            <Link
              href={`/facility/${patientData.facility}/patient/${patientData.id}`}
              className="btn btn-primary m-1 w-full hover:text-white"
              id="patient-details"
            >
              Patient Details
            </Link>
            <Link
              id="patient_doctor_notes"
              onClick={() =>
                showPatientNotesPopup
                  ? navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/notes`,
                    )
                  : setShowPatientNotesPopup(true)
              }
              className="btn btn-primary m-1 w-full hover:text-white"
            >
              Discussion Notes
            </Link>
          </div>
        </nav>
        <div className="mt-2 flex w-full flex-col md:flex-row">
          <div className="size-full rounded-lg border bg-white text-black shadow">
            <PatientInfoCard
              patient={patientData}
              consultation={consultationData}
              fetchPatientData={fetchData}
              consultationId={consultationId}
              activeShiftingData={activeShiftingData}
              showAbhaProfile={qParams["show-abha-profile"] === "true"}
            />

            <div className="flex flex-col justify-between px-4 md:flex-row">
              {consultationData.admitted_to && (
                <div className="mt-2 rounded-lg border bg-gray-100 p-2 md:mt-0">
                  <div className="border-b-2 py-1">
                    Patient
                    {consultationData.discharge_date
                      ? " Discharged from"
                      : " Admitted to"}
                    <span className="badge badge-pill badge-warning ml-2 font-bold">
                      {consultationData.admitted_to}
                    </span>
                  </div>
                  {(consultationData.discharge_date ??
                    consultationData.encounter_date) && (
                    <div className="text-3xl font-bold">
                      {relativeTime(
                        consultationData.discharge_date
                          ? consultationData.discharge_date
                          : consultationData.encounter_date,
                      )}
                    </div>
                  )}
                  <div className="-mt-2 text-xs">
                    {consultationData.encounter_date &&
                      formatDateTime(consultationData.encounter_date)}
                    {consultationData.discharge_date &&
                      ` - ${formatDateTime(consultationData.discharge_date)}`}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between gap-2 px-4 py-1 md:flex-row">
              <div className="font-base flex flex-col text-xs leading-relaxed text-gray-700">
                <div className="flex">
                  <span className="text-gray-900">Created: </span>&nbsp;
                  <RelativeDateUserMention
                    actionDate={consultationData.created_date}
                    user={consultationData.created_by}
                    tooltipPosition="right"
                    withoutSuffix={true}
                  />
                </div>
              </div>
              <div className="font-base flex flex-col text-xs leading-relaxed text-gray-700 md:text-right">
                <div className="flex">
                  <span className="text-gray-900">Last Modified: </span>&nbsp;
                  <RelativeDateUserMention
                    actionDate={consultationData.modified_date}
                    user={consultationData.last_edited_by}
                    tooltipPosition="left"
                    withoutSuffix={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {!!consultationData.diagnoses?.length && (
          <div className="col-span-1 mt-2 overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-2">
              <DiagnosesListAccordion
                diagnoses={consultationData.diagnoses ?? []}
              />
            </div>
          </div>
        )}
        <div className="mt-4 w-full border-b-2 border-gray-200">
          <div className="overflow-x-auto sm:flex sm:items-baseline">
            <div className="mt-4 sm:mt-0">
              <nav
                className="flex space-x-6 overflow-x-auto pb-2 pl-2 "
                id="consultation_tab_nav"
              >
                {CONSULTATION_TABS.map((p) => {
                  if (p.text === "FEED") {
                    if (
                      isCameraAttached === false || // No camera attached
                      consultationData?.discharge_date || // Discharged
                      !consultationData?.current_bed?.bed_object?.id || // Not admitted to bed
                      !CameraFeedPermittedUserTypes.includes(authUser.user_type)
                    )
                      return null; // Hide feed tab
                  }

                  if (p.text === "ABDM" && !patientData.abha_number) {
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
        <SelectedTab {...consultationTabProps} />
      </div>

      <DoctorVideoSlideover
        facilityId={facilityId}
        show={showDoctors}
        setShow={setShowDoctors}
      />

      {showPatientNotesPopup && (
        <PatientNotesSlideover
          patientId={patientId}
          facilityId={facilityId}
          consultationId={consultationId}
          setShowPatientNotesPopup={setShowPatientNotesPopup}
        />
      )}
    </div>
  );
};
