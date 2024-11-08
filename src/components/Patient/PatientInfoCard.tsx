import careConfig from "@careConfig";
import { Field, Label, MenuItem, Switch } from "@headlessui/react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils.js";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AuthorizedForConsultationRelatedActions } from "@/CAREUI/misc/AuthorizedChild";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import ABHAProfileModal from "@/components/ABDM/ABHAProfileModal";
import FetchRecordsModal from "@/components/ABDM/FetchRecordsModal";
import LinkAbhaNumber from "@/components/ABDM/LinkAbhaNumber/index";
import { AbhaNumberModel } from "@/components/ABDM/types/abha";
import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import DropdownMenu from "@/components/Common/Menu";
import Beds from "@/components/Facility/Consultations/Beds";
import { Mews } from "@/components/Facility/Consultations/Mews";
import DischargeModal from "@/components/Facility/DischargeModal";
import DischargeSummaryModal from "@/components/Facility/DischargeSummaryModal";
import {
  ConsultationModel,
  PatientCategory,
} from "@/components/Facility/models";
import { PatientModel } from "@/components/Patient/models";
import { SkillModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import {
  CONSULTATION_SUGGESTION,
  DISCHARGE_REASONS,
  PATIENT_CATEGORIES,
  RESPIRATORY_SUPPORT,
  TELEMEDICINE_ACTIONS,
} from "@/common/constants";

import { triggerGoal } from "@/Integrations/Plausible";
import { PLUGIN_Component } from "@/PluginEngine";
import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import {
  classNames,
  formatDate,
  formatDateTime,
  formatName,
  formatPatientAge,
  humanizeStrings,
} from "@/Utils/utils";

const formatSkills = (arr: SkillModel[]) => {
  const skills = arr.map((skill) => skill.skill_object.name);

  if (skills.length <= 3) {
    return humanizeStrings(skills);
  }

  return `${skills[0]}, ${skills[1]} and ${skills.length - 2} other skills...`;
};

export default function PatientInfoCard(props: {
  patient: PatientModel;
  consultation?: ConsultationModel;
  abhaNumber?: AbhaNumberModel;
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
    !!props.showAbhaProfile,
  );
  const [showFetchABDMRecords, setShowFetchABDMRecords] = useState(false);
  const [openDischargeSummaryDialog, setOpenDischargeSummaryDialog] =
    useState(false);
  const [openDischargeDialog, setOpenDischargeDialog] = useState(false);

  const patient = props.patient;
  const consultation = props.consultation;
  const activeShiftingData = props.activeShiftingData;

  const [medicoLegalCase, setMedicoLegalCase] = useState(
    consultation?.medico_legal_case ?? false,
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
  const skillsQuery = useQuery(routes.userListSkill, {
    pathParams: {
      username: consultation?.treating_physician_object?.username ?? "",
    },
    prefetch: !!consultation?.treating_physician_object?.username,
  });

  const { data: healthFacility } = useQuery(routes.abdm.healthFacility.get, {
    pathParams: { facility_id: patient.facility ?? "" },
    silent: true,
  });

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

      <section className="flex flex-col lg:flex-row">
        <div
          className="flex w-full flex-col bg-white px-4 pt-2 lg:flex-row"
          id="patient-infobadges"
        >
          {/* Can support for patient picture in the future */}
          <div className="flex justify-evenly lg:justify-normal">
            <div className="flex flex-col items-start lg:items-center">
              <div
                className={`w-24 min-w-20 bg-secondary-200 ${categoryClass}-profile h-24`}
              >
                {consultation?.current_bed &&
                consultation?.discharge_date === null ? (
                  <div className="tooltip flex h-full flex-col items-center justify-center">
                    <p className="w-full truncate px-2 text-center text-sm text-secondary-900">
                      {
                        consultation?.current_bed?.bed_object?.location_object
                          ?.name
                      }
                    </p>
                    <p className="w-full truncate px-2 text-center text-base font-bold">
                      {consultation?.current_bed?.bed_object.name}
                    </p>
                    <div className="tooltip-text tooltip-right flex -translate-x-1/3 translate-y-1/2 flex-col items-center justify-center text-sm">
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
                      className="text-3xl text-secondary-500"
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
              {consultation?.admitted && (
                <ButtonV2
                  id="switch-bed"
                  ghost
                  onClick={() => setOpen(true)}
                  className="mt-1 px-[10px] py-1"
                >
                  {bedDialogTitle}
                </ButtonV2>
              )}
            </div>
            <div className="flex items-center justify-center">
              <div
                className="mb-2 flex flex-col justify-center text-xl font-semibold capitalize lg:hidden"
                id="patient-name-consultation"
              >
                {patient.name}
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-secondary-600">
                  {formatPatientAge(patient, true)} • {patient.gender}
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
          <div className="flex w-full flex-col items-center gap-4 space-y-2 lg:items-start lg:gap-0 lg:pl-2">
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
                <span className="flex pl-2 capitalize">
                  <span className="badge badge-pill badge-danger">MLC</span>
                </span>
              )}
            </div>
            <div className="flex flex-col flex-wrap items-center justify-center lg:items-start lg:justify-normal">
              <div
                className="mb-2 hidden flex-row text-xl font-semibold capitalize lg:flex"
                id="patient-name-consultation"
              >
                {patient.name}
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-secondary-600">
                  {formatPatientAge(patient, true)} • {patient.gender}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm sm:flex-row">
                <div
                  className="flex w-full flex-wrap items-center justify-center gap-2 text-sm text-secondary-900 sm:flex-row sm:text-sm md:pr-10 lg:justify-normal"
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
                      <div className="inline-flex w-full items-center justify-start rounded border border-secondary-500 bg-blue-100 p-1 px-3 text-xs font-semibold leading-4">
                        <span className="font-semibold text-indigo-800">
                          {" "}
                          {
                            TELEMEDICINE_ACTIONS.find(
                              (i) => i.id === patient.action,
                            )?.desc
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    {patient.blood_group && (
                      <div className="inline-flex w-full items-center justify-start rounded border border-secondary-500 bg-secondary-100 p-1 px-2 text-xs font-semibold leading-4">
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
                            "inline-flex w-full items-center justify-center rounded border border-secondary-500 p-1 text-xs font-semibold leading-4 " +
                            (dayjs().isBefore(patient.review_time)
                              ? " bg-secondary-100"
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
                  {!!consultation?.has_consents?.length || (
                    <div>
                      <div className="inline-flex w-full items-center justify-start rounded border border-red-600 bg-red-400 p-1 px-3 text-xs font-semibold leading-4">
                        <span className="font-semibold text-white">
                          Consent Records Missing
                        </span>
                      </div>
                    </div>
                  )}
                  {consultation?.suggestion === "DC" && (
                    <div>
                      <div>
                        <div className="inline-flex w-full items-center justify-start rounded border border-secondary-500 bg-secondary-100 p-1 px-3 text-xs font-semibold leading-4">
                          <CareIcon
                            icon="l-estate"
                            className="mr-1 text-base text-secondary-700"
                          />
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
                          resp.value ===
                          consultation?.last_daily_round?.ventilator_interface,
                      )?.id ?? "UNKNOWN",
                      consultation?.last_daily_round?.ventilator_interface,
                    ],
                  ].map((stat, i) => {
                    return stat[2] && stat[1] !== "NONE" ? (
                      <div className="flex flex-col items-center gap-2 text-sm">
                        <div
                          key={"patient_stat_" + i}
                          className="flex items-center justify-center rounded border border-secondary-500 bg-secondary-100 p-1 px-3 text-xs font-semibold leading-4"
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
                                  suggestion.id === consultation?.suggestion,
                              )?.text
                            }
                          </b>{" "}
                          on {formatDateTime(consultation.encounter_date)},
                          {consultation?.new_discharge_reason === 3 ? (
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
                    <div className="flex items-center justify-center rounded border border-secondary-500 bg-secondary-100 p-1 px-3 text-xs font-semibold leading-4">
                      <span className="flex">
                        {consultation?.encounter_date && (
                          <div>
                            {consultation.suggestion === "DC"
                              ? "Commenced on: "
                              : "Admitted on: "}
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
                        (diagnosis) => diagnosis.is_principal,
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
                  <span className="space-x-1 text-sm" id="treating-physician">
                    <span className="font-semibold leading-relaxed">
                      {t("treating_doctor")}:{" "}
                    </span>
                    {consultation?.treating_physician_object
                      ? formatName(consultation.treating_physician_object)
                      : consultation?.deprecated_verified_by}
                    <CareIcon
                      icon="l-check"
                      className="fill-current text-xl text-green-500"
                    />
                    <br className="md:hidden" />
                    <span className="tooltip text-xs text-secondary-800">
                      {!!skillsQuery.data?.results?.length &&
                        formatSkills(skillsQuery.data?.results)}
                      {(skillsQuery.data?.results?.length || 0) > 3 && (
                        <ul className="tooltip-text tooltip-bottom flex flex-col text-xs font-medium">
                          {skillsQuery.data?.results.map((skill) => (
                            <li>{skill.skill_object.name}</li>
                          ))}
                        </ul>
                      )}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-end gap-4 px-4 py-1 2xl:flex-row"
          id="consultation-buttons"
        >
          {consultation?.suggestion === "A" && (
            <div className="flex flex-col items-center">
              <div className="flex w-full justify-center bg-white px-4 lg:flex-row">
                <div
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-full border-2"
                  }
                >
                  <span className="text-sm font-semibold">
                    {dayjs(consultation.discharge_date || undefined).diff(
                      consultation.encounter_date,
                      "day",
                    ) + 1}
                  </span>
                </div>
              </div>
              <span className="mt-1 text-xs font-medium text-secondary-700">
                IP Day No
              </span>
            </div>
          )}
          {consultation?.last_daily_round && (
            <div className="flex w-full justify-center bg-white px-4 lg:flex-row">
              <Mews dailyRound={consultation?.last_daily_round} />
            </div>
          )}
          {!!consultation?.discharge_date && (
            <div className="flex min-w-max flex-col items-center justify-center">
              <div className="text-sm font-normal leading-5 text-secondary-500">
                Discharge Reason
              </div>
              <div className="mt-[6px] text-xl font-semibold leading-5 text-secondary-900">
                {!consultation?.new_discharge_reason ? (
                  <span className="text-secondary-800">
                    {consultation.suggestion === "OP"
                      ? "OP file closed"
                      : "UNKNOWN"}
                  </span>
                ) : consultation?.new_discharge_reason ===
                  DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id ? (
                  <span className="text-red-600">EXPIRED</span>
                ) : (
                  DISCHARGE_REASONS.find(
                    (reason) =>
                      reason.id === consultation?.new_discharge_reason,
                  )?.text
                )}
              </div>
            </div>
          )}
          <div className="flex w-full flex-col gap-3 lg:w-auto 2xl:flex-row">
            <AuthorizedForConsultationRelatedActions>
              {patient.is_active &&
                consultation?.id &&
                !consultation?.discharge_date && (
                  <div
                    className="h-10 min-h-[40px] w-full min-w-[170px] lg:w-auto"
                    id="log-update"
                  >
                    <ButtonV2
                      variant={
                        !(consultation?.facility !== patient.facility) &&
                        !(consultation?.discharge_date ?? !patient.is_active) &&
                        dayjs(consultation?.modified_date).isBefore(
                          dayjs().subtract(1, "day"),
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
                        <CareIcon icon="l-plus" className="text-xl" />
                        <p className="font-semibold">
                          {authUser.user_type === "Doctor"
                            ? "File Note"
                            : "Log Update"}
                        </p>
                      </span>
                    </ButtonV2>
                    {!(consultation?.facility !== patient.facility) &&
                      !(consultation?.discharge_date ?? !patient.is_active) &&
                      dayjs(consultation?.modified_date).isBefore(
                        dayjs().subtract(1, "day"),
                      ) && (
                        <>
                          <p className="mt-0.5 text-xs text-red-500">
                            <div className="text-center">
                              <CareIcon icon="l-exclamation-triangle" /> No
                              update filed in the last 24 hours
                            </div>
                          </p>
                        </>
                      )}
                  </div>
                )}
            </AuthorizedForConsultationRelatedActions>
            <DropdownMenu
              id="show-more"
              itemClassName="min-w-0 sm:min-w-[225px]"
              title="Manage Patient"
              icon={<CareIcon icon="l-setting" className="text-xl" />}
              className="xl:justify-center"
              containerClassName="w-full lg:w-auto mt-2 2xl:mt-0 flex justify-center z-20"
            >
              <div>
                {[
                  [
                    `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/update`,
                    "Edit Consultation Details",
                    "l-pen",
                    patient.is_active &&
                      consultation?.id &&
                      !consultation?.discharge_date,
                  ],
                  [
                    `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/consent-records`,
                    "Consent Records",
                    "l-file-medical",
                    patient.is_active,
                  ],
                  [
                    `/patient/${patient.id}/investigation_reports`,
                    "Investigation Summary",
                    "l-align-alt",
                    true,
                  ],
                  [
                    `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/treatment-summary`,
                    "Treatment Summary",
                    "l-file-medical",
                    consultation?.id,
                  ],
                ].map(
                  (action: any, i) =>
                    action[3] && (
                      <div key={i}>
                        <Link
                          key={i}
                          className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                          href={
                            !["Treatment Summary", "Consent Records"].includes(
                              action[1],
                            ) &&
                            consultation?.admitted &&
                            !consultation?.current_bed &&
                            i === 1
                              ? ""
                              : `${action[0]}`
                          }
                          onClick={() => {
                            if (
                              ![
                                "Treatment Summary",
                                "Consent Records",
                              ].includes(action[1]) &&
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
                            icon={action[2]}
                            className="text-lg text-primary-500"
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
                    ),
                )}
              </div>

              <div>
                {careConfig.abdm.enabled &&
                  (props.abhaNumber ? (
                    <>
                      <MenuItem>
                        {({ close }) => (
                          <>
                            <div
                              className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                              onClick={() => {
                                close();
                                setShowABHAProfile(true);
                                triggerGoal("Patient Card Button Clicked", {
                                  buttonName: t("show_abha_profile"),
                                  consultationId: consultation?.id,
                                  userId: authUser?.id,
                                });
                              }}
                            >
                              <CareIcon
                                icon="l-user-square"
                                className="text-lg text-primary-500"
                              />
                              <span>{t("show_abha_profile")}</span>
                            </div>
                            <div
                              className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                              onClick={() => {
                                close();
                                setShowFetchABDMRecords(true);
                                triggerGoal("Patient Card Button Clicked", {
                                  buttonName: t("hi__fetch_records"),
                                  consultationId: consultation?.id,
                                  userId: authUser?.id,
                                });
                              }}
                            >
                              <CareIcon
                                icon="l-file-network"
                                className="text-lg text-primary-500"
                              />
                              <span>{t("hi__fetch_records")}</span>
                            </div>
                          </>
                        )}
                      </MenuItem>
                    </>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <MenuItem disabled={!healthFacility}>
                            {({ close, disabled }) => (
                              <div
                                className={cn(
                                  "dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out",
                                  disabled && "pointer-events-none opacity-30",
                                )}
                                onClick={() => {
                                  close();
                                  setShowLinkABHANumber(true);
                                }}
                              >
                                <span className="flex w-full items-center justify-start gap-2">
                                  <CareIcon
                                    icon="l-link"
                                    className="text-lg text-primary-500"
                                  />
                                  <p>{t("generate_link_abha")}</p>
                                </span>
                              </div>
                            )}
                          </MenuItem>
                        </TooltipTrigger>

                        {!healthFacility && (
                          <TooltipContent className="max-w-sm break-words text-sm">
                            {t("abha_disabled_due_to_no_health_facility")}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
              </div>
              <div>
                {!consultation?.discharge_date && (
                  <MenuItem>
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
                                }`,
                              );
                            }}
                          >
                            <span className="flex w-full items-center justify-start gap-2">
                              <CareIcon
                                icon="l-ambulance"
                                className="text-lg text-primary-500"
                              />
                              <p>Track Shifting</p>
                            </span>
                          </div>
                        ) : (
                          <div
                            className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                            onClick={() => {
                              close();
                              navigate(
                                `/facility/${patient.facility}/patient/${patient.id}/shift/new`,
                              );
                            }}
                          >
                            <span className="flex w-full items-center justify-start gap-2">
                              <CareIcon
                                icon="l-ambulance"
                                className="text-lg text-primary-500"
                              />
                              <p>Shift Patient</p>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </MenuItem>
                )}
                <MenuItem>
                  {({ close }) => (
                    <div
                      className="dropdown-item-primary pointer-events-auto m-2 flex cursor-pointer items-center justify-start gap-2 rounded border-0 p-2 text-sm font-normal transition-all duration-200 ease-in-out"
                      onClick={() => {
                        close();
                        setOpenDischargeSummaryDialog(true);
                      }}
                    >
                      <span className="flex w-full items-center justify-start gap-2">
                        <CareIcon
                          icon="l-clipboard-notes"
                          className="text-lg text-primary-500"
                        />
                        <p>{t("discharge_summary")}</p>
                      </span>
                    </div>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ close }) => (
                    <div
                      className={`dropdown-item-primary pointer-events-auto ${
                        consultation?.discharge_date &&
                        "text-secondary-500 accent-secondary-500 hover:bg-white"
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
                          icon="l-hospital"
                          className={`text-lg ${
                            consultation?.discharge_date
                              ? "text-secondary-500"
                              : "text-primary-500"
                          }`}
                        />
                        <p>{t("discharge_from_care")}</p>
                      </span>
                    </div>
                  )}
                </MenuItem>
              </div>

              <PLUGIN_Component
                __name="ManagePatientOptions"
                patient={patient}
                consultation={consultation}
              />

              <div className="px-4 py-2">
                <Field as="div" className="flex items-center">
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
                      medicoLegalCase ? "bg-primary" : "bg-secondary-200",
                      "relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={classNames(
                        medicoLegalCase ? "translate-x-4" : "translate-x-0",
                        "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      )}
                    />
                  </Switch>
                  <Label as="span" className="ml-3 text-sm">
                    <span className="font-medium text-secondary-900">
                      Medico-Legal Case
                    </span>{" "}
                  </Label>
                </Field>
              </div>
            </DropdownMenu>
          </div>
        </div>
      </section>
      <LinkAbhaNumber
        show={showLinkABHANumber}
        onClose={() => setShowLinkABHANumber(false)}
        onSuccess={async (abhaProfile) => {
          const { res, data } = await request(
            routes.abdm.healthId.linkAbhaNumberAndPatient,
            {
              body: {
                patient: patient.id,
                abha_number: abhaProfile.external_id,
              },
            },
          );

          if (res?.status === 200 && data) {
            Notification.Success({
              msg: t("abha_number_linked_successfully"),
            });

            props.fetchPatientData?.({ aborted: false });
            setShowLinkABHANumber(false);
            setShowABHAProfile(true);
          } else {
            Notification.Error({
              msg: t("failed_to_link_abha_number"),
            });
          }
        }}
      />
      <ABHAProfileModal
        patientId={patient.id}
        abha={props.abhaNumber}
        show={showABHAProfile}
        onClose={() => setShowABHAProfile(false)}
      />
      <FetchRecordsModal
        abha={props.abhaNumber}
        show={showFetchABDMRecords}
        onClose={() => setShowFetchABDMRecords(false)}
      />
    </>
  );
}
