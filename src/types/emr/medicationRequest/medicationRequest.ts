import { Code } from "@/types/base/code/code";
import {
  PrescriptionCreate,
  PrescriptionRead,
} from "@/types/emr/prescription/prescription";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { UserReadMinimal } from "@/types/user/user";
import { add, divide, isZero, multiply, roundUp } from "@/Utils/decimal";
import Decimal from "decimal.js";

export const MEDICATION_REQUEST_STATUS_COLORS = {
  active: "primary",
  completed: "blue",
  cancelled: "destructive",
  draft: "secondary",
  on_hold: "yellow",
  unknown: "secondary",
  ended: "purple",
  entered_in_error: "destructive",
} as const satisfies Record<MedicationRequestStatus, string>;

export const MEDICATION_REQUEST_PRIORITY_COLORS = {
  stat: "secondary",
  urgent: "yellow",
  asap: "destructive",
  routine: "indigo",
} as const satisfies Record<MedicationPriority, string>;

export const DOSAGE_UNITS_CODES = [
  {
    code: "{tbl}",
    display: "tablets",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "g",
    display: "gram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "mg",
    display: "milligram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "ug",
    display: "microgram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "mL",
    display: "milliliter",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "[drp]",
    display: "drop",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "[iU]",
    display: "international unit",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "{count}",
    display: "count",
    system: "http://unitsofmeasure.org",
  },
] as const;

export const UCUM_TIME_UNITS = [
  // TODO: Are these smaller units required?
  // "ms",
  // "s,
  // "min",
  "d",
  "h",
  "wk",
  "mo",
  "a",
] as const;

export const ACTIVE_MEDICATION_STATUSES = [
  "active",
  "on_hold",
  "draft",
  "unknown",
] as const;

export const INACTIVE_MEDICATION_STATUSES = [
  "ended",
  "completed",
  "cancelled",
  "entered_in_error",
] as const;

export const MEDICATION_REQUEST_STATUS = [
  ...ACTIVE_MEDICATION_STATUSES,
  ...INACTIVE_MEDICATION_STATUSES,
] as const;

export type MedicationRequestStatus =
  (typeof MEDICATION_REQUEST_STATUS)[number];

export const MEDICATION_REQUEST_STATUS_REASON = [
  "altchoice",
  "clarif",
  "drughigh",
  "hospadm",
  "labint",
  "non_avail",
  "preg",
  "salg",
  "sddi",
  "sdupther",
  "sintol",
  "surg",
  "washout",
] as const;

export type MedicationRequestStatusReason =
  (typeof MEDICATION_REQUEST_STATUS_REASON)[number];

export const MEDICATION_REQUEST_INTENT = [
  "proposal",
  "plan",
  "order",
  "original_order",
  "reflex_order",
  "filler_order",
  "instance_order",
] as const;

export type MedicationRequestIntent =
  (typeof MEDICATION_REQUEST_INTENT)[number];

export interface DosageQuantity {
  value: string;
  unit: Code;
}

export interface BoundsDuration {
  value: string;
  unit: (typeof UCUM_TIME_UNITS)[number];
}

export interface DoseRange {
  low: DosageQuantity;
  high: DosageQuantity;
}

export interface Timing {
  repeat: {
    frequency: number;
    period: string;
    period_unit: (typeof UCUM_TIME_UNITS)[number];
    bounds_duration: BoundsDuration;
  };
  /** Optional in FHIR (0..1). Omitted for text-only dosage patterns. */
  code?: Code;
}

export interface MedicationRequestDosageInstruction {
  sequence?: number;
  text?: string;
  additional_instruction?: Code[];
  patient_instruction?: string;
  // TODO: query: how to map for "Immediate" frequency
  // TODO: query how to map Days
  timing?: Timing;
  /**
   * True if it is a PRN medication
   */
  as_needed_boolean: boolean;
  /**
   * If it is a PRN medication (as_needed_boolean is true), the indicator.
   */
  // Todo: Implement a selector for PRN as needed reason, Backend value set: system-as-needed-reason
  as_needed_for?: Code;
  site?: Code;
  route?: Code;
  method?: Code;
  /**
   * One of `dose_quantity` or `dose_range` must be present.
   * `type` is optional and defaults to `ordered`.
   *
   * - If `type` is `ordered`, the dose specified is as ordered by the prescriber.
   * - If `type` is `calculated`, the dose specified is calculated by the prescriber or the system.
   */
  dose_and_rate?: {
    type: "ordered" | "calculated";
    dose_quantity?: DosageQuantity;
    dose_range?: DoseRange;
  };
  max_dose_per_period?: DoseRange;
}

export enum MedicationRequestDispenseStatus {
  complete = "complete",
  partial = "partial",
  incomplete = "incomplete",
}

