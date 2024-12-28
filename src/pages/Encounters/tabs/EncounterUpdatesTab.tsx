import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import ButtonV2 from "@/components/Common/ButtonV2";
import Tabs from "@/components/Common/Tabs";
import ObservationsList from "@/components/Facility/ConsultationDetails/ObservationsList";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import { QueryParams } from "@/Utils/request/types";
import { classNames } from "@/Utils/utils";
import { formatDateTime } from "@/Utils/utils";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterUpdatesTab = (props: EncounterTabProps) => {
  const [showObservations, setShowObservations] = useState(true);
  const [observationsQuery, setObservationsQuery] = useState<QueryParams>();

  function getStatusColor(status: string) {
    const statusColors = {
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      discharged: "bg-purple-100 text-purple-800 border-purple-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      on_hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
      // Add other statuses as needed
    };
    return (
      statusColors[status as keyof typeof statusColors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col xl:flex-row w-full">
        <div className="mt-4 grid gap-4 lg:grid-cols-2 w-full">
          <Card className="pt-4 col-span-2">
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge
                      className={`${getStatusColor(props.encounter.status)}`}
                    >
                      {props.encounter.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Class</span>
                    <span className="text-sm font-medium">
                      {props.encounter.encounter_class.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Priority
                    </span>
                    <span className="text-sm font-medium">
                      {props.encounter.priority}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Start Date
                    </span>
                    <span className="text-sm font-medium">
                      {props.encounter.period.start
                        ? formatDateTime(props.encounter.period.start)
                        : "Not started"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      End Date
                    </span>
                    <span className="text-sm font-medium">
                      {props.encounter.period.end
                        ? formatDateTime(props.encounter.period.end)
                        : "Ongoing"}
                    </span>
                  </div>
                  {props.encounter.external_identifier && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        External ID
                      </span>
                      <span className="text-sm font-medium">
                        {props.encounter.external_identifier}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
          <div className="flex items-center">
            <Tabs
              className="mr-2 mt-3 w-full lg:w-full"
              tabs={[
                {
                  text: "Observations",
                  value: 1,
                },
                { text: "Questionnaire Responses", value: 0 },
              ]}
              onTabChange={(v) => setShowObservations(!!v)}
              currentTab={showObservations ? 1 : 0}
            />
            {showObservations ? (
              <Popover className="relative mt-3">
                <PopoverButton>
                  <ButtonV2
                    className="border p-3"
                    variant={
                      observationsQuery?.ordering ? "primary" : "secondary"
                    }
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
                        {[
                          {
                            value: "-effective_datetime",
                            label: "Newest First",
                          },
                          {
                            value: "effective_datetime",
                            label: "Oldest First",
                          },
                        ].map(({ value, label }) => (
                          <div
                            key={value}
                            className={classNames(
                              "dropdown-item-primary pointer-events-auto m-2 flex w-56 cursor-pointer items-center justify-start gap-3 rounded border-0 px-4 py-2 text-sm font-normal transition-all duration-200 ease-in-out",
                              observationsQuery?.ordering === value
                                ? "bg-primary-100 !font-medium text-primary-500"
                                : "",
                            )}
                            onClick={() => {
                              setObservationsQuery({
                                ordering: value,
                              });
                            }}
                          >
                            <CareIcon
                              className="text-primary-600"
                              icon={
                                value.startsWith("-")
                                  ? "l-sort-amount-down"
                                  : "l-sort-amount-up"
                              }
                            />
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverPanel>
                </Transition>
              </Popover>
            ) : null}
          </div>

          {showObservations ? (
            <ObservationsList encounter={props.encounter} />
          ) : (
            <QuestionnaireResponsesList encounter={props.encounter} />
          )}
        </div>
      </div>
    </div>
  );
};
