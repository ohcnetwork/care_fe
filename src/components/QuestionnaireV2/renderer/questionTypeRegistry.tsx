import { ComponentType } from "react";

import { Question, QuestionType } from "@/types/questionnaire/question";

import { BooleanInput } from "./inputs/BooleanInput";
import { ChoiceInput } from "./inputs/ChoiceInput";
import { DateInput } from "./inputs/DateInput";
import { DateTimeInput } from "./inputs/DateTimeInput";
import { DisplayText } from "./inputs/DisplayText";
import { NumberInput } from "./inputs/NumberInput";
import { QuantityInput } from "./inputs/QuantityInput";
import { TextInput } from "./inputs/TextInput";
import { TimeInput } from "./inputs/TimeInput";

export interface RendererInputProps {
  question: Question;
  disabled: boolean;
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
  dateTime: DateTimeInput,
  time: TimeInput,
  quantity: QuantityInput,
  display: DisplayText,
};
