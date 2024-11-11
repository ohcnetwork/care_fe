import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AssetBedModel,
  AssetClass,
  AssetData,
} from "@/components/Assets/AssetTypes";
import ButtonV2 from "@/components/Common/ButtonV2";
import PageTitle from "@/components/Common/PageTitle";
import ReadMore from "@/components/Common/Readmore";
import Tabs from "@/components/Common/Tabs";
import EventsList from "@/components/Facility/ConsultationDetails/Events/EventsList";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import DailyRoundsFilter from "@/components/Facility/Consultations/DailyRoundsFilter";
import DailyRoundsList from "@/components/Facility/Consultations/DailyRoundsList";
import { BedModel } from "@/components/Facility/models";
import PrescriptionsTable from "@/components/Medicine/PrescriptionsTable";
import EncounterSymptomsCard from "@/components/Symptoms/SymptomsCard";
import HL7PatientVitalsMonitor from "@/components/VitalsMonitor/HL7PatientVitalsMonitor";
import VentilatorPatientVitalsMonitor from "@/components/VitalsMonitor/VentilatorPatientVitalsMonitor";
import useVitalsAspectRatioConfig from "@/components/VitalsMonitor/useVitalsAspectRatioConfig";
import { getVitalsMonitorSocketUrl } from "@/components/VitalsMonitor/utils";

import { DISCHARGE_REASONS } from "@/common/constants";
import { EVENTS_SORT_OPTIONS } from "@/common/constants";

import routes from "@/Utils/request/api";
import { QueryParams } from "@/Utils/request/types";
import useQuery from "@/Utils/request/useQuery";
import {
  formatDate,
  formatDateTime,
  formatPatientAge,
  isAntenatal,
  isPostPartum,
} from "@/Utils/utils";
import { classNames } from "@/Utils/utils";

