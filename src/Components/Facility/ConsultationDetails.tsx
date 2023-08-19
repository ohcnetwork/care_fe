import { AssetBedModel, AssetClass, AssetData } from "../Assets/AssetTypes";
import {
  CONSULTATION_TABS,
  DISCHARGE_REASONS,
  GENDER_TYPES,
  OptionsType,
  SYMPTOM_CHOICES,
} from "../../Common/constants";
import {
  BedModel,
  ConsultationModel,
  FacilityModel,
  ICD11DiagnosisModel,
} from "./models";
import {
  getConsultation,
  getPatient,
  getPermittedFacility,
  listAssetBeds,
} from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { lazy, useCallback, useEffect, useState } from "react";

import { ABGPlots } from "./Consultations/ABGPlots";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Chip from "../../CAREUI/display/Chip";
import { DailyRoundsList } from "./Consultations/DailyRoundsList";
import { DialysisPlots } from "./Consultations/DialysisPlots";
import DischargeModal from "./DischargeModal";
import DischargeSummaryModal from "./DischargeSummaryModal";
import DoctorVideoSlideover from "./DoctorVideoSlideover";
import { Feed } from "./Consultations/Feed";
import { FileUpload } from "../Patient/FileUpload";
import HL7PatientVitalsMonitor from "../VitalsMonitor/HL7PatientVitalsMonitor";
import InvestigationTab from "./Investigations/investigationsTab";
import { make as Link } from "../Common/components/Link.bs";
import MedicineAdministrationsTable from "../Medicine/MedicineAdministrationsTable";
import { NeurologicalTable } from "./Consultations/NeurologicalTables";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import { NursingPlot } from "./Consultations/NursingPlot";
import { NutritionPlots } from "./Consultations/NutritionPlots";
import PatientInfoCard from "../Patient/PatientInfoCard";
import { PatientModel } from "../Patient/models";
import PrescriptionsTable from "../Medicine/PrescriptionsTable";
import { PressureSoreDiagrams } from "./Consultations/PressureSoreDiagrams";
import { PrimaryParametersPlot } from "./Consultations/PrimaryParametersPlot";
import ReadMore from "../Common/components/Readmore";
import VentilatorPatientVitalsMonitor from "../VitalsMonitor/VentilatorPatientVitalsMonitor";
import { VentilatorPlot } from "./Consultations/VentilatorPlot";
import { formatDate, formatDateTime, relativeTime } from "../../Utils/utils";

import { navigate } from "raviger";
import { useDispatch } from "react-redux";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { triggerGoal } from "../Common/Plausible";
import useVitalsAspectRatioConfig from "../VitalsMonitor/useVitalsAspectRatioConfig";
import useAuthUser from "../../Common/hooks/useAuthUser";

const Loading = lazy(() => import("../Common/Loading"));
const PageTitle = lazy(() => import("../Common/PageTitle"));
const symptomChoices = [...SYMPTOM_CHOICES];

