import {
  DurationSpec,
  QuantitySpec,
  SpecimenDefinitionRead,
  TypeTestedSpec,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export enum SpecimenStatus {
  draft = "draft",
  available = "available",
  unavailable = "unavailable",
  unsatisfactory = "unsatisfactory",
  entered_in_error = "entered_in_error",
}

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
