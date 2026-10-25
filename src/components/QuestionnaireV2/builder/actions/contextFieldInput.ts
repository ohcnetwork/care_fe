import { BLOOD_GROUP_CHOICES, GENDER_TYPES } from "@/common/constants";
import type {
  AnswerShape,
  ContextValueVariable,
} from "@/components/QuestionnaireV2/builder/actionVariables";

interface ContextFieldInput {
  shape: AnswerShape;
  date?: boolean;
  options?: { value: string; label: string; translationKey?: string }[];
}

/** The field registry has no value schema yet. Use the patient model's
 * known field types, leaving extension fields on the generic input. */
export function contextFieldInput(
  variable: ContextValueVariable | undefined,
): ContextFieldInput | undefined {
  if (variable?.ownerContextType !== "Patient") return undefined;
  switch (variable.segments.at(-1)) {
    case "age":
    case "year_of_birth":
      return { shape: "number" };
    case "deceased":
      return { shape: "boolean" };
    case "date_of_birth":
      return { shape: "text", date: true };
    case "blood_group":
      return {
        shape: "choice",
        options: BLOOD_GROUP_CHOICES.map(({ id, text }) => ({
          value: id,
          label: text,
          ...(id === "unknown" && { translationKey: "unknown" }),
        })),
      };
    case "gender":
      return {
        shape: "choice",
        options: GENDER_TYPES.map(({ id, text }) => ({
          value: id,
          label: text,
          translationKey: `GENDER__${id}`,
        })),
      };
    case "phone_number":
    case "name":
      return { shape: "text" };
    default:
      return undefined;
  }
}
