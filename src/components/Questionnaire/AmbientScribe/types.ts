import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

export type ScribeStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "paused"
  | "error";

export type SpeakerRole = "doctor" | "patient" | "unknown";

export interface TranscriptTurn {
  id: string;
  speaker: SpeakerRole;
  /**
   * Display text. Originally the source-language transcription; once
   * `translateToEnglish` resolves we replace this with the English
   * version and move the source-language string into `originalText`.
   */
  text: string;
  /**
   * Source-language text, populated only when `text` was replaced by an
   * English translation. The UI surfaces this on hover.
   */
  originalText?: string;
  /** True while a translation request is in flight for this turn. */
  translating?: boolean;
  status: "partial" | "final";
  createdAt: number;
}

export interface FillUpdate {
  question_id: string;
  type: "string" | "number" | "boolean" | "choice" | "date" | "time";
  value: string | number | boolean | null;
  confidence: number;
  reasoning?: string;
}

export interface FieldProvenance {
  status: "ai" | "ai_edited";
  aiValue: ResponseValue[];
  lastAiAt: number;
}

export type ProvenanceMap = Record<string, FieldProvenance>;

export interface FillableQuestionSnapshot {
  id: string;
  link_id: string;
  text: string;
  description?: string;
  fillType: FillUpdate["type"];
  required?: boolean;
  options?: { value: string; display?: string }[];
  currentValue: unknown;
}

export interface ScribeHandle {
  enabled: boolean;
  status: ScribeStatus;
  errorMessage?: string;
  transcript: TranscriptTurn[];
  waveform: number[];
  provenance: ProvenanceMap;
  /**
   * Wall-clock timestamp (ms) of the most recent successful `start()`
   * transition into "listening". `undefined` while idle. Consumers can
   * subtract from `Date.now()` to render an elapsed mm:ss display.
   */
  sessionStartedAt?: number;
  start: () => Promise<void>;
  stop: () => void;
  runFillNow: () => void;
  markEdited: (questionId: string, values: ResponseValue[]) => void;
  clearProvenanceFor: (questionId: string) => void;
}

export interface RollupContext {
  transcript: TranscriptTurn[];
  fillable: FillableQuestionSnapshot[];
}

export type FillableQuestion = Question & {
  type:
    | "text"
    | "string"
    | "decimal"
    | "integer"
    | "boolean"
    | "choice"
    | "date"
    | "time";
};

export interface AiAppliedUpdate {
  question_id: string;
  values: ResponseValue[];
  question: Question;
  questionnaireId: string;
}

export interface QuestionnaireAnswerable {
  questionnaireId: string;
  questionnaireResponses: QuestionnaireResponse[];
}
