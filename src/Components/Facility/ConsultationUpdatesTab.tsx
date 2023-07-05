import { ConsultationTabProps } from "../../Common/constants";
import HL7PatientVitalsMonitor from "../VitalsMonitor/HL7PatientVitalsMonitor";
import loadable from "@loadable/component";
import VentilatorPatientVitalsMonitor from "../VitalsMonitor/VentilatorPatientVitalsMonitor";
const PageTitle = loadable(() => import("../Common/PageTitle"));
import PrescriptionsTable from "../Medicine/PrescriptionsTable";
import Chip from "../../CAREUI/display/Chip";
import { DISCHARGE_REASONS, SYMPTOM_CHOICES } from "../../Common/constants";
import moment from "moment";
import ReadMore from "../Common/components/Readmore";
import { formatDate } from "../../Utils/utils";
import { DailyRoundsList } from "./Consultations/DailyRoundsList";
import { useState } from "react";

export default function ConsultationUpdatesTab({
  consultationData,
  hl7SocketUrl,
  ventilatorSocketUrl,
  patientData,
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  const [showAutomatedRounds, setShowAutomatedRounds] = useState(true);
  return (
    <>
      <div className="flex flex-col gap-2">
        {!consultationData.discharge_date &&
          hl7SocketUrl &&
          ventilatorSocketUrl && (
            <section className="bg-white shadow-sm rounded-md flex items-stretch w-full flex-col lg:flex-row overflow-hidden">
              <div className="flex flex-col lg:flex-row bg-slate-800 gap-1 justify-between rounded mx-auto">
                <div className="flex-1 min-h-[400px]">
                  <HL7PatientVitalsMonitor socketUrl={hl7SocketUrl} />
                </div>
                <div className="flex-1 min-h-[400px]">
                  <VentilatorPatientVitalsMonitor
                    socketUrl={ventilatorSocketUrl}
                  />
                </div>
              </div>
            </section>
          )}
        <div className="flex xl:flex-row flex-col">
          <div className="xl:w-2/3 w-full">
            <PageTitle title="Info" hideBack={true} breadcrumbs={false} />
            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              {!consultationData.discharge_date &&
                ((hl7SocketUrl && !ventilatorSocketUrl) ||
                  (!hl7SocketUrl && ventilatorSocketUrl)) && (
                  <section className="lg:col-span-2 bg-white shadow-sm rounded-md flex items-stretch w-full flex-col lg:flex-row overflow-hidden">
                    {(hl7SocketUrl || ventilatorSocketUrl) && (
                      <div className="flex flex-col lg:flex-row bg-slate-800 gap-1 justify-between rounded mx-auto">
                        {hl7SocketUrl && (
                          <div className="flex-1 min-h-[400px]">
                            <HL7PatientVitalsMonitor socketUrl={hl7SocketUrl} />
                          </div>
                        )}
                        {ventilatorSocketUrl && (
                          <div className="flex-1 min-h-[400px]">
                            <VentilatorPatientVitalsMonitor
                              socketUrl={ventilatorSocketUrl}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}
              {consultationData.discharge_date && (
                <div
                  className={`bg-white overflow-hidden shadow rounded-lg gap-4 ${
                    consultationData.discharge_reason === "REC" &&
                    "lg:col-span-2"
                  }`}
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Discharge Information
                    </h3>
                    <div className="grid gap-4 mt-2">
                      <div>
                        Reason {" - "}
                        <span className="font-semibold">
                          {DISCHARGE_REASONS.find(
                            (d) => d.id === consultationData.discharge_reason
                          )?.text || "--"}
                        </span>
                      </div>
                      {consultationData.discharge_reason === "REC" && (
                        <div className="grid gap-4">
                          <div>
                            Discharge Date {" - "}
                            <span className="font-semibold">
                              {consultationData.discharge_date
                                ? formatDate(
                                    consultationData.discharge_date,
                                    "DD/MM/YYYY"
                                  )
                                : "--:--"}
                            </span>
                          </div>
                          <div>
                            Advice {" - "}
                            <span className="font-semibold">
                              {consultationData.discharge_notes || "--"}
                            </span>
                          </div>
                          <div className="overflow-x-auto overflow-y-hidden">
                            <PrescriptionsTable
                              consultation_id={consultationData.id}
                              is_prn={false}
                              readonly
                              prescription_type="DISCHARGE"
                            />
                          </div>
                          <hr className="border border-gray-300 my-2"></hr>
                          <div className="overflow-x-auto overflow-y-hidden">
                            <PrescriptionsTable
                              consultation_id={consultationData.id}
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
                                ? formatDate(consultationData.death_datetime)
                                : "--:--"}
                            </span>
                          </div>
                          <div>
                            Cause of death {" - "}
                            <span className="font-semibold">
                              {consultationData.discharge_notes || "--"}
                            </span>
                          </div>
                          <div>
                            Confirmed By {" - "}
                            <span className="font-semibold">
                              {consultationData.death_confirmed_doctor || "--"}
                            </span>
                          </div>
                        </div>
                      )}
                      {["REF", "LAMA"].includes(
                        consultationData.discharge_reason || ""
                      ) && (
                        <div className="grid gap-4">
                          <div>
                            Discharge Date {" - "}
                            <span className="font-semibold">
                              {consultationData.discharge_date
                                ? formatDate(
                                    consultationData.discharge_date,
                                    "DD/MM/YYYY"
                                  )
                                : "--:--"}
                            </span>
                          </div>
                          <div>
                            Notes {" - "}
                            <span className="font-semibold">
                              {consultationData.discharge_notes || "--"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {consultationData.symptoms_text && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900 mb-4">
                      Symptoms
                    </h3>
                    <div className="">
                      <div className="font-semibold uppercase text-sm">
                        Last Daily Update
                      </div>
                      {consultationData.last_daily_round
                        ?.additional_symptoms && (
                        <>
                          <div className="flex flex-wrap items-center gap-2 my-4">
                            {consultationData.last_daily_round?.additional_symptoms.map(
                              (symptom: any, index: number) => (
                                <Chip
                                  key={index}
                                  text={
                                    SYMPTOM_CHOICES.find(
                                      (choice) => choice.id === symptom
                                    )?.text || "Err. Unknown"
                                  }
                                  color={"primary"}
                                  size={"small"}
                                />
                              )
                            )}
                          </div>
                          {consultationData.last_daily_round
                            ?.other_symptoms && (
                            <div className="capitalize">
                              <div className="font-semibold text-xs">
                                Other Symptoms:
                              </div>
                              {
                                consultationData.last_daily_round
                                  ?.other_symptoms
                              }
                            </div>
                          )}
                          <span className="font-semibold leading-relaxed text-gray-800 text-xs">
                            from{" "}
                            {moment(
                              consultationData.last_daily_round.created_at
                            ).format("DD/MM/YYYY")}
                          </span>
                        </>
                      )}
                      <hr className="border border-gray-300 my-4" />
                      <div className="font-semibold uppercase text-sm">
                        Consultation Update
                      </div>
                      <div className="flex flex-wrap items-center gap-2 my-4">
                        {consultationData.symptoms?.map((symptom, index) => (
                          <Chip
                            key={index}
                            text={
                              SYMPTOM_CHOICES.find(
                                (choice) => choice.id === symptom
                              )?.text || "Err. Unknown"
                            }
                            color={"primary"}
                            size={"small"}
                          />
                        ))}
                      </div>
                      {consultationData.other_symptoms && (
                        <div className="capitalize">
                          <div className="font-semibold text-xs">
                            Other Symptoms:
                          </div>
                          {consultationData.other_symptoms}
                        </div>
                      )}
                      <span className="font-semibold leading-relaxed text-gray-800 text-xs">
                        from{" "}
                        {consultationData.symptoms_onset_date
                          ? moment(consultationData.symptoms_onset_date).format(
                              "DD/MM/YYYY"
                            )
                          : "--:--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {consultationData.history_of_present_illness && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
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
                <div className="bg-white overflow-hidden shadow rounded-lg">
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
                <div className="bg-white overflow-hidden shadow rounded-lg">
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
                <div className="bg-white overflow-hidden shadow rounded-lg">
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

              {(consultationData.operation ||
                consultationData.special_instruction) && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Notes
                    </h3>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                <div className="bg-white rounded-lg shadow my-4 p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 bg-gray-100 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                            Procedure
                          </th>
                          <th className="py-3 px-4 bg-gray-100 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                            Notes
                          </th>
                          <th className="py-3 px-4 bg-gray-100 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                            Repetitive
                          </th>
                          <th className="py-3 px-4 bg-gray-100 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                            Time / Frequency
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {consultationData.procedure?.map((procedure, index) => (
                          <tr key={index}>
                            <td className="p-4 whitespace-nowrap overflow-hidden">
                              {procedure.procedure}
                            </td>
                            <td className="p-4 whitespace-normal overflow-hidden">
                              {procedure.notes}
                            </td>
                            <td className="p-4 whitespace-normal overflow-hidden">
                              {procedure.repetitive ? "Yes" : "No"}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {procedure.repetitive
                                ? procedure.frequency
                                : formatDate(String(procedure.time))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            {consultationData.intubation_start_date && (
              <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                    Date/Size/LL:{" "}
                  </h3>
                  <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="">
                      Intubation Date{" - "}
                      <span className="font-semibold">
                        {formatDate(consultationData.intubation_start_date)}
                      </span>
                    </div>
                    <div className="">
                      Extubation Date{" - "}
                      <span className="font-semibold">
                        {consultationData.intubation_end_date &&
                          formatDate(consultationData.intubation_end_date)}
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
              <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                    Lines and Catheters
                  </h3>
                  <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                    {consultationData.lines?.map((line: any, idx: number) => (
                      <div key={idx} className="mt-4">
                        <h5>{line.type}</h5>
                        <p className="text-justify break-word">
                          Details:
                          <br />
                          <span>{line.other_type}</span>
                        </p>
                        <p>
                          Insertion Date:{" "}
                          <span className="font-semibold">
                            {formatDate(line.start_date)}
                          </span>
                        </p>
                        <p>
                          Site/Level of Fixation: <br />
                          <span className="text-justify break-word">
                            {line.site}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                  Body Details
                </h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div>
                    Gender {" - "}
                    <span className="font-semibold">
                      {patientData.gender || "-"}
                    </span>
                  </div>
                  <div>
                    Age {" - "}
                    <span className="font-semibold">
                      {patientData.age || "-"}
                    </span>
                  </div>
                  <div>
                    Weight {" - "}
                    <span className="font-semibold">
                      {consultationData.weight || "-"} Kg
                    </span>
                  </div>
                  <div>
                    Height {" - "}
                    <span className="font-semibold">
                      {consultationData.height || "-"} cm
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
                      {patientData.blood_group || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:w-1/3 w-full pl-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <PageTitle title="Update Log" hideBack breadcrumbs={false} />
              <div className="md:mb-[0.125rem] mb-[2rem] pl-[1.5rem]">
                <input
                  className="relative float-left mt-[0.15rem] mr-[6px] -ml-[1.5rem] h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-[rgba(0,0,0,0.25)] bg-white outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:ml-[0.25rem] checked:after:-mt-px checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-t-0 checked:after:border-l-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:bg-white focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:ml-[0.25rem] checked:focus:after:-mt-px checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-t-0 checked:focus:after:border-l-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent"
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
    </>
  );
}
