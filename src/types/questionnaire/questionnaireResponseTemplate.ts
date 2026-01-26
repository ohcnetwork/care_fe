import { MedicationRequestTemplateSpec } from "@/types/emr/medicationRequest/medicationRequest";
import { BaseServiceRequestSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { UserReadMinimal } from "@/types/user/user";

interface QuestionnaireAnswer {
  question_id: string;
  answer: Record<string, unknown>;
  meta: Record<string, unknown>;
}

/**
 * Service request data stored in templates.
 * Omits instance-specific fields (id, encounter) that will be set when applied.
 */
export interface ActivityDefinitionTemplateSpec {
  slug: string;
  service_request: Omit<BaseServiceRequestSpec, "id"> & {
    locations?: string[];
  };
}

interface TemplateData {
  medication_request?: MedicationRequestTemplateSpec[];
  questionnaire?: QuestionnaireAnswer[];
  activity_definition?: ActivityDefinitionTemplateSpec[];
  meta?: Record<string, unknown>;
}

interface QuestionnaireResponseTemplateBaseSpec {
  id?: string;
  template_data: TemplateData;
  name: string;
  description: string;
}

export interface QuestionnaireResponseTemplateCreateSpec extends QuestionnaireResponseTemplateBaseSpec {
  questionnaire?: string;
  facility?: string;
  users: string[];
  facility_organizations: string[];
}

export interface QuestionnaireResponseTemplateUpdateSpec extends QuestionnaireResponseTemplateBaseSpec {
  users: string[];
  facility_organizations: string[];
}

export interface QuestionnaireResponseTemplateReadSpec extends QuestionnaireResponseTemplateBaseSpec {
  created_date: string;
  modified_date: string;
}

export interface QuestionnaireResponseTemplateRetrieveSpec extends QuestionnaireResponseTemplateReadSpec {
  users: UserReadMinimal[];
  facility_organizations: FacilityOrganizationRead[];
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}
