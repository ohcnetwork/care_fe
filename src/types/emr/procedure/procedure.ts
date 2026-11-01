import { Code } from "@/types/base/code/code";
import { UserReadMinimal } from "@/types/user/user";

/** Historical statuses only — the backend rejects workflow statuses. */
export const PROCEDURE_STATUS = [
  "completed",
  "not_done",
  "stopped",
  "unknown",
  "entered_in_error",
] as const;

export type ProcedureStatus = (typeof PROCEDURE_STATUS)[number];

export const PROCEDURE_OUTCOME = [
  "successful",
  "partially_successful",
  "unsuccessful",
] as const;

export type ProcedureOutcome = (typeof PROCEDURE_OUTCOME)[number];

/** Statuses that take a `status_reason`. */
export const PROCEDURE_STATUS_WITH_REASON: readonly ProcedureStatus[] = [
  "not_done",
  "stopped",
];

/** At most one of the three is set; none may be in the future. */
export interface ProcedureOccurrence {
  occurrence_datetime?: string | null;
  occurrence_period?: { start?: string | null; end?: string | null } | null;
  occurrence_string?: string | null;
}

export interface Procedure {
  id: string;
  status: ProcedureStatus;
  status_reason?: Code | null;
  category: Code[];
  code: Code;
  occurrence: ProcedureOccurrence;
  recorded_date?: string | null;
  is_primary_source: boolean;
  body_site: Code[];
  reason: Code[];
  outcome?: ProcedureOutcome | null;
  note?: string | null;
  encounter: string;
  created_by?: UserReadMinimal | null;
  updated_by?: UserReadMinimal | null;
  created_date: string;
  modified_date: string;
}

export interface ProcedureRequest {
  id?: string;
  status: ProcedureStatus;
  status_reason?: Code | null;
  category: Code[];
  code: Code;
  occurrence: ProcedureOccurrence;
  body_site: Code[];
  reason: Code[];
  outcome?: ProcedureOutcome | null;
  note?: string | null;
  encounter: string;
  created_date?: string;
  created_by?: UserReadMinimal | null;
  /** Set on rows added or edited in this session; only these are saved. */
  dirty?: boolean;
}

export const PROCEDURE_STATUS_COLORS = {
  completed: "green",
  not_done: "secondary",
  stopped: "yellow",
  unknown: "outline",
  entered_in_error: "destructive",
} as const;

export const PROCEDURE_OUTCOME_COLORS = {
  successful: "green",
  partially_successful: "yellow",
  unsuccessful: "destructive",
} as const;
