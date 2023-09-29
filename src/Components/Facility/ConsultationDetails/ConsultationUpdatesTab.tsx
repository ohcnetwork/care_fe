import { lazy, useEffect, useState } from "react";
import { ConsultationTabProps } from "./index";
import { AssetBedModel, AssetClass, AssetData } from "../../Assets/AssetTypes";
import { useDispatch } from "react-redux";
import { getPermittedFacility, listAssetBeds } from "../../../Redux/actions";
import { BedModel, FacilityModel } from "../models";
import HL7PatientVitalsMonitor from "../../VitalsMonitor/HL7PatientVitalsMonitor";
import VentilatorPatientVitalsMonitor from "../../VitalsMonitor/VentilatorPatientVitalsMonitor";
import useVitalsAspectRatioConfig from "../../VitalsMonitor/useVitalsAspectRatioConfig";
import { DISCHARGE_REASONS, SYMPTOM_CHOICES } from "../../../Common/constants";
import PrescriptionsTable from "../../Medicine/PrescriptionsTable";
import Chip from "../../../CAREUI/display/Chip";
import { formatAge, formatDate, formatDateTime } from "../../../Utils/utils";
import ReadMore from "../../Common/components/Readmore";
import { DailyRoundsList } from "../Consultations/DailyRoundsList";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationUpdatesTab = (props: ConsultationTabProps) => {
  const dispatch: any = useDispatch();
  const [showAutomatedRounds, setShowAutomatedRounds] = useState(true);
  const [hl7SocketUrl, setHL7SocketUrl] = useState<string>();
  const [ventilatorSocketUrl, setVentilatorSocketUrl] = useState<string>();
  const [monitorBedData, setMonitorBedData] = useState<AssetBedModel>();
  const [ventilatorBedData, setVentilatorBedData] = useState<AssetBedModel>();

  const vitals = useVitalsAspectRatioConfig({
    default: undefined,
    md: 8 / 11,
    lg: 15 / 11,
    xl: 13 / 11,
    "2xl": 19 / 11,
    "3xl": 23 / 11,
  });

  useEffect(() => {
    if (
      !props.consultationData.facility ||
      !props.consultationData.current_bed?.bed_object.id
    )
      return;

    const fetchData = async () => {
      const [facilityRes, assetBedRes] = await Promise.all([
        dispatch(getPermittedFacility(props.consultationData.facility as any)),
        dispatch(
          listAssetBeds({
            facility: props.consultationData.facility as any,
            bed: props.consultationData.current_bed?.bed_object.id,
          })
        ),
      ]);

      const { middleware_address } = facilityRes.data as FacilityModel;
      const assetBeds = assetBedRes?.data?.results as AssetBedModel[];

      const monitorBedData = assetBeds?.find(
        (i) => i.asset_object?.asset_class === AssetClass.HL7MONITOR
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

      const consultationBedVentilator =
        props.consultationData?.current_bed?.assets_objects?.find(
          (i) => i.asset_class === AssetClass.VENTILATOR
        );
      let ventilatorBedData;
      if (consultationBedVentilator) {
        ventilatorBedData = {
          asset_object: consultationBedVentilator,
          bed_object: props.consultationData?.current_bed?.bed_object,
        } as AssetBedModel;
      } else {
        ventilatorBedData = assetBeds?.find(
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
  }, [props.consultationData]);

  return (
    <div className="flex flex-col gap-2">
      {!props.consultationData.discharge_date &&
        hl7SocketUrl &&
        ventilatorSocketUrl && (
          <section className="flex w-full flex-col items-stretch overflow-auto rounded-md bg-white shadow-sm lg:flex-row">
            <div className="mx-auto flex w-full flex-col justify-between gap-1 rounded bg-[#020617] lg:w-auto lg:min-w-[1280px] lg:flex-row">
              <div className="min-h-[400px] flex-1">
                <HL7PatientVitalsMonitor
                  patientAssetBed={{
                    asset: monitorBedData?.asset_object as AssetData,
                    bed: monitorBedData?.bed_object as BedModel,
                    patient: props.patientData,
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
                    patient: props.patientData,
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
                            patientAssetBed={{
                              asset: monitorBedData?.asset_object as AssetData,
                              bed: monitorBedData?.bed_object as BedModel,
                              patient: props.patientData,
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
                              patient: props.patientData,
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
            {props.consultationData.discharge_date && (
              <div
                className={`gap-4 overflow-hidden rounded-lg bg-white shadow ${
                  props.consultationData.discharge_reason === "REC" &&
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
                            d.id === props.consultationData.discharge_reason
                        )?.text ?? "--"}
                      </span>
                    </div>
                    {props.consultationData.discharge_reason === "REF" && (
                      <div>
                        Referred Facility {" - "}
                        <span className="font-semibold">
                          {props.consultationData.referred_to_external ||
                            props.consultationData.referred_to_object?.name ||
                            "--"}
                        </span>
                      </div>
                    )}
                    {props.consultationData.discharge_reason === "REC" && (
                      <div className="grid gap-4">
                        <div>
                          Discharge Date {" - "}
                          <span className="font-semibold">
                            {props.consultationData.discharge_date
                              ? formatDate(
                                  props.consultationData.discharge_date
                                )
                              : "--/--/----"}
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
                            consultation_id={props.consultationData.id ?? ""}
                            is_prn={false}
                            readonly
                            prescription_type="DISCHARGE"
                          />
                        </div>
                        <hr className="my-2 border border-gray-300"></hr>
                        <div className="overflow-x-auto overflow-y-hidden">
                          <PrescriptionsTable
                            consultation_id={props.consultationData.id ?? ""}
                            is_prn
                            readonly
                            prescription_type="DISCHARGE"
                          />
                        </div>
                      </div>
                    )}
                    {props.consultationData.discharge_reason === "EXP" && (
                      <div className="grid gap-4">
                        <div>
                          Date of Death {" - "}
                          <span className="font-semibold">
                            {props.consultationData.death_datetime
                              ? formatDateTime(
                                  props.consultationData.death_datetime
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
                    {["REF", "LAMA"].includes(
                      props.consultationData.discharge_reason ?? ""
                    ) && (
                      <div className="grid gap-4">
                        <div>
                          Discharge Date {" - "}
                          <span className="font-semibold">
                            {props.consultationData.discharge_date
                              ? formatDate(
                                  props.consultationData.discharge_date
                                )
                              : "--/--/----"}
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
            {props.consultationData.symptoms_text && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold leading-relaxed text-gray-900">
                    Symptoms
                  </h3>
                  <div className="">
                    <div className="text-sm font-semibold uppercase">
                      Last Daily Update
                    </div>
                    {props.consultationData.last_daily_round
                      ?.additional_symptoms && (
                      <>
                        <div className="my-4 flex flex-wrap items-center gap-2">
                          {props.consultationData.last_daily_round?.additional_symptoms.map(
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
                        {props.consultationData.last_daily_round
                          ?.other_symptoms && (
                          <div className="capitalize">
                            <div className="text-xs font-semibold">
                              Other Symptoms:
                            </div>
                            {
                              props.consultationData.last_daily_round
                                ?.other_symptoms
                            }
                          </div>
                        )}
                        <span className="text-xs font-semibold leading-relaxed text-gray-800">
                          from{" "}
                          {formatDate(
                            props.consultationData.last_daily_round.created_at
                          )}
                        </span>
                      </>
                    )}
                    <hr className="my-4 border border-gray-300" />
                    <div className="text-sm font-semibold uppercase">
                      Consultation Update
                    </div>
                    <div className="my-4 flex flex-wrap items-center gap-2">
                      {props.consultationData.symptoms?.map(
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
                    {props.consultationData.other_symptoms && (
                      <div className="capitalize">
                        <div className="text-xs font-semibold">
                          Other Symptoms:
                        </div>
                        {props.consultationData.other_symptoms}
                      </div>
                    )}
                    <span className="text-xs font-semibold leading-relaxed text-gray-800">
                      from{" "}
                      {props.consultationData.symptoms_onset_date
                        ? formatDate(props.consultationData.symptoms_onset_date)
                        : "--/--/----"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {props.consultationData.history_of_present_illness && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
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
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
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
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
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
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
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
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
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
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          {props.consultationData.intubation_start_date && (
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
                        props.consultationData.intubation_start_date
                      )}
                    </span>
                  </div>
                  <div className="">
                    Extubation Date{" - "}
                    <span className="font-semibold">
                      {props.consultationData.intubation_end_date &&
                        formatDateTime(
                          props.consultationData.intubation_end_date
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
                <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
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
                    {props.patientData.gender ?? "-"}
                  </span>
                </div>
                <div>
                  Age {" - "}
                  <span className="font-semibold">
                    {props.patientData.age !== undefined // 0 is a valid age, so we need to check for undefined
                      ? formatAge(
                          props.patientData.age,
                          props.patientData.date_of_birth
                        )
                      : "-"}
                  </span>
                </div>
                <div>
                  Weight {" - "}
                  <span className="font-semibold">
                    {props.consultationData.weight ?? "-"} Kg
                  </span>
                </div>
                <div>
                  Height {" - "}
                  <span className="font-semibold">
                    {props.consultationData.height ?? "-"} cm
                  </span>
                </div>
                <div>
                  Body Surface Area {" - "}
                  <span className="font-semibold">
                    {Math.sqrt(
                      (Number(props.consultationData.weight) *
                        Number(props.consultationData.height)) /
                        3600
                    ).toFixed(2)}{" "}
                    m<sup>2</sup>
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
            facilityId={props.facilityId}
            patientId={props.patientId}
            consultationId={props.consultationId}
            consultationData={props.consultationData}
            showAutomatedRounds={showAutomatedRounds}
          />
        </div>
      </div>
    </div>
  );
};
