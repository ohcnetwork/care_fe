import { format } from "date-fns";
import type { TFunction } from "i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { formatValue } from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";

import {
  type PrintDetailRow,
  type PrintPatientHeader,
  buildPatientHeader,
} from "@/print/patientDetails";
import type { EncounterRead } from "@/types/emr/encounter/encounter";
import type { PatientRead } from "@/types/emr/patient/patient";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";

type Responses = QuestionnaireResponse["responses"];

type Block =
  | { type: "heading"; text: string; rule: boolean }
  | { type: "question"; text: string; answers: string[] };

export interface QuestionnaireResponsePrintContent {
  heading: string;
  patient: PrintPatientHeader | null;
  patient_label: string;
  details: { left: PrintDetailRow[]; right: PrintDetailRow[] };
  title: string | null;
  description: string | null;
  responses: {
    created: string;
    date: string;
    blocks: Block[];
  }[];
}

function answersOf(
  question: Question,
  response: Responses[number],
): Block | null {
  const values = response.values ?? [];
  const answers: string[] = [];
  values.forEach((valueObj, index) => {
    const { value, coding, unit } = valueObj;
    if ((value == null || value === "") && !coding) return;
    const precedentUnit = unit ?? question.unit;
    answers.push(
      [
        formatValue(value, question.type),
        precedentUnit?.code,
        coding?.display,
        index === values.length - 1 && response.note
          ? `(${response.note})`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  });
  return { type: "question", text: question.text, answers };
}

/** The generic layout of a group; the registered custom group views are not printed. */
function questionBlocks(
  question: Question,
  responses: Responses,
  level: number,
): Block[] {
  if (question.type === "structured") return [];

  if (question.type === "group") {
    if (question.repeats) {
      const rows =
        responses.find((answer) => answer.question_id === question.id)
          ?.sub_results ?? [];
      if (!rows.length) return [];
      return [
        { type: "heading", text: question.text, rule: false },
        ...rows.flatMap((row, index) =>
          groupBlocks(
            {
              ...question,
              repeats: false,
              structured_type: undefined,
              text: `${question.text} (${index + 1})`,
            },
            row,
            level,
          ),
        ),
      ];
    }
    return groupBlocks(question, responses, level);
  }

  const response = responses.find((r) => r.question_id === question.id);
  if (!response) return [];
  const block = answersOf(question, response);
  return block ? [block] : [];
}

function groupBlocks(
  group: Question,
  responses: Responses,
  level: number,
): Block[] {
  return [
    ...(group.text
      ? [
          {
            type: "heading" as const,
            text: group.code
              ? `${group.text} (${group.code.display})`
              : group.text,
            rule: level === 0,
          },
        ]
      : []),
    ...(group.questions ?? []).flatMap((question) =>
      questionBlocks(question, responses, level + 1),
    ),
  ];
}

export function buildQuestionnaireResponsePrintContent({
  encounter,
  patient,
  questionnaire,
  responses,
  t,
}: {
  encounter: EncounterRead | undefined;
  patient: PatientRead | undefined;
  questionnaire: { title?: string; description?: string } | undefined;
  responses: QuestionnaireResponse[];
  t: TFunction;
}): QuestionnaireResponsePrintContent {
  const header = patient ? buildPatientHeader(patient) : null;

  return {
    heading: t("questionnaire_response_logs"),
    patient: header,
    patient_label: t("patient"),
    details: patient
      ? {
          left: [
            { label: t("patient"), value: patient.name },
            {
              label: `${t("age")} / ${t("sex")}`,
              value: `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`,
            },
            ...(header?.identifiers ?? []).map(({ label, value }) => ({
              label,
              value,
            })),
            ...(patient.address
              ? [{ label: t("address"), value: patient.address }]
              : []),
          ],
          right: [
            {
              label: t("encounter_date"),
              value: encounter?.period?.start
                ? format(new Date(encounter.period.start), "dd MMM yyyy, EEEE")
                : t("na"),
            },
            {
              label: t("mobile_number"),
              value: formatPhoneNumberIntl(patient.phone_number),
            },
            ...(encounter?.care_team?.[0]
              ? [
                  {
                    label: t("consultant"),
                    value: formatName(encounter.care_team[0].member),
                  },
                ]
              : []),
            ...(encounter?.current_location
              ? [
                  {
                    label: t("location"),
                    value: encounter.current_location.name,
                  },
                ]
              : []),
          ],
        }
      : { left: [], right: [] },
    title: questionnaire?.title ?? null,
    description: questionnaire?.description ?? null,
    responses: responses
      // Structured responses have no questionnaire to print.
      .filter((response) => !!response.questionnaire)
      .map((response) => ({
        created: `${t("created_by")}: ${formatName(response.created_by)}`,
        date: formatDateTime(response.created_date),
        blocks: (response.questionnaire?.questions ?? []).flatMap((question) =>
          questionBlocks(question, response.responses, 0),
        ),
      })),
  };
}
