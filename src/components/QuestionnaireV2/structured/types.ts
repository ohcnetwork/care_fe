import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponsePath,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import type { StructuredQuestionType } from "@/types/questionnaire/structured";

import type { ApplyChargeItemDefinitionRequest } from "@/types/billing/chargeItem/chargeItem";
import type { AllergyIntoleranceRequest } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import type { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import type { EncounterEdit } from "@/types/emr/encounter/encounter";
import type { MedicationRequestCreate } from "@/types/emr/medicationRequest/medicationRequest";
import type { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import type { ServiceRequestApplyActivityDefinitionForm } from "@/types/emr/serviceRequest/serviceRequest";
import type { SymptomRequest } from "@/types/emr/symptom/symptom";
import type { FileUploadQuestion } from "@/types/files/file";
import type { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

/** Subject ids a structured type needs before it can render. */
export type StructuredContextKey = "patientId" | "encounterId" | "facilityId";

/** One entry of `values[0].value` per structured type. */
export interface StructuredDataMap {
  allergy_intolerance: AllergyIntoleranceRequest;
  medication_request: MedicationRequestCreate;
  medication_statement: MedicationStatementRequest;
  symptom: SymptomRequest;
  diagnosis: DiagnosisRequest;
  encounter: EncounterEdit;
  appointment: CreateAppointmentQuestion;
  files: FileUploadQuestion;
  time_of_death: string;
  service_request: ServiceRequestApplyActivityDefinitionForm;
  charge_item: ApplyChargeItemDefinitionRequest;
}

export type DataTypeFor<K extends StructuredQuestionType> =
  StructuredDataMap[K];

/** One entry of the submit batch (`POST /api/v1/batch_requests/`). */
export interface StructuredBatchEntry {
  url: string;
  method: "POST" | "PUT" | "PATCH";
  reference_id: string;
  body: unknown;
}

/** Context `buildRequests` composes URLs/bodies from. Subject ids are
 *  optional because plugin types may declare a resource subject; `path`
 *  is the repeat-row position of the question, when inside repeats. */
export interface StructuredRequestContext {
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  questionId: string;
  path?: ResponsePath;
}

/** `buildRequests` with plugin data opaque to the host. */
export type StructuredRequestBuilder = (
  data: unknown[],
  context: StructuredRequestContext,
) => Promise<StructuredBatchEntry[]>;

const REFERENCE_PREFIX = "structured:";
const PATH_DELIMITER = "#";

/** `structured:<type>:<questionId>[#r0.r1]` — the suffix lists the row
 *  index of each repeat level in `path`. */
export function structuredReferenceId(
  type: StructuredQuestionType,
  questionId: string,
  path?: ResponsePath,
): string {
  const rows = path?.map((entry) => `r${entry.rowIndex}`).join(".");
  return `${REFERENCE_PREFIX}${type}:${questionId}${rows ? PATH_DELIMITER + rows : ""}`;
}

export interface ParsedStructuredReferenceId {
  type: string;
  questionId: string;
  /** Row index per repeat level, outermost first; empty outside repeats. */
  rowIndexes: number[];
}

export function parseStructuredReferenceId(
  referenceId: string,
): ParsedStructuredReferenceId | undefined {
  if (!referenceId.startsWith(REFERENCE_PREFIX)) return undefined;
  const [head, suffix, ...extra] = referenceId
    .slice(REFERENCE_PREFIX.length)
    .split(PATH_DELIMITER);
  if (extra.length > 0) return undefined;
  const separator = head.indexOf(":");
  if (separator <= 0 || separator === head.length - 1) return undefined;
  const rowIndexes: number[] = [];
  if (suffix !== undefined) {
    for (const part of suffix.split(".")) {
      if (!/^r\d+$/.test(part)) return undefined;
      rowIndexes.push(Number(part.slice(1)));
    }
  }
  return {
    type: head.slice(0, separator),
    questionId: head.slice(separator + 1),
    rowIndexes,
  };
}

/** Props `StructuredSlot` hands every structured input. */
export interface StructuredInputProps {
  question: Question;
  response: QuestionnaireResponse;
  /** Memoized by the slot; adapters preserve this callback identity. */
  onChange: (values: ResponseValue[], note?: string) => void;
  /** Record server-prefilled values separately from clinician edits. */
  onInitializeResponse?: (values: ResponseValue[]) => void;
  disabled: boolean;
  errors: QuestionValidationError[];
  clearError: () => void;
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  /** Fill mode only — template CRUD (real POSTs) stays off preview. */
  questionnaireId?: string;
  questionnaireSlug?: string;
}

/** Everything one structured question type needs: rendering, context,
 *  validation, request building and draft policy. */
export interface StructuredTypeDefinition<
  K extends StructuredQuestionType = StructuredQuestionType,
> {
  type: K;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  /** Questionnaire subject types this structured type may appear on. */
  subjects: readonly SubjectType[];
  /** `"exclude"` when values cannot round-trip through JSON (e.g. `File`). */
  draftPolicy: "serialize" | "exclude";
  /** Submit-time validation; absent types rely on the server. */
  validate?: (
    data: DataTypeFor<K>[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
  /** Turn recorded entries into batch requests; [] when nothing to send. */
  buildRequests: (
    data: DataTypeFor<K>[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}