export interface MedicationRequest {
  readonly id?: string;
  status?: MedicationRequestStatus;
  status_reason?: MedicationRequestStatusReason;
  intent?: MedicationRequestIntent;
  category?: "inpatient" | "outpatient" | "community" | "discharge";
  priority?: "stat" | "urgent" | "asap" | "routine";
  do_not_perform: boolean;
  medication?: Code;
  encounter?: string; // UUID
  dosage_instruction: MedicationRequestDosageInstruction[];
  note?: string;
  authored_on: string;
  created_by?: UserReadMinimal;
  requested_product?: string;
  requested_product_internal?: ProductKnowledgeBase;
  dispense_status?: MedicationRequestDispenseStatus;
  requester: UserReadMinimal;
}

export type MedicationRequestTemplateSpec = Omit<
  MedicationRequest,
  | "id"
  | "created_by"
  | "authored_on"
  | "requested_product_internal"
  | "encounter"
  | "authored_on"
  | "requester"
  | "dispense_status"
>;

export interface MedicationRequestCreate extends MedicationRequest {
  create_prescription?: PrescriptionCreate;
  dirty?: boolean;
}

export interface MedicationRequestRequest extends Omit<
  MedicationRequest,
  "requester"
> {
  requester?: string;
}

export enum MedicationPriority {
  STAT = "stat",
  URGENT = "urgent",
  ASAP = "asap",
  ROUTINE = "routine",
}

export const MEDICATION_PRIORITY_COLORS = {
  stat: "secondary",
  urgent: "yellow",
  asap: "destructive",
  routine: "indigo",
} as const satisfies Record<MedicationPriority, string>;

export interface MedicationRequestRead {
  id: string;
  status: MedicationRequestStatus;
  status_reason?: MedicationRequestStatusReason;
  intent: MedicationRequestIntent;
  category: "inpatient" | "outpatient" | "community" | "discharge";
  priority: MedicationPriority;
  do_not_perform: boolean;
  medication: Code;
  encounter: string;
  dosage_instruction: MedicationRequestDosageInstruction[];
  note?: string;
  created_date: string;
  modified_date: string;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  authored_on: string;
  requested_product?: ProductKnowledgeBase;
  inventory_items_internal?: InventoryRead[];
  dispense_status?: MedicationRequestDispenseStatus;
  requester?: UserReadMinimal;
  prescription?: PrescriptionRead;
}

export const MEDICATION_REQUEST_TIMING_OPTIONS: Record<
  string,
  {
    display: string;
    timing: Timing;
  }
