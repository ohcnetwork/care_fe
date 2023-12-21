import * as Notification from "../../Utils/Notifications.js";

import {
  CONSULTATION_SUGGESTION,
  DISCHARGE_REASONS,
  PATIENT_CATEGORIES,
  RESPIRATORY_SUPPORT,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants";
import { ConsultationModel, PatientCategory } from "../Facility/models";
import { Switch, Menu } from "@headlessui/react";

import { Link, navigate } from "raviger";
import { useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useConfig from "../../Common/hooks/useConfig";
import dayjs from "../../Utils/dayjs";
import { classNames, formatDate, formatDateTime } from "../../Utils/utils.js";
import ABHAProfileModal from "../ABDM/ABHAProfileModal";
import LinkABHANumberModal from "../ABDM/LinkABHANumberModal";
import LinkCareContextModal from "../ABDM/LinkCareContextModal";
import DialogModal from "../Common/Dialog";
import ButtonV2 from "../Common/components/ButtonV2";
import Beds from "../Facility/Consultations/Beds";
import { PatientModel } from "./models";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api.js";
import DropdownMenu from "../Common/components/Menu.js";
import { triggerGoal } from "../../Integrations/Plausible.js";

import useAuthUser from "../../Common/hooks/useAuthUser";
import { Mews } from "../Facility/Consultations/Mews.js";
import DischargeSummaryModal from "../Facility/DischargeSummaryModal.js";
import DischargeModal from "../Facility/DischargeModal.js";
import { useTranslation } from "react-i18next";

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
              props.fetchPatientData &&
                props.fetchPatientData({ aborted: false });
            }}
            consultationData={consultation}
          />
        </>
      )}

      <section className="flex flex-col items-center justify-between space-y-3 lg:flex-row lg:space-x-2 lg:space-y-0">
        <div className="flex w-full flex-col bg-white px-4 py-2 lg:w-7/12 lg:flex-row lg:p-6">
          {/* Can support for patient picture in the future */}
          <div className="mt-2 flex flex-col items-center">
            <div
              className={`h-24 w-24 min-w-[5rem] bg-gray-200 ${categoryClass}-profile`}
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
            <div
              className="mb-1 font-semibold sm:text-xl md:text-4xl"
              id="patient-name-consultation"
            >
              {patient.name}
            </div>
            <div>
              {patient.review_time &&
                !consultation?.discharge_date &&
                Number(consultation?.review_interval) > 0 && (
                  <div
                    className={
                      "mb-2 inline-flex w-full items-center justify-center rounded-lg border border-gray-500 p-1 text-xs font-semibold leading-4 " +
                      (dayjs().isBefore(patient.review_time)
                        ? " bg-gray-100 "
                        : " bg-red-400 text-white")
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
            <div className="flex flex-col items-center gap-2 sm:flex-row lg:mb-2">
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

              {consultation?.patient_no && (
                <span className="pl-2 capitalize md:col-span-2">
                  <span className="badge badge-pill badge-primary">
                    {`${consultation?.suggestion === "A" ? "IP" : "OP"}: ${
                      consultation?.patient_no
                    }`}
                  </span>
                </span>
              )}
              {medicoLegalCase && (
                <span className="pl-2 capitalize md:col-span-2">
                  <span className="badge badge-pill badge-danger">MLC</span>
                </span>
              )}
            </div>
            {!!consultation?.discharge_date && (
              <p className="my-1 inline-block rounded-lg bg-red-100 px-2 py-1 text-sm text-red-600">
                Discharged from CARE
              </p>
            )}
            <div className="flex flex-col items-center gap-2 text-sm sm:flex-row lg:mt-4">
              <div className="flex flex-col items-center gap-2 text-sm text-gray-900 sm:flex-row sm:text-sm">
                {patient.action && patient.action != 10 && (
                  <div>
                    <div className="inline-flex w-full items-center justify-start rounded-lg border border-gray-500 bg-blue-700 p-1 px-3 text-xs font-semibold leading-4">
                      <span className="font-semibold text-white">
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
                  <div className="inline-flex w-full items-center justify-start rounded-lg border border-gray-500 bg-gray-200 p-1 px-3 text-xs font-semibold leading-4">
                    <b>Age</b>: {patient.age} years
                  </div>
                </div>
                <div>
                  <div className="inline-flex w-full items-center justify-start rounded-lg border border-gray-500 bg-gray-200 p-1 px-3 text-xs font-semibold leading-4">
                    <b>Gender</b>: {patient.gender}
                  </div>
                </div>
                {consultation?.suggestion === "DC" && (
                  <div>
                    <div>
                      <div className="inline-flex w-full items-center justify-start rounded-lg border border-gray-500 bg-gray-200 p-1 px-3 text-xs font-semibold leading-4">
                        <span>Domiciliary Care</span>
                        <CareIcon className="care-l-estate text-base text-gray-700" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-sm sm:flex-row lg:mt-4">
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
                    {formatDateTime(
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
                        Discharged on{" "}
                        {formatDateTime(consultation?.discharge_date)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {consultation?.last_daily_round && (
          <div className="flex w-full justify-center bg-white px-4 py-2 lg:w-5/12 lg:flex-row lg:justify-end lg:p-6">
            <Mews dailyRound={consultation?.last_daily_round} />
          </div>
        )}

        <div className="flex w-full flex-col gap-2 px-4 py-1 lg:w-fit lg:p-6">
          {!!consultation?.discharge_date && (
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm font-normal leading-5 text-gray-500">
                Discharge Reason
              </div>
              <div className="mt-1 text-xl font-semibold leading-5 text-gray-900">
                {!consultation?.discharge_reason ? (
                  <span className="text-gray-800">
                    {consultation.suggestion === "OP"
                      ? "OP file closed"
                      : "UNKNOWN"}
                  </span>
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
          ].map(
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
                    <span className="flex w-full items-center justify-center gap-2 lg:justify-start">
                      <CareIcon className={`care-l-${action[2]} text-lg`} />
                      <p className="font-semibold">{action[1]}</p>
                    </span>
                  </ButtonV2>
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
          <DropdownMenu
            id="show-more"
            itemClassName="min-w-0 sm:min-w-[225px]"
            title={"Show More"}
            icon={<CareIcon icon="l-sliders-v-alt" />}
          >
            <div>
              {[
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
                            consultation?.admitted &&
                            !consultation?.current_bed &&
                            i === 1
                              ? ""
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
    </>
  );
}
