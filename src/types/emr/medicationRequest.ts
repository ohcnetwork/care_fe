import { UserBareMinimum } from "@/components/Users/models";

import { Code } from "@/types/questionnaire/code";

export const DOSAGE_UNITS_CODES = [
  {
    code: "{tbl}",
    display: "tablets",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "mg",
    display: "milligram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "g",
    display: "gram",
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
    code: "ug",
    display: "microgram",
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
  "on-hold",
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
  value: number;
  unit: Code;
}

export interface BoundsDuration {
  value: number;
  unit: (typeof UCUM_TIME_UNITS)[number];
}

export interface DoseRange {
  low: DosageQuantity;
  high: DosageQuantity;
}

export interface Timing {
  repeat: {
    frequency: number;
    period: number;
    period_unit: (typeof UCUM_TIME_UNITS)[number];
    bounds_duration: BoundsDuration;
  };
  code: Code;
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
}

export interface MedicationRequestRead {
  id: string;
  status: MedicationRequestStatus;
  status_reason?: MedicationRequestStatusReason;
  intent: MedicationRequestIntent;
  category: "inpatient" | "outpatient" | "community" | "discharge";
  priority: "stat" | "urgent" | "asap" | "routine";
  do_not_perform: boolean;
  medication: Code;
  encounter: string;
  dosage_instruction: MedicationRequestDosageInstruction[];
  note?: string;
  created_date: string;
  modified_date: string;
  created_by: UserBareMinimum;
  updated_by: UserBareMinimum;
  authored_on: string;
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
        period: 1,
        period_unit: "d",
        bounds_duration: {
          value: 1,
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
        period: 1,
        period_unit: "d",
        bounds_duration: {
          value: 1,
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
        period: 1,
        period_unit: "d",
        bounds_duration: {
          value: 1,
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
        period: 1,
        period_unit: "d",
        bounds_duration: {
          value: 1,
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
  PM: {
    display: "PM (0-0-1)",
    timing: {
      repeat: {
        frequency: 1,
        period: 1,
        period_unit: "d",
        bounds_duration: {
          value: 1,
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
  QD: {
    display: "QD (Once a day)",
    timing: {
      repeat: {
        frequency: 1,
        period: 1,
        period_unit: "d",
        bounds_duration: {
          value: 1,
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
        period: 2,
        period_unit: "d",
        bounds_duration: {
          value: 2,
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
        period: 1,
        period_unit: "h",
        bounds_duration: {
          value: 1,
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
        period: 2,
        period_unit: "h",
        bounds_duration: {
          value: 1,
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
        period: 3,
        period_unit: "h",
        bounds_duration: {
          value: 1,
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
        period: 4,
        period_unit: "h",
        bounds_duration: {
          value: 1,
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
        period: 6,
        period_unit: "h",
        bounds_duration: {
          value: 1,
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
        period: 8,
        period_unit: "h",
        bounds_duration: {
          value: 1,
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
  BED: {
    display: "BED (0-0-1)",
    timing: {
      repeat: {
        frequency: 1,
        period: 1,
        period_unit: "d",
        bounds_duration: {
          value: 1,
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
        period: 1,
        period_unit: "wk",
        bounds_duration: {
          value: 1,
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
        period: 1,
        period_unit: "mo",
        bounds_duration: {
          value: 1,
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
  medication: Code,
): MedicationRequest {
  const medicationRequest: MedicationRequest = {
    do_not_perform: false,
    dosage_instruction: [
      {
        as_needed_boolean: false,
      },
    ],
    medication,
    status: "active",
    intent: "order",
    category: "inpatient",
    priority: "routine",
    authored_on: new Date().toISOString(),
  };

  return medicationRequest;
}