> = {
  BID: {
    display: "BID (1-0-1)",
    timing: {
      repeat: {
        frequency: 2,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "BID",
        display: "Two times a day",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  TID: {
    display: "TID (1-1-1)",
    timing: {
      repeat: {
        frequency: 3,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "TID",
        display: "Three times a day",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  QID: {
    display: "QID (1-1-1-1)",
    timing: {
      repeat: {
        frequency: 4,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "QID",
        display: "Four times a day",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  AM: {
    display: "AM (1-0-0)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "AM",
        display: "Every morning",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  NOON: {
    display: "NOON (0-1-0)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "NOON",
        display: "At noon",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  PM: {
    display: "PM (0-0-1)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "PM",
        display: "Every afternoon",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  BID_MORNING_NOON: {
    display: "BID (1-1-0)",
    timing: {
      repeat: {
        frequency: 2,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "BID",
        display: "Morning and noon",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  BID_NOON_NIGHT: {
    display: "BID (0-1-1)",
    timing: {
      repeat: {
        frequency: 2,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "BID",
        display: "Noon and night",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  TID_MORNING_NOON_NIGHT: {
    display: "TID (1-1-1)",
    timing: {
      repeat: {
        frequency: 3,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "TID",
        display: "Morning, noon and night",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  QD: {
    display: "QD (Once a day)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "QD",
        display: "Once a day",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  QOD: {
    display: "QOD (Alternate days)",
    timing: {
      repeat: {
        frequency: 1,
        period: "2",
        period_unit: "d",
        bounds_duration: {
          value: "2",
          unit: "d",
        },
      },
      code: {
        code: "QOD",
        display: "Alternate days",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  Q1H: {
    display: "Q1H (Every 1 hour)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "h",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "Q1H",
        display: "Every 1 hour",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  Q2H: {
    display: "Q2H (Every 2 hours)",
    timing: {
      repeat: {
        frequency: 1,
        period: "2",
        period_unit: "h",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "Q2H",
        display: "Every 2 hours",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  Q3H: {
    display: "Q3H (Every 3 hours)",
    timing: {
      repeat: {
        frequency: 1,
        period: "3",
        period_unit: "h",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "Q3H",
        display: "Every 3 hours",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  Q4H: {
    display: "Q4H (Every 4 hours)",
    timing: {
      repeat: {
        frequency: 1,
        period: "4",
        period_unit: "h",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "Q4H",
        display: "Every 4 hours",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  Q6H: {
    display: "Q6H (Every 6 hours)",
    timing: {
      repeat: {
        frequency: 1,
        period: "6",
        period_unit: "h",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "Q6H",
        display: "Every 6 hours",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  Q8H: {
    display: "Q8H (Every 8 hours)",
    timing: {
      repeat: {
        frequency: 1,
        period: "8",
        period_unit: "h",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "Q8H",
        display: "Every 8 hours",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  Q12H: {
    display: "Q12H (Every 12 hours)",
    timing: {
      repeat: {
        frequency: 1,
        period: "12",
        period_unit: "h",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "Q12H",
        display: "Every 12 hours",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  BED: {
    display: "BED (0-0-1)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "BED",
        display: "Bedtime",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  WK: {
    display: "WK (Weekly)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "wk",
        bounds_duration: {
          value: "1",
          unit: "wk",
        },
      },
      code: {
        code: "WK",
        display: "Weekly",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  MO: {
    display: "MO (Monthly)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "mo",
        bounds_duration: {
          value: "1",
          unit: "mo",
        },
      },
      code: {
        code: "MO",
        display: "Monthly",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  HS: {
    display: "HS (At bedtime)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "HS",
        display: "At bedtime",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  AC: {
    display: "AC (Before meals)",
    timing: {
      repeat: {
        frequency: 3,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "AC",
        display: "Before meals",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  PC: {
    display: "PC (After meals)",
    timing: {
      repeat: {
        frequency: 3,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "PC",
        display: "After meals",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
  STAT: {
    display: "STAT (Immediately)",
    timing: {
      repeat: {
        frequency: 1,
        period: "1",
        period_unit: "d",
        bounds_duration: {
          value: "1",
          unit: "d",
        },
      },
      code: {
        code: "STAT",
        display: "Immediately",
        system: "http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation",
      },
    },
  },
} as const;

/**
 * Attempt to parse a medication string into a single MedicationRequest object.
 *
 * - Handles parentheses in the name (e.g., "Indinavir (as indinavir sulfate) ...")
 * - Handles numeric doses for mg, g, mcg, unit/mL, etc.
 * - Detects route: "oral", "injection", etc.
 * - Detects form: "tablet", "capsule", "solution for injection", "granules sachet", etc.
 *
 * You can extend the dictionaries & regex to cover more cases (IV, subcutaneous, brand names, etc.).
 */
export function parseMedicationStringToRequest(
  requester: UserReadMinimal,
  medication?: Code,
  productKnowledge?: ProductKnowledgeBase,
): MedicationRequest {
  const dosageInstruction: MedicationRequestDosageInstruction = {
    as_needed_boolean: false,
  };

  if (productKnowledge?.base_unit) {
    dosageInstruction.dose_and_rate = {
      type: "ordered",
      dose_quantity: {
        value: "1",
        unit: productKnowledge.base_unit,
      },
    };
  }

  const medicationRequest: MedicationRequest = {
    do_not_perform: false,
    dosage_instruction: [dosageInstruction],
    ...(medication ? { medication } : {}),
    ...(productKnowledge
      ? {
          requested_product: productKnowledge.id,
          requested_product_internal: productKnowledge,
        }
      : {}),
    status: "active",
    intent: "order",
    priority: "routine",
    category: "inpatient",
    authored_on: new Date().toISOString(),
    requester: requester,
  };

  return medicationRequest;
}

export function displayMedicationName(
  medication?:
    | MedicationRequest
    | MedicationRequestRead
    | MedicationRequestCreate,
): string {
  if (!medication) {
    return "";
  }
  if ("requested_product_internal" in medication) {
    // This is a MedicationRequest
    return (
      medication.medication?.display ||
      medication.requested_product_internal?.name ||
      ""
    );
  }
  // This is a MedicationRequestRead
  return (
    medication.medication?.display ||
    (typeof medication.requested_product !== "string"
      ? medication.requested_product?.name
      : "") ||
    ""
  );
}

// ---------------------------------------------------------------------------
// M-A-N (Morning-Afternoon-Night) Frequency Helpers
// ---------------------------------------------------------------------------

/**
 * Maps common M-A-N shorthand strings to their FHIR timing option keys.
 * Each entry has: the M-A-N string, a human-readable label, and the key
 * into MEDICATION_REQUEST_TIMING_OPTIONS for the FHIR mapping.
 */
export const MAN_FREQUENCY_PRESETS: {
  man: string;
  label: string;
  timingKey: string;
}[] = [
  { man: "1-0-1", label: "Twice a day", timingKey: "BID" },
  { man: "1-1-1", label: "Thrice a day", timingKey: "TID" },
  { man: "1-0-0", label: "Morning only", timingKey: "AM" },
  { man: "0-0-1", label: "Night only", timingKey: "PM" },
  { man: "0-1-0", label: "Noon only", timingKey: "NOON" },
  { man: "1-1-0", label: "Morning & Noon", timingKey: "BID_MORNING_NOON" },
  { man: "0-1-1", label: "Noon & Night", timingKey: "BID_NOON_NIGHT" },
  { man: "1-1-1-1", label: "Four times a day", timingKey: "QID" },
];

/**
 * Regex that matches a valid (possibly partial) M-A-N pattern.
 * Each slot is a number or fraction (e.g. 1, 1/2, 1/4).
 * Full pattern: slot(-slot){1,3}  (2 to 4 slots separated by dashes)
 */
const MAN_SLOT_RE = /[\d]+(?:\/[\d]+)?/;
const MAN_FULL_RE = /^[\d]+(?:\/[\d]+)?(-[\d]+(?:\/[\d]+)?){1,3}$/;

/** Common dose values used when generating M-A-N completions. */
const COMMON_SLOT_VALUES = ["0", "1/4", "1/3", "1/2", "1", "2"];

/**
 * Evaluate a single M-A-N slot string to a number (handles fractions).
 * e.g. "1/2" → 0.5, "2" → 2, "0" → 0
 */
export function evalSlot(slot: string): number {
  if (slot.includes("/")) {
    const [num, den] = slot.split("/").map(Number);
    return den ? num / den : 0;
  }
  return Number(slot) || 0;
}

/**
 * Check whether all non-zero slots in a M-A-N string have the same dose.
 */
export function isUniformMan(manString: string): boolean {
  const slots = manString.split("-");
  const nonZero = slots.filter((s) => evalSlot(s) !== 0);
  if (nonZero.length === 0) return true;
  return nonZero.every((s) => evalSlot(s) === evalSlot(nonZero[0]));
}

/**
 * Given what the user has typed so far, generate dynamic M-A-N completion
 * suggestions. This is the brain of the smart autocomplete.
 *
 * Examples:
 *   ""       → popular presets (1-0-1, 1-1-1, 0-0-1, ...)
 *   "1"      → 1-0-0, 1-0-1, 1-1-0, 1-1-1
 *   "1-"     → 1-0-0, 1-0-1, 1-1-0, 1-1-1
 *   "1-0"    → 1-0-0, 1-0-1
 *   "1-0-"   → 1-0-0, 1-0-1
 *   "1/2-"   → 1/2-0-0, 1/2-0-1, 1/2-0-1/2, 1/2-1/2-1/2, ...
 *   "1-0-1"  → exact match + 4-slot extensions
 */
export function generateManSuggestions(
  input: string,
): { value: string; label: string }[] {
  const trimmed = input.trim();

  // Empty input: show popular presets
  if (!trimmed) {
    return MAN_FREQUENCY_PRESETS.slice(0, 8).map((p) => ({
      value: p.man,
      label: `${p.man} (${p.label})`,
    }));
  }

  // Check if input looks like a M-A-N pattern (numbers, fractions, dashes)
  const isManLike = /^[\d/]+(-[\d/]*)*-?$/.test(trimmed);
  if (!isManLike) return [];

  const endsWithDash = trimmed.endsWith("-");
  const parts = trimmed.split("-").filter((p) => p !== "");
  const partialLast = endsWithDash ? "" : parts[parts.length - 1];

  // Determine the typed slots (complete ones)
  const completedSlots = endsWithDash ? parts : parts.slice(0, -1);
  const prefix = completedSlots.join("-");

  // Build the set of slot values to use for completions.
  // Always include 0 and 1. Also include any unique fractional value
  // the user has typed, so "1/2-" generates "1/2-0-...", "1/2-1/2-..." etc.
  const slotValues = [...COMMON_SLOT_VALUES];
  for (const slot of completedSlots) {
    if (!slotValues.includes(slot) && MAN_SLOT_RE.test(slot)) {
      slotValues.push(slot);
    }
  }
  // Deduplicate
  const uniqueSlotValues = [...new Set(slotValues)];

  const suggestions: { value: string; label: string }[] = [];
  const seen = new Set<string>();

  const addSuggestion = (man: string) => {
    if (seen.has(man)) return;
    seen.add(man);
    // Find if this matches a known preset
    const preset = MAN_FREQUENCY_PRESETS.find((p) => p.man === man);
    suggestions.push({
      value: man,
      label: preset ? `${man} (${preset.label})` : man,
    });
  };

  // If user typed a complete or partial first slot only (no dash yet)
  if (parts.length === 1 && !endsWithDash) {
    const firstSlot = parts[0];
    // Generate 3-part completions
    for (const mid of ["0", "1", firstSlot]) {
      for (const last of ["0", "1", firstSlot]) {
        const candidate = `${firstSlot}-${mid}-${last}`;
        if (MAN_FULL_RE.test(candidate)) {
          addSuggestion(candidate);
        }
      }
    }
    // Also show 4-part if common
    addSuggestion(`${firstSlot}-${firstSlot}-${firstSlot}-${firstSlot}`);
    return suggestions;
  }

  // If we have 1 completed slot and are starting second slot
  if (completedSlots.length === 1) {
    const first = completedSlots[0];
    const filteredSlotValues = partialLast
      ? uniqueSlotValues.filter((v) => v.startsWith(partialLast))
      : uniqueSlotValues;
    for (const mid of filteredSlotValues) {
      for (const last of ["0", "1", first]) {
        const candidate = `${first}-${mid}-${last}`;
        if (MAN_FULL_RE.test(candidate)) {
          addSuggestion(candidate);
        }
      }
    }
    return suggestions;
  }

  // If we have 2 completed slots and are starting third
  if (completedSlots.length === 2) {
    const filteredSlotValues = partialLast
      ? uniqueSlotValues.filter((v) => v.startsWith(partialLast))
      : uniqueSlotValues;
    for (const last of filteredSlotValues) {
      const candidate = `${prefix}-${last}`;
      if (MAN_FULL_RE.test(candidate)) {
        addSuggestion(candidate);
      }
    }
    // Also offer 4-part extensions
    for (const last of filteredSlotValues) {
      for (const fourth of ["0", "1"]) {
        const candidate = `${prefix}-${last}-${fourth}`;
        if (MAN_FULL_RE.test(candidate)) {
          addSuggestion(candidate);
        }
      }
    }
    return suggestions;
  }

  // If we have 3 completed slots — it's a complete 3-part M-A-N
  if (completedSlots.length === 3 && !endsWithDash && !partialLast) {
    const threePartMan = completedSlots.join("-");
    addSuggestion(threePartMan);
    // Also offer 4-part extensions
    for (const fourth of uniqueSlotValues) {
      const candidate = `${threePartMan}-${fourth}`;
      if (MAN_FULL_RE.test(candidate)) {
        addSuggestion(candidate);
      }
    }
    return suggestions;
  }

  // If we have 3 completed slots and starting 4th
  if (completedSlots.length === 3 && (endsWithDash || partialLast)) {
    const filteredSlotValues = partialLast
      ? uniqueSlotValues.filter((v) => v.startsWith(partialLast))
      : uniqueSlotValues;
    for (const fourth of filteredSlotValues) {
      const candidate = `${prefix}-${fourth}`;
      if (MAN_FULL_RE.test(candidate)) {
        addSuggestion(candidate);
      }
    }
    return suggestions;
  }

  // 4-part complete
  if (completedSlots.length === 4) {
    addSuggestion(completedSlots.join("-"));
    return suggestions;
  }

  return suggestions;
}

/**
 * Count the number of non-zero dose slots in a M-A-N string.
 * This is used to infer the FHIR frequency (doses per day) for
 * non-standard patterns stored as text.
 *
 * "1-1/2-0" → 2 (morning + noon)
 * "1-0-1"   → 2
 * "1-1-1"   → 3
 * "0-0-1"   → 1
 */
export function countManDosesPerDay(manString: string): number {
  if (!MAN_FULL_RE.test(manString)) return 1; // fallback
  const slots = manString.split("-");
  const nonZero = slots.filter((s) => evalSlot(s) > 0).length;
  return Math.max(nonZero, 1); // at least 1
}

/**
 * Sum the actual slot values from a M-A-N string.
 * E.g. "1/2-1-1/2" → 0.5 + 1 + 0.5 = 2
 *      "1-2-3"     → 1 + 2 + 3 = 6
 *      "1-0-1"     → 1 + 0 + 1 = 2
 * Returns null if the string isn't a valid M-A-N pattern.
 */
export function sumManSlots(manString: string): number | null {
  if (!MAN_FULL_RE.test(manString)) return null;
  const slots = manString.split("-");
  let total = 0;
  for (const slot of slots) {
    total += evalSlot(slot);
  }
  return total > 0 ? total : null;
}

/**
 * Build a minimal Timing object for a text-only dosage pattern.
 * No `code` is set (since the pattern doesn't map to a standard code).
 * The frequency is inferred from the number of non-zero M-A-N slots.
 */
export function buildTimingForTextDosage(
  manText: string,
  boundsDuration: BoundsDuration,
): Timing {
  const freq = countManDosesPerDay(manText);
  return {
    repeat: {
      frequency: freq,
      period: "1",
      period_unit: "d",
      bounds_duration: boundsDuration,
    },
    // No `code` -- intentionally omitted for text-only patterns
  };
}

/**
 * Given a M-A-N string, find the best FHIR Timing match.
 * For standard uniform patterns, returns the exact timing from
 * MEDICATION_REQUEST_TIMING_OPTIONS. For non-standard patterns, returns
 * undefined (caller should store as dosageInstruction.text instead).
 */
export function manToFhirTiming(
  manString: string,
):
  | { timing: Timing; asNeeded: false }
  | { timing: undefined; asNeeded: true }
  | undefined {
  // Check SOS / PRN
  if (manString.toUpperCase() === "SOS") {
    return { timing: undefined, asNeeded: true };
  }

  // Check exact preset match
  const preset = MAN_FREQUENCY_PRESETS.find((p) => p.man === manString);
  if (preset) {
    const timingOption = MEDICATION_REQUEST_TIMING_OPTIONS[preset.timingKey];
    if (timingOption) {
      return {
        timing: structuredClone(timingOption.timing),
        asNeeded: false,
      };
    }
  }

  // Check if it's a FHIR timing key directly (e.g. user typed "Q6H")
  const directKey = manString.toUpperCase();
  if (directKey in MEDICATION_REQUEST_TIMING_OPTIONS) {
    const timingOption = MEDICATION_REQUEST_TIMING_OPTIONS[directKey];
    return {
      timing: structuredClone(timingOption.timing),
      asNeeded: false,
    };
  }

  // Non-standard pattern — no FHIR timing match
  return undefined;
}

/**
 * Reverse map: convert existing FHIR dosageInstruction back to a M-A-N
 * display string for the frequency input field.
 *
 * Priority:
 * 1. If dosageInstruction.text exists, return it
 * 2. If timing matches a known preset, return the M-A-N string
 * 3. If as_needed, return "SOS"
 * 4. If timing code matches a FHIR option, return the option key
 * 5. Empty string
 */
export function fhirDosageToFrequencyValue(
  dosageInstruction?: MedicationRequestDosageInstruction,
): string {
  if (!dosageInstruction) return "";

  // 1. PRN/SOS takes highest priority
  if (dosageInstruction.as_needed_boolean) return "SOS";

  // 2. Explicit text
  if (dosageInstruction.text) return dosageInstruction.text;

  // 3. Check timing code against M-A-N presets
  if (dosageInstruction.timing?.code?.code) {
    const code = dosageInstruction.timing.code.code;
    // Find preset with matching timing key
    const preset = MAN_FREQUENCY_PRESETS.find((p) => {
      const opt = MEDICATION_REQUEST_TIMING_OPTIONS[p.timingKey];
      return opt?.timing.code?.code === code;
    });
    if (preset) return preset.man;

    // Fallback to FHIR code key
    const timingKey = Object.keys(MEDICATION_REQUEST_TIMING_OPTIONS).find(
      (key) =>
        MEDICATION_REQUEST_TIMING_OPTIONS[key].timing.code?.code === code,
    );
    if (timingKey) return timingKey;
  }

  return "";
}

/**
 * Get display label for a frequency value (for showing in tables/summaries).
 */
export function getFrequencyDisplayLabel(
  dosageInstruction?: MedicationRequestDosageInstruction,
): string {
  if (!dosageInstruction) return "";

  // Text field takes priority
  if (dosageInstruction.text) {
    const preset = MAN_FREQUENCY_PRESETS.find(
      (p) => p.man === dosageInstruction.text,
    );
    return preset
      ? `${dosageInstruction.text} (${preset.label})`
      : dosageInstruction.text;
  }

  if (dosageInstruction.as_needed_boolean) return "SOS";

  if (dosageInstruction.timing?.code?.code) {
    const code = dosageInstruction.timing.code.code;
    const preset = MAN_FREQUENCY_PRESETS.find((p) => {
      const opt = MEDICATION_REQUEST_TIMING_OPTIONS[p.timingKey];
      return opt?.timing.code?.code === code;
    });
    if (preset) return `${preset.man} (${preset.label})`;

    const opt = Object.values(MEDICATION_REQUEST_TIMING_OPTIONS).find(
      (o) => o.timing.code?.code === code,
    );
    if (opt) return opt.display;
  }

  return "";
}

// ---------------------------------------------------------------------------
// Duration Helpers
// ---------------------------------------------------------------------------

export const DURATION_UNIT_LABELS: Record<
  (typeof UCUM_TIME_UNITS)[number],
  { singular: string; plural: string; shorthand: string }
> = {
  d: { singular: "day", plural: "days", shorthand: "d" },
  h: { singular: "hour", plural: "hours", shorthand: "h" },
  wk: { singular: "week", plural: "weeks", shorthand: "w" },
  mo: { singular: "month", plural: "months", shorthand: "m" },
  a: { singular: "year", plural: "years", shorthand: "y" },
};

/**
 * Parse a duration string like "5 days", "2w", "3 months" into BoundsDuration.
 */
export function parseDurationString(input: string): BoundsDuration | undefined {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return undefined;

  // Try patterns: "5 days", "5d", "5days", "2 weeks", "2w"
  const match = trimmed.match(/^(\d+\.?\d*)\s*([a-z]*)/);
  if (!match) return undefined;

  const numStr = match[1];
  const unitStr = match[2] || "";

  // Map common strings to UCUM units
  const unitMap: Record<string, (typeof UCUM_TIME_UNITS)[number]> = {
    d: "d",
    day: "d",
    days: "d",
    h: "h",
    hr: "h",
    hrs: "h",
    hour: "h",
    hours: "h",
    w: "wk",
    wk: "wk",
    wks: "wk",
    week: "wk",
    weeks: "wk",
    mo: "mo",
    mos: "mo",
    month: "mo",
    months: "mo",
    y: "a",
    yr: "a",
    yrs: "a",
    year: "a",
    years: "a",
  };

  const unit = unitMap[unitStr];
  if (!unit && unitStr) return undefined;

  return { value: numStr, unit: unit || "d" };
}

/**
 * Generate duration suggestions from what the user has typed.
 */
export function generateDurationSuggestions(
  input: string,
): { value: string; label: string }[] {
  const trimmed = input.trim();

  // Default popular durations when empty
  if (!trimmed) {
    return [
      { value: "3-d", label: "3 days" },
      { value: "5-d", label: "5 days" },
      { value: "7-d", label: "7 days" },
      { value: "10-d", label: "10 days" },
      { value: "14-d", label: "14 days" },
      { value: "1-mo", label: "1 month" },
    ];
  }

  // Extract numeric part
  const numMatch = trimmed.match(/^(\d+\.?\d*)\s*(.*)/);
  if (!numMatch) return [];

  const num = numMatch[1];
  const unitHint = numMatch[2]?.toLowerCase() || "";
  const numVal = parseFloat(num);
  if (isNaN(numVal) || numVal <= 0) return [];

  const suggestions: { value: string; label: string }[] = [];

  // Units to suggest, ordered by likelihood
  const units: (typeof UCUM_TIME_UNITS)[number][] = ["d", "wk", "mo", "a"];
  if (numVal <= 72) units.unshift("h"); // Only show hours for small numbers

  for (const unit of units) {
    const info = DURATION_UNIT_LABELS[unit];
    const label = `${num} ${numVal === 1 ? info.singular : info.plural}`;
    const encodedValue = `${num}-${unit}`;

    // If user typed a unit hint, filter to matching units
    if (unitHint) {
      if (
        info.shorthand.startsWith(unitHint) ||
        info.singular.startsWith(unitHint) ||
        info.plural.startsWith(unitHint) ||
        unit.startsWith(unitHint)
      ) {
        suggestions.push({ value: encodedValue, label });
      }
    } else {
      suggestions.push({ value: encodedValue, label });
    }
  }

  // Smart equivalent: if typing "14", also suggest "2 weeks"
  if (!unitHint) {
    if (numVal % 7 === 0 && numVal >= 7) {
      const weeks = numVal / 7;
      const key = `${weeks}-wk`;
      if (!suggestions.find((s) => s.value === key)) {
        suggestions.push({
          value: key,
          label: `${weeks} ${weeks === 1 ? "week" : "weeks"}`,
        });
      }
    }
    if (numVal % 30 === 0 && numVal >= 30) {
      const months = numVal / 30;
      const key = `${months}-mo`;
      if (!suggestions.find((s) => s.value === key)) {
        suggestions.push({
          value: key,
          label: `${months} ${months === 1 ? "month" : "months"}`,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Decode a duration autocomplete value ("5-d") to BoundsDuration.
 */
export function decodeDurationValue(
  encoded: string,
): BoundsDuration | undefined {
  const [value, unit] = encoded.split("-");
  if (!value || !unit) return undefined;
  if (!UCUM_TIME_UNITS.includes(unit as (typeof UCUM_TIME_UNITS)[number])) {
    return undefined;
  }
  return { value, unit: unit as (typeof UCUM_TIME_UNITS)[number] };
}

/**
 * Encode a BoundsDuration to the autocomplete value format.
 */
export function encodeDurationValue(duration?: BoundsDuration): string {
  if (!duration?.value || duration.value === "0") return "";
  return `${duration.value}-${duration.unit}`;
}

/**
 * Format a BoundsDuration as a human-readable label.
 */
export function formatDurationLabel(duration?: BoundsDuration): string {
  if (!duration?.value || duration.value === "0") return "";
  const info = DURATION_UNIT_LABELS[duration.unit];
  if (!info) return `${duration.value} ${duration.unit}`;
  const numVal = parseFloat(duration.value);
  return `${duration.value} ${numVal === 1 ? info.singular : info.plural}`;
}

// ─── Shared dose-quantity computation helpers ───────────────────────

export function convertToDays(value: string, unit: string): Decimal {
  switch (unit) {
    case "h":
      return divide(value, 24) as Decimal;
    case "d":
      return new Decimal(value);
    case "wk":
      return multiply(value, 7) as Decimal;
    case "mo":
      return multiply(value, 30) as Decimal;
    case "a":
      return multiply(value, 365) as Decimal;
    default:
      return new Decimal(0);
  }
}

export function convertToHours(value: string, unit: string): Decimal {
  switch (unit) {
    case "h":
      return new Decimal(value);
    case "d":
      return multiply(value, 24) as Decimal;
    case "wk":
      return multiply(value, 24 * 7) as Decimal;
    case "mo":
      return multiply(value, 24 * 30) as Decimal;
    case "a":
      return multiply(value, 24 * 365) as Decimal;
    default:
      return new Decimal(0);
  }
}

/**
 * Core computation: total dose quantity for a single dosage instruction.
 * Returns the total as a Decimal, or null if it can't be computed.
 *
 * Handles:
 *  - M-A-N text patterns (sums actual slot values)
 *  - Standard FHIR frequency × period
 *  - Dose ranges (tapered, uses average)
 */
export function computeTotalDoseQuantity(
  instruction: MedicationRequestDosageInstruction,
): Decimal | null {
  const doseValue = instruction.dose_and_rate?.dose_quantity?.value;
  if (!doseValue) return null;

  const repeat = instruction.timing?.repeat;
  if (!repeat?.bounds_duration || !repeat.period_unit) return null;

  const { frequency = 1, period = "1", period_unit, bounds_duration } = repeat;

  // M-A-N text patterns: compute from actual slot values
  if (instruction.text) {
    const slotSum = sumManSlots(instruction.text);
    if (slotSum !== null) {
      const durationDays = convertToDays(
        bounds_duration.value,
        bounds_duration.unit,
      );
      if (durationDays.greaterThan(0)) {
        return multiply(multiply(doseValue, slotSum), durationDays) as Decimal;
      }
    }
    // Not a valid M-A-N pattern -- fall through to standard FHIR computation
  }

  // Standard FHIR: dose × numberOfDoses
  const totalDurationInHours = convertToHours(
    bounds_duration.value,
    bounds_duration.unit,
  );
  const periodInHours = convertToHours(period, period_unit);

  if (isZero(periodInHours)) return null;

  const doseIntervalInHours = divide(periodInHours, frequency);
  if (isZero(doseIntervalInHours)) return null;

  const numberOfDoses = divide(
    totalDurationInHours,
    doseIntervalInHours,
  ).ceil();

  if (instruction.dose_and_rate?.dose_range) {
    const lowDose = instruction.dose_and_rate.dose_range.low.value || "0";
    const highDose = instruction.dose_and_rate.dose_range.high.value || "0";
    const avgDose = divide(add(lowDose, highDose), 2);
    return multiply(avgDose, numberOfDoses) as Decimal;
  }

  return multiply(doseValue, numberOfDoses) as Decimal;
}

// ─── Consumers of computeTotalDoseQuantity ──────────────────────────

export function computeMedicationDispenseQuantity(
  medication: MedicationRequestRead,
): string {
  const DEFAULT_QTY = "1";
  if (!medication.dosage_instruction.length) return DEFAULT_QTY;

  // Sum across all dosage instructions
  let totalQty = 0;
  let hasAnyDose = false;

  for (const instruction of medication.dosage_instruction) {
    const doseValue = instruction.dose_and_rate?.dose_quantity?.value;
    if (!doseValue) continue;

    const unitCode = instruction.dose_and_rate?.dose_quantity?.unit?.code;
    const nonVolumetric = ["{tbl}", "{count}"];
    if (unitCode && !nonVolumetric.includes(unitCode)) continue;

    hasAnyDose = true;

    if (instruction.as_needed_boolean) {
      totalQty += parseFloat(doseValue);
      continue;
    }

    const total = computeTotalDoseQuantity(instruction);
    totalQty += parseFloat(String(total ?? doseValue));
  }

  if (!hasAnyDose) return DEFAULT_QTY;
  return totalQty > 0 ? roundUp(String(totalQty)) : DEFAULT_QTY;
}
