import * as Notification from "../../Utils/Notifications.js";

import {
  CONSULTATION_SUGGESTION,
  DISCHARGE_REASONS,
  PATIENT_CATEGORIES,
  RESPIRATORY_SUPPORT,
} from "../../Common/constants";
import { ConsultationModel, PatientCategory } from "../Facility/models";

import Beds from "../Facility/Consultations/Beds";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import { Link } from "raviger";
import { PatientModel } from "./models";
import { getDimensionOrDash } from "../../Common/utils";
import moment from "moment";
import useConfig from "../../Common/hooks/useConfig";
import { useState } from "react";

export default function PatientInfoCard(props: {
  patient: PatientModel;
  consultation?: ConsultationModel;
  fetchPatientData?: (state: { aborted: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);
  const { enable_hcx } = useConfig();

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
        className="w-full max-w-2xl"
      >
        {patient?.facility && patient?.id && consultation?.id ? (
          <Beds
            facilityId={patient?.facility}
            patientId={patient?.id}
            discharged={!!consultation?.discharge_date}
            consultationId={consultation?.id}
            setState={setOpen}
            fetchPatientData={props.fetchPatientData}
            smallLoader
            hideTitle
          />
        ) : (
          <div>Invalid Patient Data</div>
        )}
      </DialogModal>
      <section className="flex items-center lg:flex-row flex-col space-y-3 lg:space-y-0 lg:space-x-2 justify-between">
        <div className="bg-white px-4 py-2 lg:p-6 flex flex-col lg:flex-row lg:w-7/12 w-full">
          {/* Can support for patient picture in the future */}
          <div className="mt-2 flex flex-col items-center">
            <div
              className={`w-24 h-24 min-w-[5rem] bg-gray-200 ${categoryClass}-profile`}
            >
              {consultation &&
              consultation?.current_bed &&
              consultation?.discharge_date === null ? (
                <div
                  className="flex flex-col items-center justify-center h-full"
                  title={`
                ${consultation?.current_bed?.bed_object?.location_object?.name}\n${consultation?.current_bed?.bed_object.name}
              `}
                >
                  <p className="overflow-hidden px-2 whitespace-nowrap w-full text-gray-900 text-sm text-center text-ellipsis ">
                    {
                      consultation?.current_bed?.bed_object?.location_object
                        ?.name
                    }
                  </p>
                  <p className="w-full text-base px-2 text-ellipsis overflow-hidden whitespace-nowrap font-bold text-center">
                    {consultation?.current_bed?.bed_object.name}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <i className="fas fa-user-injured text-3xl text-gray-500"></i>
                </div>
              )}
            </div>
            {category && (
              <div
                className={`text-xs font-bold rounded-b w-24 text-center pb-1 px-2 ${categoryClass}`}
              >
                {category.toUpperCase()}
              </div>
            )}
            <ButtonV2 ghost onClick={() => setOpen(true)} className="mt-1">
              {bedDialogTitle}
            </ButtonV2>
          </div>
          <div className="flex flex-col lg:pl-6 items-center lg:items-start gap-4 lg:gap-0">
            <div className="sm:text-xl md:text-4xl font-semibold mb-1">
              {patient.name}
            </div>
            <div>
              {patient.review_time &&
                !consultation?.discharge_date &&
                Number(consultation?.review_interval) > 0 && (
                  <div
                    className={
                      "mb-2 inline-flex items-center px-3 py-1 rounded-lg text-xs leading-4 font-semibold p-1 w-full justify-center border-gray-500 border " +
                      (moment().isBefore(patient.review_time)
                        ? " bg-gray-100"
                        : " p-1 bg-red-400 text-white")
                    }
                  >
                    <i className="mr-2 text-md fas fa-clock"></i>
                    {(moment().isBefore(patient.review_time)
                      ? "Review before: "
                      : "Review Missed: ") +
                      moment(patient.review_time).format("lll")}
                  </div>
                )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1 lg:mb-2">
              <Link
                href={`/facility/${consultation?.facility}`}
                className="font-semibold text-black hover:text-primary-600"
              >
                <i
                  className="text-primary-400 fas fa-hospital mr-1"
                  aria-hidden="true"
                ></i>
                {consultation?.facility_name}
              </Link>

              {(consultation?.suggestion === "A" || op_no) && (
                <span className="md:col-span-2 capitalize pl-2">
                  <span className="badge badge-pill badge-primary">
                    {consultation?.suggestion !== "A"
                      ? `OP: ${op_no}`
                      : `IP: ${ip_no}`}
                  </span>
                </span>
              )}
            </div>
            {!!consultation?.discharge_date && (
              <p className="bg-red-100 text-red-600 inline-block rounded-lg px-2 py-1 my-1 text-sm">
                Discharged from CARE
              </p>
            )}
            <p className="text-sm sm:text-sm text-gray-900">
              <span>{patient.age} years</span>
              <span className="mx-2">•</span>
              <span>{patient.gender}</span>
            </p>
            <div className="text-sm flex flex-col sm:flex-row items-center gap-2 lg:mt-4">
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
                  )?.id || "UNKNOWN",
                  consultation?.last_daily_round?.ventilator_interface,
                ],
              ].map((stat, i) => {
                return stat[2] && stat[1] !== "NONE" ? (
                  <div
                    key={"patient_stat_" + i}
                    className="bg-gray-200 border-gray-500 border py-1 px-2 rounded-lg text-xs"
                  >
                    <b>{stat[0]}</b> : {stat[1]}
                  </div>
                ) : (
                  ""
                );
              })}
            </div>
            {!!consultation?.discharge_date && (
              <div className="flex gap-4 text-sm mt-3 px-3 py-1 font-medium bg-cyan-300">
                <div>
                  <span>
                    {
                      CONSULTATION_SUGGESTION.find(
                        (suggestion) =>
                          suggestion.id === consultation?.suggestion
                      )?.text
                    }{" "}
                    on{" "}
                    {consultation?.suggestion === "A"
                      ? moment(consultation?.admission_date).format(
                          "DD/MM/YYYY"
                        )
                      : moment(consultation?.created_date).format("DD/MM/YYYY")}
                    ,
                    {consultation?.discharge_reason === "EXP" ? (
                      <span>
                        {" "}
                        Expired on{" "}
                        {moment(consultation?.death_datetime).format(
                          "DD/MM/YYYY"
                        )}
                      </span>
                    ) : (
                      <span>
                        {" "}
                        Discharged on{" "}
                        {moment(consultation?.discharge_date).format(
                          "DD/MM/YYYY"
                        )}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-fit flex gap-2 flex-col px-4 py-1 lg:p-6">
          {!!consultation?.discharge_date && (
            <div className="flex flex-col justify-center items-center">
              <div className="text-sm leading-5 font-normal text-gray-500">
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
                  !(consultation?.discharge_date || !patient.is_active) &&
                  moment(consultation?.modified_date).isBefore(
                    new Date().getTime() - 24 * 60 * 60 * 1000
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
                      variant={action[4] && action[4][0] ? "danger" : "primary"}
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
                      align="start"
                      className="w-full"
                    >
                      <CareIcon className={`care-l-${action[2]} text-lg`} />
                      <p className="font-semibold">{action[1]}</p>
                    </ButtonV2>
                    {action[4] && action[4][0] && (
                      <>
                        <p className="text-xs text-red-500 mt-1">
                          {action[4][1]}
                        </p>
                      </>
                    )}
                  </div>
                )
            )}
        </div>
      </section>
    </>
  );
}
