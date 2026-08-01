import { ComponentType } from "react";

import { Question, QuestionType } from "@/types/questionnaire/question";

import { BooleanInput } from "./inputs/BooleanInput";
import { ChoiceInput } from "./inputs/ChoiceInput";
import { DateInput } from "./inputs/DateInput";
import { DateTimeQuestionInput } from "./inputs/DateTimeQuestionInput";
import { DisplayText } from "./inputs/DisplayText";
import { NumberInput } from "./inputs/NumberInput";
import { QuantityInput } from "./inputs/QuantityInput";
import { TextInput } from "./inputs/TextInput";
import { TimeInput } from "./inputs/TimeInput";

export interface RendererInputProps {
  question: Question;
  disabled: boolean;
  /** DOM id for the primary control — the question label's htmlFor target. */
  inputId: string;
  /** DOM id of the question label, for aria-labelledby on grouped controls. */
  labelId: string;
  /**
   * Index into `response.values` this input edits — QuestionField renders
   * one input per entry for repeating questions. Absent → single-entry mode:
   * the input keeps its exact legacy read/replace semantics on `values[0]`.
   */
  valueIndex?: number;
}

export const QUESTION_TYPE_COMPONENTS: Partial<
  Record<QuestionType, ComponentType<RendererInputProps>>
> = {
  string: TextInput,
  text: TextInput,
  url: TextInput,
  decimal: NumberInput,
  integer: NumberInput,
  boolean: BooleanInput,
  choice: ChoiceInput,
  date: DateInput,
  dateTime: DateTimeQuestionInput,
  time: TimeInput,
  quantity: QuantityInput,
  display: DisplayText,
};
