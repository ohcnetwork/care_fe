import type { TFunction } from "i18next";

import dayjs from "@/Utils/dayjs";
import { BatchRequestObject } from "@/Utils/request/batch";
import { Code } from "@/types/base/code/code";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import {
  SpecimenFromDefinitionCreate,
  SpecimenRead,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import {
  QuantitySpec,
  SpecimenDefinitionRead,
  specimenCollectionDefaults,
} from "@/types/emr/specimenDefinition/specimenDefinition";

/** A requirement still to collect, with the draft made for its label if any. */
export interface PendingSpecimen {
  key: string;
  request: ServiceRequestReadSpec;
  requirement: SpecimenDefinitionRead;
  draft?: SpecimenRead;
}

/** A requirement that already has its collected specimen. */
export interface CollectedSpecimen {
  key: string;
  request: ServiceRequestReadSpec;
  requirement: SpecimenDefinitionRead;
  specimen: SpecimenRead;
}

/** What is entered for one test. */
export interface SpecimenEntry {
  accessionIdentifier: string;
  quantityValue: number | null;
  quantityUnit: Code | null;
  /** A datetime-local value, now by default; emptied, it saves as now. */
  collectedAt: string;
  method: Code | null;
  bodySite: Code | null;
  fastingStatus: Code | null;
  fastingHours: number | null;
  note: string;
}

export type SpecimenEntryErrors = Partial<
  Record<
    "accessionIdentifier" | "quantityValue" | "quantityUnit" | "fastingHours",
    string
  >
>;

// The lab's scan lookup rejects shorter IDs.
export const MIN_ACCESSION_IDENTIFIER_LENGTH = 5;

// `scanner` is the batch sheet's rules (5+ character IDs, a time always set);
// the request page keeps its old collection form's checks.

// CLSI order of draw by HL7 container-cap code; other caps go last.
const ORDER_OF_DRAW = [
  "yellow",
  "light-blue",
  "black",
  "red",
  "dark-yellow",
  "green",
  "light-green",
  "brown",
  "lavender",
  "pink",
  "white",
  "grey",
];

export const CAP_COLORS: Record<string, string> = {
  yellow: "bg-yellow-300",
  "light-blue": "bg-sky-300",
  black: "bg-black",
  red: "bg-red-600",
  "dark-yellow": "bg-yellow-600",
  green: "bg-green-600",
  "light-green": "bg-green-300",
  brown: "bg-amber-800",
  lavender: "bg-purple-300",
  pink: "bg-pink-300",
  white: "bg-white",
  grey: "bg-gray-400",
};

// Sizes picker buttons like the rows' inputs; phones wrap long values.
export const COMPACT_PICKER =
  "[&>button]:h-auto [&>button]:min-h-12 md:[&>button]:min-h-10 [&>button]:min-w-0 [&>button]:bg-white [&>button]:px-3 [&>button]:py-1.5 [&>button]:tracking-normal";

const HOUR = {
  code: "h",
  display: "hour",
  system: "http://unitsofmeasure.org",
};

/** Pairs a request's requirements with its specimens, collected or still to collect. */
export function matchRequirements(
  request: ServiceRequestReadSpec,
  requirements: SpecimenDefinitionRead[],
) {
  const pending: PendingSpecimen[] = [];
  const collected: CollectedSpecimen[] = [];
  const used = new Set<string>();
  requirements.forEach((requirement, index) => {
    const matching = request.specimens.filter(
      (specimen) =>
        specimen.specimen_definition?.id === requirement.id &&
        !used.has(specimen.id),
    );
    const specimen =
      matching.find(({ status }) => status === SpecimenStatus.available) ??
      matching.find(({ status }) => status === SpecimenStatus.draft);
    if (specimen) used.add(specimen.id);
    const key = `${request.id}-${index}`;
    if (specimen?.status === SpecimenStatus.available) {
      collected.push({ key, request, requirement, specimen });
    } else {
      pending.push({ key, request, requirement, draft: specimen });
    }
  });
  return { pending, collected };
}

/** What a specimen definition asks for, as the label and value pairs it sets. */
export function requirementDetails(
  requirement: SpecimenDefinitionRead,
  t: TFunction,
) {
  const container = requirement.type_tested?.container;
  const minimumVolume = container?.minimum_volume;
  const rows: [string, string | null | undefined][] = [
    [t("required_type"), requirement.type_collected?.display],
    [
      t("required_method"),
      requirement.collection?.method?.display ??
        requirement.collection?.code?.display,
    ],
    [t("container"), container?.description],
    [t("capacity"), formatQuantity(container?.capacity)],
    [
      t("min_volume"),
      minimumVolume?.string || formatQuantity(minimumVolume?.quantity),
    ],
    [t("preparation"), container?.preparation],
    [
      t("patient_prep"),
      requirement.patient_preparation?.map(({ display }) => display).join(", "),
    ],
    [t("retention"), formatQuantity(requirement.type_tested?.retention_time)],
    [t("requirement"), requirement.type_tested?.requirement],
  ];
  return rows.filter((row): row is [string, string] => !!row[1]);
}

export function formatQuantity(quantity?: QuantitySpec | null) {
  return quantity
    ? `${Number(quantity.value)} ${quantity.unit.display || quantity.unit.code}`
    : null;
}

export function drawOrder(requirement: SpecimenDefinitionRead) {
  const index = ORDER_OF_DRAW.indexOf(
    requirement.type_tested?.container?.cap?.code ?? "",
  );
  return index === -1 ? ORDER_OF_DRAW.length : index;
}

export function initialEntry(
  requirement: SpecimenDefinitionRead,
  draft?: SpecimenRead,
): SpecimenEntry {
  // As in develop's form: a draft's collection wins over the template, and an
  // invalid template quantity stays editable without reaching the draft.
  const collection = draft?.collection ?? requirement.collection;
  const defaults = specimenCollectionDefaults(collection);
  const quantity = defaults.quantity ?? collection?.quantity ?? null;
  return {
    accessionIdentifier: "",
    quantityValue: quantity ? Number(quantity.value) : null,
    quantityUnit:
      quantity?.unit ??
      requirement.type_tested?.container?.capacity?.unit ??
      null,
    collectedAt: dayjs().format("YYYY-MM-DDTHH:mm"),
    method: defaults.method,
    bodySite: defaults.body_site,
    fastingStatus: null,
    fastingHours: null,
    note: "",
  };
}

export function validateEntry(
  entry: SpecimenEntry,
  t: TFunction,
  scanner = true,
): SpecimenEntryErrors {
  const errors: SpecimenEntryErrors = {};
  const id = entry.accessionIdentifier.trim();
  if (scanner && id && id.length < MIN_ACCESSION_IDENTIFIER_LENGTH) {
    errors.accessionIdentifier = t("min_char_length_error", {
      min_length: MIN_ACCESSION_IDENTIFIER_LENGTH,
    });
  }
  const { quantityValue: value, quantityUnit: unit } = entry;
  // The old form counted 0 as no quantity.
  if (value === null || (!scanner && value === 0)) {
    if (unit) errors.quantityValue = t("field_required");
  } else {
    if (!unit) errors.quantityUnit = t("field_required");
    // The backend takes whole numbers only.
    if (value < 1 || !Number.isInteger(value)) {
      errors.quantityValue = t("invalid_quantity");
    }
  }
  const hours = entry.fastingHours;
  if (hours !== null && (!Number.isInteger(hours) || (scanner && hours < 0))) {
    errors.fastingHours = t("invalid_value");
  }
  return errors;
}

/** Saves one collected test: updates its draft if it has one, else creates it. */
export function collectRequest(
  facilityId: string,
  { key, request, requirement, draft }: PendingSpecimen,
  entry: SpecimenEntry,
  collector: string,
  scanner = true,
): BatchRequestObject {
  const { quantityValue: value, quantityUnit: unit } = entry;
  const collectedAt = entry.collectedAt ? dayjs(entry.collectedAt) : null;
  const specimen: SpecimenFromDefinitionCreate["specimen"] = {
    status: SpecimenStatus.available,
    specimen_type: requirement.type_collected,
    // When empty, a draft keeps its ID and a new specimen gets one from the backend.
    accession_identifier:
      entry.accessionIdentifier.trim() || (draft?.accession_identifier ?? ""),
    received_time: null,
    note: entry.note.trim() || null,
    collection: {
      method: entry.method ?? draft?.collection?.method ?? null,
      // The sheet saves an emptied time as now; the old form saved it empty.
      collected_date_time: collectedAt
        ? collectedAt.toISOString()
        : scanner
          ? dayjs().toISOString()
          : null,
      quantity: value !== null && unit ? { value: String(value), unit } : null,
      procedure: null,
      body_site: entry.bodySite,
      fasting_status_codeable_concept: entry.fastingStatus,
      fasting_status_duration:
        entry.fastingHours !== null
          ? { value: String(entry.fastingHours), unit: HOUR }
          : null,
      collector,
    },
    processing: draft?.processing ?? [],
    condition: draft?.condition ?? [],
  };
  return draft
    ? {
        api: specimenApi.updateSpecimen,
        pathParams: { facilityId, specimenId: draft.id },
        referenceId: key,
        body: { ...draft, ...specimen },
      }
    : {
        api: specimenApi.createSpecimenFromDefinition,
        pathParams: { facilityId, serviceRequestId: request.id },
        referenceId: key,
        body: { specimen_definition: requirement.id, specimen },
      };
}