export const ConsultationUpdatesTab = (props: ConsultationTabProps) => {
  const [hl7SocketUrl, setHL7SocketUrl] = useState<string>();
  const [ventilatorSocketUrl, setVentilatorSocketUrl] = useState<string>();
  const [monitorBedData, setMonitorBedData] = useState<AssetBedModel>();
  const [ventilatorBedData, setVentilatorBedData] = useState<AssetBedModel>();
  const [showEvents, setShowEvents] = useState(true);
  const [eventsQuery, setEventsQuery] = useState<QueryParams>();
  const [dailyRoundsQuery, setDailyRoundsQuery] = useState<QueryParams>();
  const { t } = useTranslation();

  const vitals = useVitalsAspectRatioConfig({
    default: undefined,
    md: 8 / 11,
    lg: 15 / 11,
    xl: 13 / 11,
    "2xl": 19 / 11,
    "3xl": 23 / 11,
  });

  useQuery(routes.listAssetBeds, {
    prefetch: !!(
      props.consultationData.facility &&
      props.consultationData.current_bed?.bed_object.id
    ),
    query: {
      facility: props.consultationData.facility as any,
      bed: props.consultationData.current_bed?.bed_object.id,
    },
    onResponse({ data }) {
      if (!data) return;
      const assetBeds = data.results;

      const monitorBedData = assetBeds?.find(
        (i) => i.asset_object?.asset_class === AssetClass.HL7MONITOR,
      );

      setMonitorBedData(monitorBedData);
      if (monitorBedData?.asset_object) {
        setHL7SocketUrl(
          getVitalsMonitorSocketUrl(monitorBedData?.asset_object),
        );
      }

      const consultationBedVentilator =
        props.consultationData?.current_bed?.assets_objects?.find(
          (i) => i.asset_class === AssetClass.VENTILATOR,
        );

      let ventilatorBedData;
      if (consultationBedVentilator) {
        ventilatorBedData = {
          asset_object: consultationBedVentilator,
          bed_object: props.consultationData?.current_bed?.bed_object,
        } as AssetBedModel;
      } else {
        ventilatorBedData = assetBeds?.find(
          (i) => i.asset_object.asset_class === AssetClass.VENTILATOR,
        );
      }

      setVentilatorBedData(ventilatorBedData);
      if (ventilatorBedData?.asset_object) {
        setVentilatorSocketUrl(
          getVitalsMonitorSocketUrl(ventilatorBedData?.asset_object),
        );
      }
    },
  });

  return (
    <div className="flex flex-col gap-2">
      {!props.consultationData.discharge_date &&
        hl7SocketUrl &&
        ventilatorSocketUrl && (
          <section className="flex w-full flex-col items-stretch overflow-auto rounded-md bg-white shadow-sm lg:flex-row">
            <div className="mx-auto flex w-full flex-col justify-between gap-1 rounded bg-[#020617] lg:w-auto lg:min-w-[1280px] lg:flex-row">
              <div className="min-h-[400px] flex-1">
                <HL7PatientVitalsMonitor
                  patientCurrentBedAssignmentDate={
                    props.patientData?.last_consultation?.current_bed
                      ?.start_date
                  }
                  patientAssetBed={{
                    asset: monitorBedData?.asset_object as AssetData,
                    bed: monitorBedData?.bed_object as BedModel,
                    patient: props.patientData,
                    meta: monitorBedData?.asset_object?.meta,
                  }}
                  socketUrl={hl7SocketUrl}
                  hideHeader={true}
                />
              </div>
              <div className="min-h-[400px] flex-1">
                <VentilatorPatientVitalsMonitor
                  patientAssetBed={{
                    asset: ventilatorBedData?.asset_object as AssetData,
                    bed: ventilatorBedData?.bed_object as BedModel,
                    patient: props.patientData,
                    meta: ventilatorBedData?.asset_object?.meta,
                  }}
                  socketUrl={ventilatorSocketUrl}
                  hideHeader={true}
                />
              </div>
            </div>
          </section>
        )}
      <div className="flex flex-col xl:flex-row">
        <div className="w-full xl:w-2/3" id="basic-information">
          <PageTitle
            title="Basic Information"
            hideBack={true}
            breadcrumbs={false}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {!props.consultationData.discharge_date &&
              ((hl7SocketUrl && !ventilatorSocketUrl) ||
                (!hl7SocketUrl && ventilatorSocketUrl)) && (
                <section className="flex w-full flex-col items-stretch overflow-hidden rounded-md bg-white shadow-sm lg:col-span-2 lg:flex-row">
                  {(hl7SocketUrl || ventilatorSocketUrl) && (
                    <div className="mx-auto flex w-full flex-col justify-between gap-1 rounded bg-[#020617] lg:w-auto lg:min-w-[640px] lg:flex-row">
                      {hl7SocketUrl && (
                        <div className="min-h-[400px] flex-1">
                          <HL7PatientVitalsMonitor
                            key={`hl7-${hl7SocketUrl}-${vitals.hash}`}
                            patientCurrentBedAssignmentDate={
                              props.patientData?.last_consultation?.current_bed
                                ?.start_date
                            }
                            patientAssetBed={{
                              asset: monitorBedData?.asset_object as AssetData,
                              bed: monitorBedData?.bed_object as BedModel,
                              patient: props.patientData,
                              meta: monitorBedData?.asset_object?.meta,
                            }}
                            socketUrl={hl7SocketUrl}
                            config={vitals.config}
                            hideHeader={true}
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
                              patient: props.patientData,
                              meta: ventilatorBedData?.asset_object?.meta,
                            }}
                            socketUrl={ventilatorSocketUrl}
                            config={vitals.config}
                            hideHeader={true}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            {props.consultationData.discharge_date && (
              <div
                className={`gap-4 overflow-hidden rounded-lg bg-white shadow ${
                  props.consultationData.new_discharge_reason ===
                    DISCHARGE_REASONS.find((i) => i.text == "Recovered")?.id &&
                  "lg:col-span-2"
                }`}
              >
                <div className="px-4 py-5 sm:p-6" id="discharge-information">
                  <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                    Discharge Information
                  </h3>
                  <div className="mt-2 grid gap-4">
                    <div>
                      Reason {" - "}
                      <span className="font-semibold">
                        {DISCHARGE_REASONS.find(
                          (d) =>
                            d.id ===
                            props.consultationData.new_discharge_reason,
                        )?.text ?? "--"}
                      </span>
                    </div>
                    {props.consultationData.new_discharge_reason ===
                      DISCHARGE_REASONS.find((i) => i.text == "Referred")
                        ?.id && (
                      <div>
                        Referred Facility {" - "}
                        <span className="font-semibold">
                          {props.consultationData.referred_to_external ||
                            props.consultationData.referred_to_object?.name ||
                            "--"}
                        </span>
                      </div>
                    )}
                    {props.consultationData.new_discharge_reason ===
                      DISCHARGE_REASONS.find((i) => i.text == "Recovered")
                        ?.id && (
                      <div className="grid gap-4">
                        <div>
                          Discharge Date {" - "}
                          <span className="font-semibold">
                            {props.consultationData.discharge_date
                              ? formatDate(
                                  props.consultationData.discharge_date,
                                )
                              : "--/--/---- --:-- --"}
                          </span>
                        </div>
                        <div>
                          Advice {" - "}
                          <span className="font-semibold">
                            {props.consultationData.discharge_notes ?? "--"}
                          </span>
                        </div>
                        <div className="overflow-x-auto overflow-y-hidden">
                          <PrescriptionsTable
                            is_prn={false}
                            prescription_type="DISCHARGE"
                          />
                        </div>
                        <hr className="my-2 border border-secondary-300"></hr>
                        <div className="overflow-x-auto overflow-y-hidden">
                          <PrescriptionsTable
                            is_prn
                            prescription_type="DISCHARGE"
                          />
                        </div>
                      </div>
                    )}
                    {props.consultationData.new_discharge_reason ===
                      DISCHARGE_REASONS.find((i) => i.text == "Expired")
                        ?.id && (
                      <div className="grid gap-4">
                        <div>
                          Date of Death {" - "}
                          <span className="font-semibold">
                            {props.consultationData.death_datetime
                              ? formatDateTime(
                                  props.consultationData.death_datetime,
                                )
                              : "--:--"}
                          </span>
                        </div>
                        <div>
                          Cause of death {" - "}
                          <span className="font-semibold">
                            {props.consultationData.discharge_notes ?? "--"}
                          </span>
                        </div>
                        <div>
                          Confirmed By {" - "}
                          <span className="font-semibold">
                            {props.consultationData.death_confirmed_doctor ??
                              "--"}
                          </span>
                        </div>
                      </div>
                    )}
                    {[2, 4].includes(
                      props.consultationData.new_discharge_reason ?? 0,
                    ) && (
                      <div className="grid gap-4">
                        <div>
                          Discharge Date {" - "}
                          <span className="font-semibold">
                            {props.consultationData.discharge_date
                              ? formatDateTime(
                                  props.consultationData.discharge_date,
                                )
                              : "--/--/---- --:-- --"}
                          </span>
                        </div>
                        <div>
                          Notes {" - "}
                          <span className="font-semibold">
                            {props.consultationData.discharge_notes ?? "--"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-white px-4 py-5 shadow sm:p-6 md:col-span-2">
              <EncounterSymptomsCard />
            </div>

            {props.consultationData.history_of_present_illness && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6" id="history-presentillness">
                  <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                    History of Present Illness
                  </h3>
                  <div className="mt-2">
                    <ReadMore
                      text={props.consultationData.history_of_present_illness}
                      minChars={250}
                    />
                  </div>
                </div>
              </div>
            )}

            {props.consultationData.examination_details && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6" id="examination-details">
                  <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                    Examination details and Clinical conditions:{" "}
                  </h3>
                  <div className="mt-2">
                    <ReadMore
                      text={props.consultationData.examination_details}
                      minChars={250}
                    />
                  </div>
                </div>
              </div>
            )}
            {props.consultationData.treatment_plan && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6" id="treatment-summary">
                  <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                    Treatment Summary
                  </h3>
                  <div className="mt-2">
                    <ReadMore
                      text={props.consultationData.treatment_plan}
                      minChars={250}
                    />
                  </div>
                </div>
              </div>
            )}
            {props.consultationData.consultation_notes && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6" id="general-instructions">
                  <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                    General Instructions
                  </h3>
                  <div className="mt-2">
                    <ReadMore
                      text={props.consultationData.consultation_notes}
                      minChars={250}
                    />
                  </div>
                </div>
              </div>
            )}

            {(props.consultationData.operation ??
              props.consultationData.special_instruction) && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6" id="consultation-notes">
                  <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                    Notes
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {props.consultationData.operation && (
                      <div className="mt-4">
                        <h5>Operation</h5>
                        <ReadMore
                          text={props.consultationData.operation}
                          minChars={250}
                        />
                      </div>
                    )}

                    {props.consultationData.special_instruction && (
                      <div className="mt-4">
                        <h5>Special Instruction</h5>
                        <ReadMore
                          text={props.consultationData.special_instruction}
                          minChars={250}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {props.consultationData.procedure &&
            props.consultationData.procedure.length > 0 && (
              <div className="my-4 rounded-lg bg-white p-4 shadow">
                <div className="overflow-x-auto" id="consultation-procedure">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead>
                      <tr>
                        <th className="bg-secondary-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-secondary-600">
                          Procedure
                        </th>
                        <th className="bg-secondary-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-secondary-600">
                          Notes
                        </th>
                        <th className="bg-secondary-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-secondary-600">
                          Repetitive
                        </th>
                        <th className="bg-secondary-100 px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-secondary-600">
                          Time / Frequency
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200 bg-white">
                      {props.consultationData.procedure?.map(
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
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          {props.consultationData.intubation_start_date && (
            <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                  Date/Size/LL:{" "}
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="">
                    Intubation Date{" - "}
                    <span className="font-semibold">
                      {formatDateTime(
                        props.consultationData.intubation_start_date,
                      )}
                    </span>
                  </div>
                  <div className="">
                    Extubation Date{" - "}
                    <span className="font-semibold">
                      {props.consultationData.intubation_end_date &&
                        formatDateTime(
                          props.consultationData.intubation_end_date,
                        )}
                    </span>
                  </div>
                  <div className="">
                    ETT/TT (mmid){" - "}
                    <span className="font-semibold">
                      {props.consultationData.ett_tt}
                    </span>
                  </div>
                  <div className="">
                    Cuff Pressure (mmhg){" - "}
                    <span className="font-semibold">
                      {props.consultationData.cuff_pressure}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {props.consultationData.lines?.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                  Lines and Catheters
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {props.consultationData.lines?.map(
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
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="col-span-1 mt-4 overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-relaxed text-secondary-900">
                  Body Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    Gender {" - "}
                    <span className="font-semibold">
                      {props.patientData.gender ?? "-"}
                    </span>
                  </div>
                  <div>
                    Age {" - "}
                    <span className="font-semibold">
                      {formatPatientAge(props.patientData)}
                    </span>
                  </div>
                  <div id="patient-weight">
                    Weight {" - "}
                    <span className="font-semibold">
                      {props.consultationData.weight
                        ? `${props.consultationData.weight} kg`
                        : "Unspecified"}
                    </span>
                  </div>
                  <div id="patient-height">
                    Height {" - "}
                    <span className="font-semibold">
                      {props.consultationData.height
                        ? `${props.consultationData.height} cm`
                        : "Unspecified"}
                    </span>
                  </div>
                  <div>
                    Body Surface Area {" - "}
                    <span className="font-semibold">
                      {props.consultationData.weight &&
                      props.consultationData.height ? (
                        <>
                          {Math.sqrt(
                            (Number(props.consultationData.weight) *
                              Number(props.consultationData.height)) /
                              3600,
                          ).toFixed(2)}
                          m<sup>2</sup>
                        </>
                      ) : (
                        "Unspecified"
                      )}
                    </span>
                  </div>
                  <div>
                    Blood Group {" - "}
                    <span className="font-semibold">
                      {props.patientData.blood_group ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {((props.patientData.is_antenatal &&
              isAntenatal(props.patientData.last_menstruation_start_date)) ||
              isPostPartum(props.patientData.date_of_delivery)) && (
              <div className="mt-4 rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                <h3 className="mb-4 text-lg font-semibold leading-relaxed text-secondary-900">
                  Perinatal Status
                </h3>

                <div className="flex gap-2 pb-2">
                  {props.patientData.is_antenatal &&
                    isAntenatal(
                      props.patientData.last_menstruation_start_date,
                    ) && (
                      <Chip
                        variant="custom"
                        className="border-pink-300 bg-pink-100 text-pink-600"
                        startIcon="l-baby-carriage"
                        text="Antenatal"
                      />
                    )}
                  {isPostPartum(props.patientData.date_of_delivery) && (
                    <Chip
                      variant="custom"
                      className="border-pink-300 bg-pink-100 text-pink-600"
                      startIcon="l-baby-carriage"
                      text="Post-partum"
                    />
                  )}
                </div>

                {props.patientData.last_menstruation_start_date && (
                  <p className="space-x-2 p-2 text-sm">
                    <CareIcon className="text-base" icon="l-calendar-alt" />
                    <span>Last Menstruation:</span>
                    <span className="font-semibold">
                      {formatDate(
                        props.patientData.last_menstruation_start_date,
                      )}
                    </span>
                  </p>
                )}

                {props.patientData.date_of_delivery && (
                  <p className="space-x-2 p-2 text-sm">
                    <CareIcon className="text-base" icon="l-calendar-alt" />
                    <span>Date of Delivery:</span>
                    <span className="font-semibold">
                      {formatDate(props.patientData.date_of_delivery)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="w-full pl-0 md:pl-4 xl:w-1/3">
          <div className="flex items-center">
            <Tabs
              className="mr-2 mt-3 w-full lg:w-full"
              tabs={[
                {
                  text: (
                    <div className="flex items-center justify-center gap-1 text-sm">
                      {t("events")}
                      <span className="rounded-lg bg-warning-400 p-px px-1 text-xs text-white">
                        {t("beta")}
                      </span>
                    </div>
                  ),
                  value: 1,
                },
                { text: t("daily_rounds"), value: 0 },
              ]}
              onTabChange={(v) => setShowEvents(!!v)}
              currentTab={showEvents ? 1 : 0}
            />
            {showEvents ? (
              <Popover className="relative mt-3">
                <PopoverButton>
                  <ButtonV2
                    className="border p-3"
                    variant={eventsQuery?.ordering ? "primary" : "secondary"}
                  >
                    <CareIcon icon="l-filter" />
                  </ButtonV2>
                </PopoverButton>
                <Transition
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <PopoverPanel className="absolute right-0 z-30">
                    <div className="rounded-lg shadow-lg ring-1 ring-secondary-400">
                      <div className="relative flex flex-col rounded-b-lg bg-white">
                        {EVENTS_SORT_OPTIONS.map(({ isAscending, value }) => {
                          return (
                            <div
                              className={classNames(
                                "dropdown-item-primary pointer-events-auto m-2 flex w-56 cursor-pointer items-center justify-start gap-3 rounded border-0 px-4 py-2 text-sm font-normal transition-all duration-200 ease-in-out",
                                eventsQuery?.ordering?.toString() === value
                                  ? "bg-primary-100 !font-medium text-primary-500"
                                  : "",
                              )}
                              onClick={() => {
                                setEventsQuery({
                                  ordering: value,
                                });
                              }}
                            >
                              <CareIcon
                                className="text-primary-600"
                                icon={
                                  isAscending
                                    ? "l-sort-amount-up"
                                    : "l-sort-amount-down"
                                }
                              />
                              <span>{t("SORT_OPTIONS__" + value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverPanel>
                </Transition>
              </Popover>
            ) : (
              <DailyRoundsSortDropdown
                setDailyRoundsQuery={setDailyRoundsQuery}
              />
            )}
          </div>

          {showEvents ? (
            <EventsList query={eventsQuery!} />
          ) : (
            <DailyRoundsList
              consultation={props.consultationData}
              query={dailyRoundsQuery!}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function DailyRoundsSortDropdown({
  setDailyRoundsQuery,
}: {
  setDailyRoundsQuery: (query: QueryParams) => void;
}) {
  return (
    <DailyRoundsFilter
      onApply={(query) => {
        setDailyRoundsQuery(query);
      }}
    />
  );
}
