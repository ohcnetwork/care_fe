import { Code } from "@/types/base/code/code";
import {
  DurationSpec,
  QuantitySpec,
  SpecimenDefinitionRead,
  TypeTestedSpec,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import { UserBase } from "@/types/user/user";

export enum SpecimenStatus {
  draft = "draft",
  available = "available",
  unavailable = "unavailable",
  unsatisfactory = "unsatisfactory",
  entered_in_error = "entered_in_error",
}

export const SPECIMEN_STATUS_COLOR_MAP: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-200",
  unavailable: "bg-orange-100 text-orange-800 border-orange-200",
  unsatisfactory: "bg-yellow-100 text-yellow-800 border-yellow-200",
  received: "bg-blue-100 text-blue-800 border-blue-200",
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
};

export interface SpecimenDiscardReason {
  status: SpecimenStatus;
  label: string;
  description: string;
}

export const SPECIMEN_DISCARD_REASONS: SpecimenDiscardReason[] = [
  {
    status: SpecimenStatus.unavailable,
    label: "Unavailable",
    description: "The specimen is lost, destroyed, or consumed",
  },
  {
    status: SpecimenStatus.unsatisfactory,
    label: "Unsatisfactory",
    description: "The specimen is unusable due to quality issues",
  },
  {
    status: SpecimenStatus.entered_in_error,
    label: "Entered in Error",
    description: "The specimen record was created by mistake",
  },
];

export interface CollectionSpec {
  collector: string | null;
  collected_date_time: string | null;
  quantity: QuantitySpec | null;
  method: Code | null;
  procedure: string | null;
  body_site: Code | null;
  fasting_status_codeable_concept: Code | null;
  fasting_status_duration: DurationSpec | null;
}

export interface ProcessingSpec {
  description: string;
  method: Code | null;
  performer: string | null;
  time_date_time: string | null;
}

export interface SpecimenBase {
  id: string;
  accession_identifier: string;
  status: SpecimenStatus;
  specimen_type: Code | null;
  received_time: string | null;
  collection: CollectionSpec | null;
  processing: ProcessingSpec[];
  condition: Code[];
  note: string | null;
}

export interface SpecimenFromDefinitionCreate {
  specimen_definition: string;
  specimen: Omit<SpecimenBase, "id">;
}

export interface SpecimenRead extends SpecimenBase {
  created_by: UserBase;
  updated_by: UserBase;
  created_at: string;
  updated_at: string;
  type_tested: TypeTestedSpec | null;
  specimen_definition: SpecimenDefinitionRead;
}

export function getActiveAndDraftSpecimens(
  specimens: SpecimenRead[],
): SpecimenRead[] {
  return (
    specimens.filter(
      (specimen) =>
        specimen.status === SpecimenStatus.available ||
        specimen.status === SpecimenStatus.draft,
    ) || []
  );
}
