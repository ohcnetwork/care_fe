import { Code } from "@/types/base/code/code";
import {
  DurationSpec,
  QuantitySpec,
  SpecimenDefinitionRead,
  TypeTestedSpec,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import { UserReadMinimal } from "@/types/user/user";

export enum SpecimenStatus {
  draft = "draft",
  available = "available",
  unavailable = "unavailable",
  unsatisfactory = "unsatisfactory",
  entered_in_error = "entered_in_error",
}

export const SPECIMEN_STATUS_COLORS = {
  available: "green",
  unavailable: "orange",
  unsatisfactory: "yellow",
  draft: "secondary",
  entered_in_error: "destructive",
} as const satisfies Record<SpecimenStatus, string>;

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

export interface CollectionReadSpec extends CollectionSpec {
  collector_object?: UserReadMinimal | null;
}

export interface ProcessingSpec {
  description: string;
  method: Code | null;
  performer: string | null;
  time_date_time: string | null;
}

export interface ProcessingReadSpec extends ProcessingSpec {
  performer_object?: UserReadMinimal | null;
}

export interface SpecimenBase {
  id: string;
  accession_identifier: string;
  status: SpecimenStatus;
  specimen_type: Code | null;
  received_time: string | null;
  collection: CollectionReadSpec | null;
  processing: ProcessingSpec[];
  condition: Code[];
  note: string | null;
}

export interface SpecimenFromDefinitionCreate {
  specimen_definition: string;
  specimen: Omit<SpecimenBase, "id">;
}

export interface SpecimenRead extends SpecimenBase {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
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
