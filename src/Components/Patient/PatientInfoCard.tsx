import * as Notification from "../../Utils/Notifications.js";

import {
  CONSULTATION_SUGGESTION,
  DISCHARGE_REASONS,
  PATIENT_CATEGORIES,
  RESPIRATORY_SUPPORT,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants.js";
import { ConsultationModel, PatientCategory } from "../Facility/models.js";
import { Switch, Menu } from "@headlessui/react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon.js";
import useConfig from "../../Common/hooks/useConfig.js";
import dayjs from "../../Utils/dayjs.js";
import { classNames, formatDate, formatDateTime } from "../../Utils/utils.js";
import ABHAProfileModal from "../ABDM/ABHAProfileModal.js";
import LinkABHANumberModal from "../ABDM/LinkABHANumberModal.js";
import LinkCareContextModal from "../ABDM/LinkCareContextModal.js";
import DialogModal from "../Common/Dialog.js";
import ButtonV2 from "../Common/components/ButtonV2.js";
import Beds from "../Facility/Consultations/Beds.js";
import { PatientModel } from "./models.js";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api.js";
import DropdownMenu from "../Common/components/Menu.js";
import { triggerGoal } from "../../Integrations/Plausible.js";

import useAuthUser from "../../Common/hooks/useAuthUser.js";
import { Mews } from "../Facility/Consultations/Mews.js";
import DischargeSummaryModal from "../Facility/DischargeSummaryModal.js";
import DischargeModal from "../Facility/DischargeModal.js";
import { useTranslation } from "react-i18next";
import FetchRecordsModal from "../ABDM/FetchRecordsModal.js";

export default function PatientInfoCard(props: {
  patient: PatientModel;
  consultation?: ConsultationModel;
  fetchPatientData?: (state: { aborted: boolean }) => void;
  activeShiftingData: any;
  consultationId: string;
  showAbhaProfile?: boolean;
}) {
  const authUser = useAuthUser();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showLinkABHANumber, setShowLinkABHANumber] = useState(false);
  const [showABHAProfile, setShowABHAProfile] = useState(
    !!props.showAbhaProfile
  );
  const [showFetchABDMRecords, setShowFetchABDMRecords] = useState(false);
  const [openDischargeSummaryDialog, setOpenDischargeSummaryDialog] =
    useState(false);
  const [openDischargeDialog, setOpenDischargeDialog] = useState(false);

  const { enable_hcx, enable_abdm } = useConfig();
  const [showLinkCareContext, setShowLinkCareContext] = useState(false);

  const patient = props.patient;
  const consultation = props.consultation;
  const activeShiftingData = props.activeShiftingData;

  const [medicoLegalCase, setMedicoLegalCase] = useState(
    consultation?.medico_legal_case ?? false
  );

  const category: PatientCategory | undefined =
    consultation?.last_daily_round?.patient_category ?? consultation?.category;
  const categoryClass = category
    ? PATIENT_CATEGORIES.find((c) => c.text === category)?.twClass
    : "patient-unknown";

  const bedDialogTitle = consultation?.discharge_date
    ? "Bed History"
    : !consultation?.current_bed
    ? "Assign Bed"
    : "Switch Bed";

  const switchMedicoLegalCase = async (value: boolean) => {
    if (!consultation?.id || value === medicoLegalCase) return;
    const { res, data } = await request(routes.partialUpdateConsultation, {
      pathParams: { id: consultation?.id },
      body: { medico_legal_case: value },
    });

    if (res?.status !== 200 || !data) {
      Notification.Error({
        msg: "Failed to update Medico Legal Case",
      });
      setMedicoLegalCase(!value);
    } else {
      Notification.Success({
        msg: "Medico Legal Case updated successfully",
      });
    }
  };

  const hasActiveShiftingRequest = () => {
    if (activeShiftingData.length > 0) {
      return [
        "PENDING",
        "APPROVED",
        "DESTINATION APPROVED",
        "PATIENT TO BE PICKED UP",
      ].includes(activeShiftingData[activeShiftingData.length - 1].status);
    }

    return false;
  };

  return (
    <>
      <DialogModal
        title={bedDialogTitle}
        show={open}
        onClose={() => setOpen(false)}
        className="md:max-w-3xl"
      >
        {patient?.facility && patient?.id && consultation?.id ? (
          <Beds
            facilityId={patient?.facility}
            patientId={patient?.id}
            discharged={!!consultation?.discharge_date}
            consultationId={consultation?.id ?? ""}
            setState={setOpen}
            fetchPatientData={props.fetchPatientData}
            smallLoader
            hideTitle
          />
        ) : (
          <div>Invalid Patient Data</div>
        )}
      </DialogModal>

      {consultation && (
        <>
          <DischargeSummaryModal
            consultation={consultation}
            show={openDischargeSummaryDialog}
            onClose={() => setOpenDischargeSummaryDialog(false)}
          />
          <DischargeModal
            show={openDischargeDialog}
            onClose={() => {
              setOpenDischargeDialog(false);
            }}
            afterSubmit={() => {
              setOpenDischargeDialog(false);
              props.fetchPatientData?.({ aborted: false });
            }}
            consultationData={consultation}
          />
        </>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div
          className="col-span-2 flex w-full flex-col bg-white px-4 pt-2 lg:flex-row xl:min-w-fit"
          id="patient-infobadges"
        >
          {/* Can support for patient picture in the future */}
          <div className="flex justify-evenly lg:justify-normal">
            <div className="flex flex-col items-start lg:items-center">
              <div
                className={`w-24 min-w-[5rem] bg-gray-200 ${categoryClass}-profile h-full`}
              >
                {consultation?.current_bed &&
                consultation?.discharge_date === null ? (
                  <div className="tooltip flex h-full flex-col items-center justify-center">
                    <p className="w-full truncate px-2 text-center text-sm text-gray-900">
                      {
                        consultation?.current_bed?.bed_object?.location_object
                          ?.name
                      }
                    </p>
                    <p className="w-full truncate px-2 text-center text-base font-bold">
                      {consultation?.current_bed?.bed_object.name}
                    </p>
                    <div className="tooltip-text tooltip-right flex -translate-x-1/3 translate-y-1/2 flex-col items-center justify-center text-sm ">
                      <span>
                        {
                          consultation?.current_bed?.bed_object?.location_object
                            ?.name
                        }
                      </span>
                      <span>{consultation?.current_bed?.bed_object.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <CareIcon
                      icon="l-user-injured"
                      className="text-3xl text-gray-500"
                    />
                  </div>
                )}
              </div>
              {category && (
                <div
                  className={`w-24 rounded-b py-1 text-center text-xs font-bold ${categoryClass}`}
                >
                  {category.toUpperCase()}
                </div>
              )}
              <ButtonV2
                ghost
                onClick={() => setOpen(true)}
                className="mt-1 px-[10px] py-1"
              >
                {bedDialogTitle}
              </ButtonV2>
            </div>
            <div className="flex items-center justify-center">
              <div
                className="mb-2 flex flex-col justify-center text-xl font-semibold lg:hidden"
                id="patient-name-consultation"
              >
                {patient.name}
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-gray-600">
                  {patient.age} years • {patient.gender}
                </div>
                <div className="mr-3 flex flex-col items-center">
                  <Link
                    href={`/facility/${consultation?.facility}`}
                    className="mt-2 items-center justify-center text-sm font-semibold text-black hover:text-primary-600 lg:hidden"
                  >
                    <CareIcon
                      icon="l-hospital"
                      className="mr-1 text-lg text-primary-400"
                      aria-hidden="true"
                    />
                    {consultation?.facility_name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-4 space-y-2 lg:items-start lg:gap-0 lg:pl-2 xl:w-full">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <Link
                href={`/facility/${consultation?.facility}`}
                className="hidden font-semibold text-black hover:text-primary-600 lg:block"
              >
                <CareIcon
                  icon="l-hospital"
                  className="mr-1 text-xl text-primary-400"
                  aria-hidden="true"
                />
                {consultation?.facility_name}
              </Link>

              {medicoLegalCase && (
                <span className="flex pl-2 capitalize md:col-span-2">
                  <span className="badge badge-pill badge-danger">MLC</span>
                </span>
              )}
            </div>
            <div className="flex flex-col flex-wrap items-center justify-center lg:items-start lg:justify-normal">
              <div
                className="mb-2 hidden flex-row text-xl font-semibold lg:flex"
                id="patient-name-consultation"
              >
                {patient.name}
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-gray-600">
                  {patient.age} years • {patient.gender}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm sm:flex-row">
                <div
                  className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-900 sm:flex-row sm:text-sm lg:justify-normal"
                  id="patient-consultationbadges"
                >
                  {consultation?.patient_no && (
                    <span className="flex capitalize">
                      <span className="items-stretch justify-center whitespace-nowrap rounded border border-green-400 bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
                        {`${consultation?.suggestion === "A" ? "IP" : "OP"}: ${
                          consultation?.patient_no
                        }`}
                      </span>
                    </span>
                  )}
                  {patient.action && patient.action != 10 && (
                    <div>
                      <div className="inline-flex w-full items-center justify-start rounded border border-gray-500 bg-blue-100 p-1 px-3 text-xs font-semibold leading-4">
                        <span className="font-semibold text-indigo-800">
                          {" "}
                          {
                            TELEMEDICINE_ACTIONS.find(
                              (i) => i.id === patient.action
                            )?.desc
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    {patient.blood_group && (
                      <div className="inline-flex w-full items-center justify-start rounded border border-gray-500 bg-gray-100 p-1 px-2 text-xs font-semibold leading-4">
                        Blood Group: {patient.blood_group}
                      </div>
                    )}
                  </div>
                  {patient.review_time &&
                    !consultation?.discharge_date &&
                    Number(consultation?.review_interval) > 0 && (
                      <div>
                        <div
                          className={
                            "inline-flex w-full items-center justify-center rounded border border-gray-500 p-1 text-xs font-semibold leading-4 " +
                            (dayjs().isBefore(patient.review_time)
                              ? " bg-gray-100 "
                              : " bg-red-400 text-white")
                          }
                        >
                          <CareIcon icon="l-clock" className="text-md mr-2" />
                          {dayjs().isBefore(patient.review_time)
                            ? "Review before: "
                            : "Review Missed: "}
                          {formatDateTime(patient.review_time)}
                        </div>
                      </div>
                    )}
                  {consultation?.suggestion === "DC" && (
                    <div>
                      <div>
                        <div className="inline-flex w-full items-center justify-start rounded border border-gray-500 bg-gray-100 p-1 px-3 text-xs font-semibold leading-4">
                          <CareIcon className="care-l-estate mr-1 text-base text-gray-700" />
                          <span>Domiciliary Care</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {!!consultation?.discharge_date && (
                    <p className="rounded border border-red-600 bg-red-100 px-2 py-[2px] text-sm text-red-600">
                      Discharged from CARE
                    </p>
                  )}
                  {[
                    [
                      "Respiratory Support",
                      RESPIRATORY_SUPPORT.find(
                        (resp) =>
                          resp.text ===
                          consultation?.last_daily_round?.ventilator_interface
                      )?.id ?? "UNKNOWN",
                      consultation?.last_daily_round?.ventilator_interface,
                    ],
                  ].map((stat, i) => {
                    return stat[2] && stat[1] !== "NONE" ? (
                      <div className="flex flex-col items-center gap-2 text-sm">
                        <div
                          key={"patient_stat_" + i}
                          className="flex items-center justify-center rounded border border-gray-500 bg-gray-100 p-1 px-3 text-xs font-semibold leading-4"
                        >
                          {stat[0]} : {stat[1]}
                        </div>
                      </div>
                    ) : (
                      ""
                    );
                  })}
                  {consultation?.discharge_date ? (
                    <div className="flex gap-4 rounded border border-cyan-400 bg-cyan-100 px-2 py-1 text-xs font-medium">
                      <div>
                        <span>
                          <b>
                            {
                              CONSULTATION_SUGGESTION.find(
                                (suggestion) =>
                                  suggestion.id === consultation?.suggestion
                              )?.text
                            }
                          </b>{" "}
                          on {formatDateTime(consultation.encounter_date)},
                          {consultation?.new_discharge_reason === "EXP" ? (
                            <span>
                              {" "}
                              <b>Expired on</b>{" "}
                              {formatDate(consultation?.death_datetime)}
                            </span>
                          ) : (
                            <span>
                              {" "}
                              <b>Discharged on</b>{" "}
                              {formatDateTime(consultation?.discharge_date)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded border border-gray-500 bg-gray-100 p-1 px-3 text-xs font-semibold leading-4">
                      <span className="flex">
                        {consultation?.encounter_date && (
                          <div>
                            Admission on:{" "}
                            {formatDateTime(consultation?.encounter_date)}
                          </div>
                        )}
                        {consultation?.icu_admission_date && (
                          <div>
                            , ICU Admission on:{" "}
                            {formatDateTime(consultation?.icu_admission_date)}
                          </div>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:items-start lg:justify-normal">
              <div className="flex w-full flex-col">
                {consultation?.diagnoses?.length
                  ? (() => {
                      const principal_diagnosis = consultation.diagnoses.find(
                        (diagnosis) => diagnosis.is_principal
                      );
                      return principal_diagnosis ? (
                        <div
                          className="mt-1 flex flex-col sm:flex-row"
                          id="principal-diagnosis"
                        >
                          <div className="mr-1 text-sm font-semibold">
                            Principal Diagnosis:
                          </div>
                          <div className="flex gap-2 text-sm">
                            {principal_diagnosis.diagnosis_object?.label ?? "-"}{" "}
                            <span className="flex items-center rounded border border-primary-500 pl-1 pr-2 text-xs font-medium text-primary-500">
                              <CareIcon icon="l-check" className="text-base" />
                              <p className="capitalize">
                                {principal_diagnosis.verification_status}
                              </p>
                            </span>
                          </div>
                        </div>
                      ) : null;
                    })()
                  : null}
                {(consultation?.treating_physician_object ||
                  consultation?.deprecated_verified_by) && (
                  <div className="text-sm" id="treating-physician">
                    <span className="font-semibold leading-relaxed">
                      Treating Physician:{" "}
                    </span>
                    {consultation?.treating_physician_object
                      ? `${consultation?.treating_physician_object.first_name} ${consultation?.treating_physician_object.last_name}`
                      : consultation?.deprecated_verified_by}
                    <CareIcon
                      icon="l-check"
                      className="ml-2 fill-current text-xl text-green-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className="col-span-2 flex w-full flex-col items-center justify-center gap-2 px-4 py-1 lg:col-span-1 2xl:flex-row"
          id="consultation-buttons"
        >
          {consultation?.last_daily_round && (
            <div className="col-span-1 flex w-full justify-center bg-white px-4 lg:flex-row">
              <Mews dailyRound={consultation?.last_daily_round} />
            </div>
          )}
          {!!consultation?.discharge_date && (
            <div className="flex min-w-max flex-col items-center justify-center">
              <div className="text-sm font-normal leading-5 text-gray-500">
                Discharge Reason
              </div>
              <div className="mt-[6px] text-xl font-semibold leading-5 text-gray-900">
                {!consultation?.new_discharge_reason ? (
                  <span className="text-gray-800">
                    {consultation.suggestion === "OP"
                      ? "OP file closed"
                      : "UNKNOWN"}
                  </span>
                ) : consultation?.new_discharge_reason ===
                  DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id ? (
                  <span className="text-red-600">EXPIRED</span>
                ) : (
                  DISCHARGE_REASONS.find(
                    (reason) => reason.id === consultation?.new_discharge_reason
                  )?.text
                )}
              </div>
            </div>
          )}
          <div className="flex w-full flex-col gap-3 lg:w-auto 2xl:flex-row">
            {patient.is_active &&
              consultation?.id &&
              !consultation?.discharge_date && (
                <div className="h-10 min-h-[40px] w-full min-w-[170px] lg:w-auto">
                  <ButtonV2
                    variant={
                      !(consultation?.facility !== patient.facility) &&
                      !(consultation?.discharge_date ?? !patient.is_active) &&
                      dayjs(consultation?.modified_date).isBefore(
                        dayjs().subtract(1, "day")
                      )
                        ? "danger"
                        : "primary"
                    }
                    href={
                      consultation?.admitted && !consultation?.current_bed
                        ? undefined
                        : `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/daily-rounds`
                    }
                    onClick={() => {
                      if (
                        consultation?.admitted &&
                        !consultation?.current_bed
                      ) {
                        Notification.Error({
                          msg: "Please assign a bed to the patient",
                        });
                        setOpen(true);
                      }
                    }}
                    className="w-full"
                  >
                    <span className="flex w-full items-center justify-center gap-2">
                      <CareIcon className="care-l-plus text-xl" />
                      <p className="font-semibold">Log Update</p>
                    </span>
                  </ButtonV2>
                  {!(consultation?.facility !== patient.facility) &&
                    !(consultation?.discharge_date ?? !patient.is_active) &&
                    dayjs(consultation?.modified_date).isBefore(
                      dayjs().subtract(1, "day")
                    ) && (
                      <>
                        <p className="mt-0.5 text-xs text-red-500">
                          <div className="text-center">
                            <CareIcon className="care-l-exclamation-triangle" />{" "}
                            No update filed in the last 24 hours
                          </div>
                        </p>
                      </>
                    )}
                </div>
              )}
            <DropdownMenu
              id="show-more"
              itemClassName="min-w-0 sm:min-w-[225px]"
              title={"Manage Patient"}
              icon={<CareIcon icon="l-setting" className="text-xl" />}
              className="xl:justify-center"
              containerClassName="w-full lg:w-auto mt-2 2xl:mt-0 flex justify-center z-20"
            >
              <div>
                {[
                  [
                    `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/update`,
                    "Edit Consultation Details",
                    "pen",
                    patient.is_active &&
                      consultation?.id &&
                      !consultation?.discharge_date,
                  ],
                  [
                    `/patient/${patient.id}/investigation_reports`,
                    "Investigation Summary",
                    "align-alt",
                    true,
                  ],
                  [
                    `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/treatment-summary`,
                    "Treatment Summary",
                    "file-medical",
                    consultation?.id,
                  ],
                ]
                  .concat(
                    enable_hcx
                      ? [
                          [
                            `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/claims`,
                            "Claims",
                            "copy-landscape",
                            consultation?.id,
                          ],
                        ]
                      : []
                  )
                  .map(
                    (action: any, i) =>
                      action[3] && (
                        <div key={i}>
                          <Link
                            key={i}
                            className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                            href={
                              action[1] !== "Treatment Summary" &&
                              consultation?.admitted &&
                              !consultation?.current_bed &&
                              i === 1
                                ? ""
                                : `${action[0]}`
                            }
                            onClick={() => {
                              if (
                                action[1] !== "Treatment Summary" &&
                                consultation?.admitted &&
                                !consultation?.current_bed &&
                                i === 1
                              ) {
                                Notification.Error({
                                  msg: "Please assign a bed to the patient",
                                });
                                setOpen(true);
                              }
                              triggerGoal("Patient Card Button Clicked", {
                                buttonName: action[1],
                                consultationId: consultation?.id,
                                userId: authUser?.id,
                              });
                            }}
                          >
                            <CareIcon
                              className={`care-l-${action[2]} text-lg text-primary-500`}
                            />
                            <span>{action[1]}</span>
                          </Link>
                          {action?.[4]?.[0] && (
                            <>
                              <p className="mt-1 text-xs text-red-500">
                                {action[4][1]}
                              </p>
                            </>
                          )}
                        </div>
                      )
                  )}
              </div>

              <div>
                {enable_abdm &&
                  (patient.abha_number ? (
                    <>
                      <Menu.Item>
                        {({ close }) => (
                          <>
                            <div
                              className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                              onClick={() => {
                                close();
                                setShowABHAProfile(true);
                                triggerGoal("Patient Card Button Clicked", {
                                  buttonName: "Show ABHA Profile",
                                  consultationId: consultation?.id,
                                  userId: authUser?.id,
                                });
                              }}
                            >
                              <CareIcon className="care-l-user-square text-lg text-primary-500" />
                              <span>Show ABHA Profile</span>
                            </div>
                            <div
                              className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                              onClick={() => {
                                triggerGoal("Patient Card Button Clicked", {
                                  buttonName: "Link Care Context",
                                  consultationId: consultation?.id,
                                  userId: authUser?.id,
                                });
                                close();
                                setShowLinkCareContext(true);
                              }}
                            >
                              <CareIcon className="care-l-link text-lg text-primary-500" />
                              <span>Link Care Context</span>
                            </div>
                            <div
                              className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                              onClick={() => {
                                close();
                                setShowFetchABDMRecords(true);
                                triggerGoal("Patient Card Button Clicked", {
                                  buttonName: "Fetch Records over ABDM",
                                  consultationId: consultation?.id,
                                  userId: authUser?.id,
                                });
                              }}
                            >
                              <CareIcon className="care-l-user-square text-lg text-primary-500" />
                              <span>Fetch Records over ABDM</span>
                            </div>
                          </>
                        )}
                      </Menu.Item>
                    </>
                  ) : (
                    <Menu.Item>
                      {({ close }) => (
                        <div
                          className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                          onClick={() => {
                            close();
                            setShowLinkABHANumber(true);
                          }}
                        >
                          <span className="flex w-full items-center justify-start gap-2">
                            <CareIcon className="care-l-link text-lg text-primary-500" />
                            <p>Link ABHA Number</p>
                          </span>
                        </div>
                      )}
                    </Menu.Item>
                  ))}
              </div>
              <div>
                {!consultation?.discharge_date && (
                  <Menu.Item>
                    {({ close }) => (
                      <>
                        {hasActiveShiftingRequest() ? (
                          <div
                            className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                            onClick={() => {
                              close();
                              navigate(
                                `/shifting/${
                                  activeShiftingData[
                                    activeShiftingData.length - 1
                                  ].id
                                }`
                              );
                            }}
                          >
                            <span className="flex w-full items-center justify-start gap-2">
                              <CareIcon className="care-l-ambulance text-lg text-primary-500" />
                              <p>Track Shifting</p>
                            </span>
                          </div>
                        ) : (
                          <div
                            className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                            onClick={() => {
                              close();
                              navigate(
                                `/facility/${patient.facility}/patient/${patient.id}/shift/new`
                              );
                            }}
                          >
                            <span className="flex w-full items-center justify-start gap-2">
                              <CareIcon className="care-l-ambulance text-lg text-primary-500" />
                              <p>Shift Patient</p>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </Menu.Item>
                )}
                <Menu.Item>
                  {({ close }) => (
                    <div
                      className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                      onClick={() => {
                        close();
                        setOpenDischargeSummaryDialog(true);
                      }}
                    >
                      <span className="flex w-full items-center justify-start gap-2">
                        <CareIcon className="care-l-clipboard-notes text-lg text-primary-500" />
                        <p>{t("discharge_summary")}</p>
                      </span>
                    </div>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ close }) => (
                    <div
                      className={`dropdown-item-primary pointer-events-auto ${
                        consultation?.discharge_date &&
                        "text-gray-500 accent-gray-500 hover:bg-white"
                      } m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out`}
                      onClick={() => {
                        if (!consultation?.discharge_date) {
                          close();
                          setOpenDischargeDialog(true);
                        }
                      }}
                    >
                      <span className="flex w-full items-center justify-start gap-2">
                        <CareIcon
                          className={`care-l-hospital text-lg ${
                            consultation?.discharge_date
                              ? "text-gray-500"
                              : "text-primary-500"
                          }`}
                        />
                        <p>{t("discharge_from_care")}</p>
                      </span>
                    </div>
                  )}
                </Menu.Item>
              </div>
              <div className="px-4 py-2">
                <Switch.Group as="div" className="flex items-center">
                  <Switch
                    checked={medicoLegalCase}
                    onChange={(checked) => {
                      triggerGoal("Patient Card Button Clicked", {
                        buttonName: "Medico Legal Case",
                        consultationId: consultation?.id,
                        userId: authUser?.id,
                      });
                      setMedicoLegalCase(checked);
                      switchMedicoLegalCase(checked);
                    }}
                    className={classNames(
                      medicoLegalCase ? "bg-primary" : "bg-gray-200",
                      "relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none "
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={classNames(
                        medicoLegalCase ? "translate-x-4" : "translate-x-0",
                        "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      )}
                    />
                  </Switch>
                  <Switch.Label as="span" className="ml-3 text-sm">
                    <span className="font-medium text-gray-900">
                      Medico-Legal Case
                    </span>{" "}
                  </Switch.Label>
                </Switch.Group>
              </div>
            </DropdownMenu>
          </div>
        </div>
      </section>
      <LinkABHANumberModal
        show={showLinkABHANumber}
        onClose={() => setShowLinkABHANumber(false)}
        patientId={patient.id as any}
        onSuccess={(_) => {
          window.location.href += "?show-abha-profile=true";
        }}
      />
      <ABHAProfileModal
        patientId={patient.id}
        abha={patient.abha_number_object}
        show={showABHAProfile}
        onClose={() => setShowABHAProfile(false)}
      />
      <LinkCareContextModal
        consultationId={props.consultationId}
        patient={patient}
        show={showLinkCareContext}
        onClose={() => setShowLinkCareContext(false)}
      />
      <FetchRecordsModal
        patient={patient}
        show={showFetchABDMRecords}
        onClose={() => setShowFetchABDMRecords(false)}
      />
    </>
  );
}
