import * as Notification from "../../Utils/Notifications.js";

import {
  CONSULTATION_SUGGESTION,
  DISCHARGE_REASONS,
  PATIENT_CATEGORIES,
  RESPIRATORY_SUPPORT,
} from "../../Common/constants";
import { ConsultationModel, PatientCategory } from "../Facility/models";

import ABHAProfileModal from "../ABDM/ABHAProfileModal";
import Beds from "../Facility/Consultations/Beds";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import { Link } from "raviger";
import LinkABHANumberModal from "../ABDM/LinkABHANumberModal";
import LinkCareContextModal from "../ABDM/LinkCareContextModal";
import { PatientModel } from "./models";
import { getDimensionOrDash } from "../../Common/utils";
import useConfig from "../../Common/hooks/useConfig";
import { useState } from "react";
import { formatDate, formatDateTime } from "../../Utils/utils.js";
import dayjs from "../../Utils/dayjs";

export default function PatientInfoCard(props: {
  patient: PatientModel;
  consultation?: ConsultationModel;
  fetchPatientData?: (state: { aborted: boolean }) => void;
  consultationId: string;
  showAbhaProfile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showLinkABHANumber, setShowLinkABHANumber] = useState(false);
  const [showABHAProfile, setShowABHAProfile] = useState(
    !!props.showAbhaProfile
  );

  const { enable_hcx, enable_abdm } = useConfig();
  const [showLinkCareContext, setShowLinkCareContext] = useState(false);

  const patient = props.patient;
  const consultation = props.consultation;
  const ip_no = consultation?.ip_no;
  const op_no = consultation?.op_no;

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
      <section className="flex flex-col items-center justify-between space-y-3 lg:flex-row lg:space-x-2 lg:space-y-0">
        <div className="flex w-full flex-col bg-white px-4 py-2 lg:w-7/12 lg:flex-row lg:p-6">
          {/* Can support for patient picture in the future */}
          <div className="mt-2 flex flex-col items-center">
            <div
              className={`h-24 w-24 min-w-[5rem] bg-gray-200 ${categoryClass}-profile`}
            >
              {consultation?.current_bed &&
              consultation?.discharge_date === null ? (
                <div
                  className="flex h-full flex-col items-center justify-center"
                  title={`
                ${consultation?.current_bed?.bed_object?.location_object?.name}\n${consultation?.current_bed?.bed_object.name}
              `}
                >
                  <p className="w-full truncate px-2 text-center text-sm text-gray-900">
                    {
                      consultation?.current_bed?.bed_object?.location_object
                        ?.name
                    }
                  </p>
                  <p className="w-full truncate px-2 text-center text-base font-bold">
                    {consultation?.current_bed?.bed_object.name}
                  </p>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <i className="fas fa-user-injured text-3xl text-gray-500"></i>
                </div>
              )}
            </div>
            {category && (
              <div
                className={`w-24 rounded-b px-2 pb-1 text-center text-xs font-bold ${categoryClass}`}
              >
                {category.toUpperCase()}
              </div>
            )}
            <ButtonV2 ghost onClick={() => setOpen(true)} className="mt-1">
              {bedDialogTitle}
            </ButtonV2>
          </div>
          <div className="flex flex-col items-center gap-4 lg:items-start lg:gap-0 lg:pl-6">
            <div className="mb-1 font-semibold sm:text-xl md:text-4xl">
              {patient.name}
            </div>
            <div>
              {patient.review_time &&
                !consultation?.discharge_date &&
                Number(consultation?.review_interval) > 0 && (
                  <div
                    className={
                      "mb-2 inline-flex w-full items-center justify-center rounded-lg border border-gray-500 p-1 px-3 py-1 text-xs font-semibold leading-4 " +
                      (dayjs().isBefore(patient.review_time)
                        ? " bg-gray-100"
                        : " bg-red-400 p-1 text-white")
                    }
                  >
                    <i className="text-md fas fa-clock mr-2"></i>
                    {(dayjs().isBefore(patient.review_time)
                      ? "Review before: "
                      : "Review Missed: ") +
                      formatDateTime(patient.review_time)}
                  </div>
                )}
            </div>
            <div className="flex flex-col items-center gap-1 sm:flex-row lg:mb-2">
              <Link
                href={`/facility/${consultation?.facility}`}
                className="font-semibold text-black hover:text-primary-600"
              >
                <i
                  className="fas fa-hospital mr-1 text-primary-400"
                  aria-hidden="true"
                ></i>
                {consultation?.facility_name}
              </Link>

              {(consultation?.suggestion === "A" || op_no) && (
                <span className="pl-2 capitalize md:col-span-2">
                  <span className="badge badge-pill badge-primary">
                    {consultation?.suggestion !== "A"
                      ? `OP: ${op_no}`
                      : `IP: ${ip_no}`}
                  </span>
                </span>
              )}
            </div>
            {!!consultation?.discharge_date && (
              <p className="my-1 inline-block rounded-lg bg-red-100 px-2 py-1 text-sm text-red-600">
                Discharged from CARE
              </p>
            )}
            <p className="text-sm text-gray-900 sm:text-sm">
              <span>{patient.age} years</span>
              <span className="mx-2">•</span>
              <span>{patient.gender}</span>
              {consultation?.suggestion === "DC" && (
                <>
                  <span className="mx-2">•</span>
                  <span className="space-x-2">
                    Domiciliary Care{" "}
                    <CareIcon className="care-l-estate text-base text-gray-700" />
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-col items-center gap-2 text-sm sm:flex-row lg:mt-4">
              {[
                ["Blood Group", patient.blood_group, patient.blood_group],
                [
                  "Weight",
                  getDimensionOrDash(consultation?.weight, " kg"),
                  true,
                ],
                [
                  "Height",
                  getDimensionOrDash(consultation?.height, "cm"),
                  true,
                ],
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
                  <div
                    key={"patient_stat_" + i}
                    className="rounded-lg border border-gray-500 bg-gray-200 px-2 py-1 text-xs"
                  >
                    <b>{stat[0]}</b> : {stat[1]}
                  </div>
                ) : (
                  ""
                );
              })}
            </div>
            {!!consultation?.discharge_date && (
              <div className="mt-3 flex gap-4 bg-cyan-300 px-3 py-1 text-sm font-medium">
                <div>
                  <span>
                    {
                      CONSULTATION_SUGGESTION.find(
                        (suggestion) =>
                          suggestion.id === consultation?.suggestion
                      )?.text
                    }{" "}
                    on{" "}
                    {formatDate(
                      ["A", "DC"].includes(consultation?.suggestion ?? "")
                        ? consultation?.admission_date
                        : consultation?.created_date
                    )}
                    ,
                    {consultation?.discharge_reason === "EXP" ? (
                      <span>
                        {" "}
                        Expired on {formatDate(consultation?.death_datetime)}
                      </span>
                    ) : (
                      <span>
                        {" "}
                        Discharged on {formatDate(consultation?.discharge_date)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 px-4 py-1 lg:w-fit lg:p-6">
          {!!consultation?.discharge_date && (
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm font-normal leading-5 text-gray-500">
                Discharge Reason
              </div>
              <div className="mt-1 text-xl font-semibold leading-5 text-gray-900">
                {!consultation?.discharge_reason ? (
                  <span className="text-gray-800">UNKNOWN</span>
                ) : consultation?.discharge_reason === "EXP" ? (
                  <span className="text-red-600">EXPIRED</span>
                ) : (
                  DISCHARGE_REASONS.find(
                    (reason) => reason.id === consultation?.discharge_reason
                  )?.text
                )}
              </div>
            </div>
          )}
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
              `/facility/${patient.facility}/patient/${patient.id}/consultation/${consultation?.id}/daily-rounds`,
              "Log Update",
              "plus",
              patient.is_active &&
                consultation?.id &&
                !consultation?.discharge_date,
              [
                !(consultation?.facility !== patient.facility) &&
                  !(consultation?.discharge_date ?? !patient.is_active) &&
                  dayjs(consultation?.modified_date).isBefore(
                    dayjs().subtract(1, "day")
                  ),
                <div className="text-center">
                  <CareIcon className="care-l-exclamation-triangle" /> No update
                  filed in the last 24 hours
                </div>,
              ],
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
                  <div className="relative" key={i}>
                    <ButtonV2
                      key={i}
                      variant={action?.[4]?.[0] ? "danger" : "primary"}
                      href={
                        consultation?.admitted &&
                        !consultation?.current_bed &&
                        i === 1
                          ? undefined
                          : `${action[0]}`
                      }
                      onClick={() => {
                        if (
                          consultation?.admitted &&
                          !consultation?.current_bed &&
                          i === 1
                        ) {
                          Notification.Error({
                            msg: "Please assign a bed to the patient",
                          });
                          setOpen(true);
                        }
                      }}
                      className="w-full"
                    >
                      <span className="flex w-full items-center justify-start gap-2">
                        <CareIcon className={`care-l-${action[2]} text-lg`} />
                        <p className="font-semibold">{action[1]}</p>
                      </span>
                    </ButtonV2>
                    {action[4] && action[4][0] && (
                      <>
                        <p className="mt-1 text-xs text-red-500">
                          {action[4][1]}
                        </p>
                      </>
                    )}
                  </div>
                )
            )}
          {enable_abdm &&
            (patient.abha_number ? (
              <>
                <ButtonV2
                  className="flex justify-start gap-3 font-semibold hover:text-white"
                  onClick={() => setShowABHAProfile(true)}
                >
                  <span className="flex w-full items-center justify-start gap-2">
                    <CareIcon className="care-l-user-square" />
                    <p>Show ABHA Profile</p>
                  </span>
                </ButtonV2>
                <ButtonV2
                  className="mt-0 flex justify-start gap-3 font-semibold hover:text-white"
                  onClick={() => setShowLinkCareContext(true)}
                >
                  <span className="flex w-full items-center justify-start gap-2">
                    <CareIcon className="care-l-link" />
                    <p>Link Care Context</p>
                  </span>
                </ButtonV2>
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
              </>
            ) : (
              <>
                <ButtonV2
                  className="flex justify-start gap-3 font-semibold hover:text-white"
                  onClick={() => setShowLinkABHANumber(true)}
                >
                  <span className="flex w-full items-center justify-start gap-2">
                    <CareIcon className="care-l-link" />
                    <p>Link ABHA Number</p>
                  </span>
                </ButtonV2>
                <LinkABHANumberModal
                  show={showLinkABHANumber}
                  onClose={() => setShowLinkABHANumber(false)}
                  patientId={patient.id as any}
                  onSuccess={(_) => {
                    window.location.href += "?show-abha-profile=true";
                  }}
                />
              </>
            ))}
        </div>
      </section>
    </>
  );
}
