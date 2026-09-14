import type { TFunction } from "i18next";

import dayjs from "@/Utils/dayjs";
import { Question } from "@/types/questionnaire/question";
import {
  ResourceQuestionnaireAnswer,
  ResourceQuestionnaireAnswerValue,
  ResourceQuestionnaireResponse,
} from "@/types/questionnaire/resourceQuestionnaireResponseApi";

export function formatResponseValue(
  answer: ResourceQuestionnaireAnswerValue,
  question: Question,
  t: TFunction,
): string {
  let value = answer.value == null ? "" : String(answer.value);
  if (value !== "") {
    if (question.type === "boolean") {
      value = ["true", "1"].includes(value.toLowerCase()) ? t("yes") : t("no");
    } else if (question.type === "date") {
      value = dayjs(value).format("DD/MM/YYYY");
    } else if (question.type === "dateTime") {
      const date = dayjs(value);
      value = date.format(
        date.isSame(date.startOf("day")) ? "DD/MM/YYYY" : "hh:mm A; DD/MM/YYYY",
      );
    } else if (question.type === "choice") {
      value =
        question.answer_option?.find((option) => option.value === value)
          ?.display || value;
    }
  }

  // Quantity submissions carry the selected unit in both fields. Compare the
  // code identity since the display labels can differ between stored versions.
  const codingIsUnit =
    answer.coding &&
    answer.unit &&
    answer.coding.system === answer.unit.system &&
    answer.coding.code === answer.unit.code;

  return [
    value,
    codingIsUnit ? undefined : answer.coding?.display || answer.coding?.code,
    answer.unit?.display || answer.unit?.code,
  ]
    .filter((part) => part !== undefined && part !== null && part !== "")
    .join(" ");
}

export function getResponsePreview(
  response: ResourceQuestionnaireResponse,
  t: TFunction,
): string {
  const findPreview = (
    questions: Question[],
    answers: ResourceQuestionnaireAnswer[],
  ): string => {
    for (const question of questions) {
      const answer = answers.find((entry) => entry.question_id === question.id);

      if (question.type === "group") {
        const groups = answer?.sub_results?.length
          ? answer.sub_results
          : [answers];
        for (const group of groups) {
          const preview = findPreview(question.questions ?? [], group);
          if (preview) return preview;
        }
        continue;
      }

      if (!answer || question.type === "display") continue;

      const values = (answer.values ?? [])
        .map((value) => formatResponseValue(value, question, t))
        .filter((value) => value !== "")
        .join(", ");
      const note = answer.note?.trim();
      if (!values && !note) continue;

      const content = [values, note ? `${t("note")}: ${note}` : ""]
        .filter(Boolean)
        .join(" · ");
      return `${question.text}: ${content}`.replace(/\s+/g, " ").trim();
    }

    return "";
  };

  return findPreview(response.questionnaire.questions, response.responses);
}