export const ConsultationDetails = (props: any) => {
  const [medicinesKey, setMedicinesKey] = useState(0);
  const { t } = useTranslation();
  const { facilityId, patientId, consultationId } = props;
  const tab = props.tab.toUpperCase();
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [qParams, _] = useQueryParams();

  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {} as ConsultationModel
  );
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [openDischargeSummaryDialog, setOpenDischargeSummaryDialog] =
    useState(false);
  const [openDischargeDialog, setOpenDischargeDialog] = useState(false);
  const [showAutomatedRounds, setShowAutomatedRounds] = useState(true);

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

  const [hl7SocketUrl, setHL7SocketUrl] = useState<string>();
  const [ventilatorSocketUrl, setVentilatorSocketUrl] = useState<string>();
  const [monitorBedData, setMonitorBedData] = useState<AssetBedModel>();
  const [ventilatorBedData, setVentilatorBedData] = useState<AssetBedModel>();
  const authUser = useAuthUser();

  useEffect(() => {
    if (
      !consultationData.facility ||
      !consultationData.current_bed?.bed_object.id
    )
      return;

    const fetchData = async () => {
      const [facilityRes, assetBedRes] = await Promise.all([
        dispatch(getPermittedFacility(consultationData.facility as any)),
        dispatch(
          listAssetBeds({
            facility: consultationData.facility as any,
            bed: consultationData.current_bed?.bed_object.id,
          })
        ),
      ]);

      const { middleware_address } = facilityRes.data as FacilityModel;
      const assetBeds = assetBedRes.data.results as AssetBedModel[];

      const monitorBedData = assetBeds.find(
        (i) => i.asset_object.asset_class === AssetClass.HL7MONITOR
      );
      setMonitorBedData(monitorBedData);
      const assetDataForMonitor = monitorBedData?.asset_object;
      const hl7Meta = assetDataForMonitor?.meta;
      const hl7Middleware = hl7Meta?.middleware_hostname || middleware_address;
      if (hl7Middleware && hl7Meta?.local_ip_address) {
        setHL7SocketUrl(
          `wss://${hl7Middleware}/observations/${hl7Meta.local_ip_address}`
        );
      }

      const consultationBedVentilator = consultationData?.current_bed?.assets_objects?.find(
        (i) => i.asset_class === AssetClass.VENTILATOR
      )
      let ventilatorBedData;
      if (consultationBedVentilator) {
        ventilatorBedData = {
          asset_object: consultationBedVentilator,
          bed_object: consultationData?.current_bed?.bed_object,
        } as AssetBedModel;
      } else {
        ventilatorBedData = assetBeds.find(
          (i) => i.asset_object.asset_class === AssetClass.VENTILATOR
        );
      }
      setVentilatorBedData(ventilatorBedData);
      const ventilatorMeta = ventilatorBedData?.asset_object?.meta;
      const ventilatorMiddleware =
        ventilatorMeta?.middleware_hostname || middleware_address;
      if (ventilatorMiddleware && ventilatorMeta?.local_ip_address) {
        setVentilatorSocketUrl(
          `wss://${ventilatorMiddleware}/observations/${ventilatorMeta?.local_ip_address}`
        );
      }

      if (
        !(hl7Middleware && hl7Meta?.local_ip_address) &&
        !(ventilatorMiddleware && ventilatorMeta?.local_ip_address)
      ) {
        setHL7SocketUrl(undefined);
        setVentilatorSocketUrl(undefined);
      }
    };

    fetchData();
  }, [consultationData]);

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
    triggerGoal("Patient Consultation Viewed", {
      facilityId: facilityId,
      consultationId: consultationId,
      userID: authUser.id,
    });
  }, []);

  const vitals = useVitalsAspectRatioConfig({
    default: undefined,
    md: 8 / 11,
    lg: 15 / 11,
    xl: 13 / 11,
    "2xl": 19 / 11,
    "3xl": 23 / 11,
  });

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
      <div className="w-full text-sm">
        <p className="font-semibold leading-relaxed">{label}</p>

        {diagnoses.slice(0, !showMore ? nshow : undefined).map((diagnosis) => (
          <p>{diagnosis.label}</p>
        ))}
        {diagnoses.length > nshow && (
          <>
            {!showMore ? (
              <a
                onClick={() => setShowMore(true)}
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-300"
              >
                show more
              </a>
            ) : (
              <a
                onClick={() => setShowMore(false)}
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-300"
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
        <nav className="relative flex flex-wrap justify-between">
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
                        consultationData.admission_date!
                      )}`
                    : consultationData.suggestion_text,
              },
            }}
            breadcrumbs={true}
            backUrl="/patients"
          />
          <div className="-right-6 top-0 flex w-full flex-col space-y-1 sm:w-min sm:flex-row sm:items-center sm:space-y-0 sm:divide-x-2 lg:absolute xl:right-0">
            {!consultationData.discharge_date && (
              <div className="flex w-full flex-col px-2 sm:flex-row">
                <ButtonV2
                  onClick={() =>
                    navigate(
                      `/facility/${patientData.facility}/patient/${patientData.id}/shift/new`
                    )
                  }
                  className="btn btn-primary m-1 w-full hover:text-white"
                >
                  <CareIcon className="care-l-ambulance h-5 w-5" />
                  Shift Patient
                </ButtonV2>
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
                {patientData.last_consultation?.id && (
                  <Link
                    href={`/facility/${patientData.facility}/patient/${patientData.id}/consultation/${patientData.last_consultation?.id}/feed`}
                    className="btn btn-primary m-1 w-full hover:text-white"
                  >
                    Camera Feed
                  </Link>
                )}
              </div>
            )}
            <div className="flex w-full flex-col px-2 sm:flex-row">
              <Link
                href={`/facility/${patientData.facility}/patient/${patientData.id}`}
                className="btn btn-primary m-1 w-full hover:text-white"
              >
                Patient Details
              </Link>
              <Link
                href={`/facility/${patientData.facility}/patient/${patientData.id}/notes`}
                className="btn btn-primary m-1 w-full hover:text-white"
              >
                Doctor&apos;s Notes
              </Link>
            </div>
          </div>
        </nav>
        <div className="mt-2 flex w-full flex-col md:flex-row">
          <div className="h-full w-full rounded-lg border bg-white text-black shadow">
            <PatientInfoCard
              patient={patientData}
              consultation={consultationData}
              fetchPatientData={fetchData}
              consultationId={consultationId}
              showAbhaProfile={qParams["show-abha-profile"] === "true"}
            />

            <div className="flex flex-col justify-between border-t px-4 pt-5 md:flex-row">
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
                  {(consultationData.admission_date ??
                    consultationData.discharge_date) && (
                    <div className="text-3xl font-bold">
                      {relativeTime(
                        consultationData.discharge_date
                          ? consultationData.discharge_date
                          : consultationData.admission_date
                      )}
                    </div>
                  )}
                  <div className="-mt-2 text-xs">
                    {consultationData.admission_date &&
                      formatDateTime(consultationData.admission_date)}
                    {consultationData.discharge_date &&
                      ` - ${formatDateTime(consultationData.discharge_date)}`}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 px-4 lg:flex-row">
              <div className="flex h-full w-3/4 flex-col">
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
                  <div className="mt-2 text-sm">
                    <span className="font-semibold leading-relaxed">
                      Verified By:{" "}
                    </span>
                    {consultationData.verified_by}
                    <i className="fas fa-check ml-2 fill-current text-lg text-green-500"></i>
                  </div>
                )}
              </div>
              <div className="flex h-full w-full flex-col justify-end gap-2 text-right lg:flex-row">
                <ButtonV2 onClick={() => setOpenDischargeSummaryDialog(true)}>
                  <i className="fas fa-clipboard-list"></i>
                  <span>{t("discharge_summary")}</span>
                </ButtonV2>

                <ButtonV2
                  onClick={() => setOpenDischargeDialog(true)}
                  disabled={!!consultationData.discharge_date}
                >
                  <i className="fas fa-hospital-user"></i>
                  <span>{t("discharge_from_care")}</span>
                </ButtonV2>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-2 p-4 md:flex-row">
              <div className="font-base flex flex-col text-xs leading-relaxed text-gray-700">
                <div>
                  <span className="text-gray-900">Created: </span>
                  {consultationData.created_date
                    ? formatDateTime(consultationData.created_date)
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
              <div className="font-base flex flex-col text-xs leading-relaxed text-gray-700 md:text-right">
                <div>
                  <span className="text-gray-900">Last Modified: </span>
                  {consultationData.modified_date
                    ? formatDateTime(consultationData.modified_date)
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

        <div className="mt-4 w-full border-b-2 border-gray-200">
          <div className="overflow-x-auto sm:flex sm:items-baseline">
            <div className="mt-4 sm:mt-0">
              <nav className="flex space-x-6 overflow-x-auto pb-2 pl-2 ">
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
        {tab === "UPDATES" && (
          <div className="flex flex-col gap-2">
            {!consultationData.discharge_date &&
              hl7SocketUrl &&
              ventilatorSocketUrl && (
                <section className="flex w-full flex-col items-stretch overflow-auto rounded-md bg-white shadow-sm lg:flex-row">
                  <div className="mx-auto flex w-full flex-col justify-between gap-1 rounded bg-[#020617] lg:w-auto lg:min-w-[1280px] lg:flex-row">
                    <div className="min-h-[400px] flex-1">
                      <HL7PatientVitalsMonitor
                        patientAssetBed={{
                          asset: monitorBedData?.asset_object as AssetData,
                          bed: monitorBedData?.bed_object as BedModel,
                          patient: patientData,
                          meta: monitorBedData?.asset_object?.meta,
                        }}
                        socketUrl={hl7SocketUrl}
                      />
                    </div>
                    <div className="min-h-[400px] flex-1">
                      <VentilatorPatientVitalsMonitor
                        patientAssetBed={{
                          asset: ventilatorBedData?.asset_object as AssetData,
                          bed: ventilatorBedData?.bed_object as BedModel,
                          patient: patientData,
                          meta: ventilatorBedData?.asset_object?.meta,
                        }}
                        socketUrl={ventilatorSocketUrl}
                      />
                    </div>
                  </div>
                </section>
              )}
            <div className="flex flex-col xl:flex-row">
              <div className="w-full xl:w-2/3">
                <PageTitle title="Info" hideBack={true} breadcrumbs={false} />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {!consultationData.discharge_date &&
                    ((hl7SocketUrl && !ventilatorSocketUrl) ||
                      (!hl7SocketUrl && ventilatorSocketUrl)) && (
                      <section className="flex w-full flex-col items-stretch overflow-hidden rounded-md bg-white shadow-sm lg:col-span-2 lg:flex-row">
                        {(hl7SocketUrl || ventilatorSocketUrl) && (
                          <div className="mx-auto flex w-full flex-col justify-between gap-1 rounded bg-[#020617] lg:w-auto lg:min-w-[640px] lg:flex-row">
                            {hl7SocketUrl && (
                              <div className="min-h-[400px] flex-1">
                                <HL7PatientVitalsMonitor
                                  key={`hl7-${hl7SocketUrl}-${vitals.hash}`}
                                  patientAssetBed={{
                                    asset:
                                      monitorBedData?.asset_object as AssetData,
                                    bed: monitorBedData?.bed_object as BedModel,
                                    patient: patientData,
                                    meta: monitorBedData?.asset_object?.meta,
                                  }}
                                  socketUrl={hl7SocketUrl}
                                  config={vitals.config}
                                />
                              </div>
                            )}
                            {ventilatorSocketUrl && (
                              <div className="min-h-[400px] flex-1">
                                <VentilatorPatientVitalsMonitor
                                  key={`ventilator-${ventilatorSocketUrl}-${vitals.hash}`}
                                  patientAssetBed={{
                                    asset:
                                      ventilatorBedData?.asset_object as AssetData,
                                    bed: ventilatorBedData?.bed_object as BedModel,
                                    patient: patientData,
                                    meta: ventilatorBedData?.asset_object?.meta,
                                  }}
                                  socketUrl={ventilatorSocketUrl}
                                  config={vitals.config}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    )}
                  {consultationData.discharge_date && (
                    <div
                      className={`gap-4 overflow-hidden rounded-lg bg-white shadow ${
                        consultationData.discharge_reason === "REC" &&
                        "lg:col-span-2"
                      }`}
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                          Discharge Information
                        </h3>
                        <div className="mt-2 grid gap-4">
                          <div>
                            Reason {" - "}
                            <span className="font-semibold">
                              {DISCHARGE_REASONS.find(
                                (d) =>
                                  d.id === consultationData.discharge_reason
                              )?.text ?? "--"}
                            </span>
                          </div>
                          {consultationData.discharge_reason === "REF" && (
                            <div>
                              Referred Facility {" - "}
                              <span className="font-semibold">
                                {consultationData.referred_to_external ||
                                  consultationData.referred_to_object?.name ||
                                  "--"}
                              </span>
                            </div>
                          )}
                          {consultationData.discharge_reason === "REC" && (
                            <div className="grid gap-4">
                              <div>
                                Discharge Date {" - "}
                                <span className="font-semibold">
                                  {consultationData.discharge_date
                                    ? formatDate(
                                        consultationData.discharge_date
                                      )
                                    : "--/--/----"}
                                </span>
                              </div>
                              <div>
                                Advice {" - "}
                                <span className="font-semibold">
                                  {consultationData.discharge_notes ?? "--"}
                                </span>
                              </div>
                              <div className="overflow-x-auto overflow-y-hidden">
                                <PrescriptionsTable
                                  consultation_id={consultationData.id ?? ""}
                                  is_prn={false}
                                  readonly
                                  prescription_type="DISCHARGE"
                                />
                              </div>
                              <hr className="my-2 border border-gray-300"></hr>
                              <div className="overflow-x-auto overflow-y-hidden">
                                <PrescriptionsTable
                                  consultation_id={consultationData.id ?? ""}
                                  is_prn
                                  readonly
                                  prescription_type="DISCHARGE"
                                />
                              </div>
                            </div>
                          )}
                          {consultationData.discharge_reason === "EXP" && (
                            <div className="grid gap-4">
                              <div>
                                Date of Death {" - "}
                                <span className="font-semibold">
                                  {consultationData.death_datetime
                                    ? formatDateTime(
                                        consultationData.death_datetime
                                      )
                                    : "--:--"}
                                </span>
                              </div>
                              <div>
                                Cause of death {" - "}
                                <span className="font-semibold">
                                  {consultationData.discharge_notes ?? "--"}
                                </span>
                              </div>
                              <div>
                                Confirmed By {" - "}
                                <span className="font-semibold">
                                  {consultationData.death_confirmed_doctor ??
                                    "--"}
                                </span>
                              </div>
                            </div>
                          )}
                          {["REF", "LAMA"].includes(
                            consultationData.discharge_reason ?? ""
                          ) && (
                            <div className="grid gap-4">
                              <div>
                                Discharge Date {" - "}
                                <span className="font-semibold">
                                  {consultationData.discharge_date
                                    ? formatDate(
                                        consultationData.discharge_date
                                      )
                                    : "--/--/----"}
                                </span>
                              </div>
                              <div>
                                Notes {" - "}
                                <span className="font-semibold">
                                  {consultationData.discharge_notes ?? "--"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {consultationData.symptoms_text && (
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="mb-4 text-lg font-semibold leading-relaxed text-gray-900">
                          Symptoms
                        </h3>
                        <div className="">
                          <div className="text-sm font-semibold uppercase">
                            Last Daily Update
                          </div>
                          {consultationData.last_daily_round
                            ?.additional_symptoms && (
                            <>
                              <div className="my-4 flex flex-wrap items-center gap-2">
                                {consultationData.last_daily_round?.additional_symptoms.map(
                                  (symptom: any, index: number) => (
                                    <Chip
                                      key={index}
                                      text={
                                        SYMPTOM_CHOICES.find(
                                          (choice) => choice.id === symptom
                                        )?.text ?? "Err. Unknown"
                                      }
                                      size="small"
                                    />
                                  )
                                )}
                              </div>
                              {consultationData.last_daily_round
                                ?.other_symptoms && (
                                <div className="capitalize">
                                  <div className="text-xs font-semibold">
                                    Other Symptoms:
                                  </div>
                                  {
                                    consultationData.last_daily_round
                                      ?.other_symptoms
                                  }
                                </div>
                              )}
                              <span className="text-xs font-semibold leading-relaxed text-gray-800">
                                from{" "}
                                {formatDate(
                                  consultationData.last_daily_round.created_at
                                )}
                              </span>
                            </>
                          )}
                          <hr className="my-4 border border-gray-300" />
                          <div className="text-sm font-semibold uppercase">
                            Consultation Update
                          </div>
                          <div className="my-4 flex flex-wrap items-center gap-2">
                            {consultationData.symptoms?.map(
                              (symptom, index) => (
                                <Chip
                                  key={index}
                                  text={
                                    SYMPTOM_CHOICES.find(
                                      (choice) => choice.id === symptom
                                    )?.text ?? "Err. Unknown"
                                  }
                                  size="small"
                                />
                              )
                            )}
                          </div>
                          {consultationData.other_symptoms && (
                            <div className="capitalize">
                              <div className="text-xs font-semibold">
                                Other Symptoms:
                              </div>
                              {consultationData.other_symptoms}
                            </div>
                          )}
                          <span className="text-xs font-semibold leading-relaxed text-gray-800">
                            from{" "}
                            {consultationData.symptoms_onset_date
                              ? formatDate(consultationData.symptoms_onset_date)
                              : "--/--/----"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {consultationData.history_of_present_illness && (
                    <div className="overflow-hidden rounded-lg bg-white shadow">
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
                    <div className="overflow-hidden rounded-lg bg-white shadow">
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
                    <div className="overflow-hidden rounded-lg bg-white shadow">
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
                    <div className="overflow-hidden rounded-lg bg-white shadow">
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

                  {(consultationData.operation ??
                    consultationData.special_instruction) && (
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                          Notes
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                {consultationData.procedure &&
                  consultationData.procedure.length > 0 && (
                    <div className="my-4 rounded-lg bg-white p-4 shadow">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-600">
                                Procedure
                              </th>
                              <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-600">
                                Notes
                              </th>
                              <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-600">
                                Repetitive
                              </th>
                              <th className="bg-gray-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-600">
                                Time / Frequency
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {consultationData.procedure?.map(
                              (procedure, index) => (
                                <tr key={index}>
                                  <td className="overflow-hidden whitespace-nowrap p-4">
                                    {procedure.procedure}
                                  </td>
                                  <td className="overflow-hidden whitespace-normal p-4">
                                    {procedure.notes}
                                  </td>
                                  <td className="overflow-hidden whitespace-normal p-4">
                                    {procedure.repetitive ? "Yes" : "No"}
                                  </td>
                                  <td className="whitespace-nowrap p-4">
                                    {procedure.repetitive
                                      ? procedure.frequency
                                      : formatDateTime(String(procedure.time))}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                {consultationData.intubation_start_date && (
                  <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        Date/Size/LL:{" "}
                      </h3>
                      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="">
                          Intubation Date{" - "}
                          <span className="font-semibold">
                            {formatDateTime(
                              consultationData.intubation_start_date
                            )}
                          </span>
                        </div>
                        <div className="">
                          Extubation Date{" - "}
                          <span className="font-semibold">
                            {consultationData.intubation_end_date &&
                              formatDateTime(
                                consultationData.intubation_end_date
                              )}
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
                  <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                        Lines and Catheters
                      </h3>
                      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {consultationData.lines?.map(
                          (line: any, idx: number) => (
                            <div key={idx} className="mt-4">
                              <h5>{line.type}</h5>
                              <p className="break-word text-justify">
                                Details:
                                <br />
                                <span>{line.other_type}</span>
                              </p>
                              <p>
                                Insertion Date:{" "}
                                <span className="font-semibold">
                                  {formatDateTime(line.start_date)}
                                </span>
                              </p>
                              <p>
                                Site/Level of Fixation: <br />
                                <span className="break-word text-justify">
                                  {line.site}
                                </span>
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Body Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        Gender {" - "}
                        <span className="font-semibold">
                          {patientData.gender ?? "-"}
                        </span>
                      </div>
                      <div>
                        Age {" - "}
                        <span className="font-semibold">
                          {patientData.age ?? "-"}
                        </span>
                      </div>
                      <div>
                        Weight {" - "}
                        <span className="font-semibold">
                          {consultationData.weight ?? "-"} Kg
                        </span>
                      </div>
                      <div>
                        Height {" - "}
                        <span className="font-semibold">
                          {consultationData.height ?? "-"} cm
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
                          {patientData.blood_group ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full pl-4 xl:w-1/3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <PageTitle title="Update Log" hideBack breadcrumbs={false} />
                  <div className="mb-[2rem] pl-[1.5rem] md:mb-[0.125rem]">
                    <input
                      className="relative float-left ml-[-1.5rem] mr-[6px] mt-[0.15rem] h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-[rgba(0,0,0,0.25)] bg-white outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:bg-white focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent"
                      type="checkbox"
                      id="automated-rounds-visible-checkbox"
                      checked={showAutomatedRounds}
                      onChange={() => setShowAutomatedRounds((s) => !s)}
                    />
                    <label
                      className="inline-block pl-[0.15rem] hover:cursor-pointer"
                      htmlFor="automated-rounds-visible-checkbox"
                    >
                      Show Automated Rounds
                    </label>
                  </div>
                </div>
                <DailyRoundsList
                  facilityId={facilityId}
                  patientId={patientId}
                  consultationId={consultationId}
                  consultationData={consultationData}
                  showAutomatedRounds={showAutomatedRounds}
                />
              </div>
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
            <Feed facilityId={facilityId} consultationId={consultationId} />
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
            <div className="mt-4">
              <PrescriptionsTable
                key={medicinesKey}
                consultation_id={consultationId}
                onChange={() => setMedicinesKey((k) => k + 1)}
                readonly={!!consultationData.discharge_date}
              />
            </div>
            <div className="mt-8">
              <PrescriptionsTable
                key={medicinesKey}
                consultation_id={consultationId}
                is_prn
                onChange={() => setMedicinesKey((k) => k + 1)}
                readonly={!!consultationData.discharge_date}
              />
            </div>
            <div className="mt-8">
              <MedicineAdministrationsTable
                key={medicinesKey}
                consultation_id={consultationId}
              />
            </div>
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
              title="Respiratory Support"
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
            <div className="justify-between sm:flex">
              <PageTitle
                title="Investigations"
                hideBack={true}
                breadcrumbs={false}
              />
              <div className="pt-6">
                <ButtonV2
                  authorizeFor={NonReadOnlyUsers}
                  disabled={!patientData.is_active}
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/`
                    )
                  }
                >
                  <CareIcon className="care-l-plus" />
                  <span>{t("log_lab_results")}</span>
                </ButtonV2>
              </div>
            </div>
            <InvestigationTab
              consultationId={consultationId}
              facilityId={facilityId}
              patientId={patientId}
              patientData={patientData}
            />
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
