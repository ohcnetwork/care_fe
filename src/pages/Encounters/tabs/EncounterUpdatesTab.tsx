import ObservationsList from "@/components/Facility/ConsultationDetails/ObservationsList";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterUpdatesTab = (props: EncounterTabProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col xl:flex-row w-full">
        <div className="mt-4 grid gap-4 lg:grid-cols-2 w-full">
          <div className="md:col-span-2">
            <SymptomsList
              patientId={props.patient.id}
              encounterId={props.encounter.id}
            />
          </div>
          <div className="md:col-span-2">
            <DiagnosisList
              patientId={props.patient.id}
              encounterId={props.encounter.id}
            />
          </div>
          <div className="md:col-span-2">
            <QuestionnaireResponsesList encounter={props.encounter} />
          </div>
        </div>
        {/* <div className="w-full xl:w-2/3" id="basic-information">
          <PageTitle
            title="Basic Information"
            hideBack={true}
            breadcrumbs={false}
          />



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
        </div> */}
        <div className="w-full pl-0 md:pl-4 xl:w-1/3">
          <ObservationsList encounter={props.encounter} />
        </div>
      </div>
    </div>
  );
};
