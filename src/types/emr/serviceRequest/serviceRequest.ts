import { Code } from "@/types/base/code/code";
import {
  ActivityDefinitionReadSpec,
  Category,
} from "@/types/emr/activityDefinition/activityDefinition";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { ObservationRead } from "@/types/emr/observation/observation";
import { SpecimenRead } from "@/types/emr/specimen/specimen";
import { LocationList } from "@/types/location/location";
import { UserBase } from "@/types/user/user";

export enum Status {
  draft = "draft",
  active = "active",
  on_hold = "on_hold",
  entered_in_error = "entered_in_error",
  ended = "ended",
  completed = "completed",
  revoked = "revoked",
  unknown = "unknown",
}

export const SERVICE_REQUEST_STATUS_COLORS = {
  draft: "secondary",
  active: "primary",
  on_hold: "yellow",
  entered_in_error: "destructive",
  ended: "secondary",
  completed: "green",
  revoked: "purple",
  unknown: "secondary",
} as const;

export const SERVICE_REQUEST_PRIORITY_COLORS = {
  stat: "secondary",
  urgent: "yellow",
  asap: "destructive",
  routine: "indigo",
} as const;

export enum Intent {
  order = "order",
  proposal = "proposal",
  plan = "plan",
  directive = "directive",
}

export enum Priority {
  routine = "routine",
  urgent = "urgent",
  asap = "asap",
  stat = "stat",
}

export interface BaseServiceRequestSpec {
  id: string;
  title: string;
  status: Status;
  intent: Intent;
  priority: Priority;
  category: Category;
  do_not_perform: boolean;
  note: string | null;
  code: Code;
  body_site: Code | null;
  occurance: string | null;
  patient_instruction: string | null;
}

export interface ServiceRequestCreateSpec
  extends Omit<BaseServiceRequestSpec, "id"> {
  encounter: string;
  locations: string[];
}

export interface ServiceRequestApplyActivityDefinitionSpec {
  encounter: string;
  activity_definition: string;
  service_request: Omit<BaseServiceRequestSpec, "id"> & {
    locations: string[];
  };
}

export interface ServiceRequestUpdateSpec extends BaseServiceRequestSpec {
  encounter: string;
  locations: string[];
}

export interface ServiceRequestReadSpec extends BaseServiceRequestSpec {
  version?: number;
  locations: LocationList[];
  encounter: EncounterRead;
  activity_definition: ActivityDefinitionReadSpec;
  specimens: SpecimenRead[];
  observations?: ObservationRead[];
  diagnostic_reports: DiagnosticReportRead[];
  created_by: UserBase;
  updated_by: UserBase;
  created_date: string;
  updated_at: string;
}

/**
 * Helper function to transform a ServiceRequestReadSpec to ServiceRequestUpdateSpec
 * Useful when updating a service request with modified fields
 */
export function toServiceRequestUpdateSpec(
  request: ServiceRequestReadSpec,
  updates: Partial<ServiceRequestUpdateSpec> = {},
): ServiceRequestUpdateSpec {
  return {
    id: request.id,
    title: request.title,
    status: request.status,
    intent: request.intent,
    priority: request.priority,
    category: request.category,
    do_not_perform: request.do_not_perform,
    note: request.note,
    code: request.code,
    body_site: request.body_site,
    occurance: request.occurance,
    patient_instruction: request.patient_instruction,
    encounter: request.encounter.id,
    locations: request.locations.map((loc) => loc.id),
    ...updates,
  };
}
