import { SlugConfig } from "@/types/base/slug/slugConfig";
import {
  ALLERGY_CATEGORY,
  ALLERGY_CLINICAL_STATUS,
  ALLERGY_CRITICALITY,
  ALLERGY_VERIFICATION_STATUS,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_SEVERITY,
  DIAGNOSIS_VERIFICATION_STATUS,
} from "@/types/emr/diagnosis/diagnosis";
import {
  MEDICATION_REQUEST_INTENT,
  MEDICATION_REQUEST_STATUS,
  MedicationPriority,
} from "@/types/emr/medicationRequest/medicationRequest";
import { ObservationStatus } from "@/types/emr/observation/observation";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_VERIFICATION_STATUS,
} from "@/types/emr/symptom/symptom";
import { FileCategory, FileType } from "@/types/files/file";

export interface TemplateSchemaRead {
  single_objects: SingleObjectSchema;
  querysets: QuerySetSchema;
}

export type SingleObjectSchema = {
  [key: string]: SingleObjectAttributeSchema;
};

export interface FieldSchema {
  key: string;
  display: string;
  preview_value: string;
  description: string;
}

export interface SingleObjectAttributeSchema {
  display: string;
  fields: FieldSchema[];
  depends_on: string[];
  description: string;
  allowed_filters: string[];
}

export type QuerySetSchema = {
  [key: string]: QuerySetAttributeSchema;
};

export interface QuerySetAttributeSchema {
  display: string;
  fields: FieldSchema[];
  depends_on: string[];
  description: string;
  allowed_filters: string[];
  preview_value: string[] | Record<string, string>[];
}

export interface ContextConfig {
  filters?: Record<string, string>;
  limit?: number | null;
}

export const TemplateStatuses = ["draft", "active", "retired"] as const;
export type TemplateStatus = (typeof TemplateStatuses)[number];

export const TemplateFormats = ["html", "pdf"] as const;
export type TemplateFormat = (typeof TemplateFormats)[number];
export const TemplateTypes = ["discharge_summary"] as const;
export type TemplateType = (typeof TemplateTypes)[number];
export interface TemplateBase {
  id: string;
  name: string;
  status: TemplateStatus;
  template_type: TemplateType;
  default_format: TemplateFormat;
  created_date: string;
}

export interface TemplateBaseRead extends TemplateBase {
  slug: string;
  slug_config: SlugConfig;
}

export interface TemplateRead extends TemplateBaseRead {
  template_data: string;
  context_config: Record<string, ContextConfig>;
  facility?: string;
  modified_date: string;
}

export interface TemplateCreate
  extends Omit<TemplateBase, "id" | "created_date"> {
  slug_value: string;
  facility?: string;
  template_data: string;
  context_config: Record<string, ContextConfig>;
}

export interface TemplatePreviewCreate {
  template_data: string;
  context_config: Record<string, ContextConfig>;
  output_format: string;
  options: Record<string, string>;
}

export interface TemplatePreviewRead {
  html: string;
  validation: {
    syntax_valid: boolean;
    syntax_error: string | null;
    variables: string[];
    render_valid: boolean;
    render_error: string | null;
  };
}

//eslint-disable-next-line @typescript-eslint/no-unused-vars
const FILTER_CONFIG = {
  allergies: {
    clinical_status: {
      options: ALLERGY_CLINICAL_STATUS,
    },
    verification_status: {
      options: ALLERGY_VERIFICATION_STATUS,
    },
    category: {
      options: ALLERGY_CATEGORY,
    },
    criticality: {
      options: ALLERGY_CRITICALITY,
    },
  },
  care_team: {
    user_type: {
      options: ["doctor", "nurse", "staff", "volunteer", "administrator"],
    },
    diagnosis: {
      clinical_status: {
        options: DIAGNOSIS_CLINICAL_STATUS,
      },
      verification_status: {
        options: DIAGNOSIS_VERIFICATION_STATUS,
      },
      severity: {
        options: DIAGNOSIS_SEVERITY,
      },
    },
    symptoms: {
      clinical_status: {
        options: SYMPTOM_CLINICAL_STATUS,
      },
      verification_status: {
        options: SYMPTOM_VERIFICATION_STATUS,
      },
      severity: {
        options: SYMPTOM_SEVERITY,
      },
    },
    file_uploads: {
      file_category: {
        options: Object.keys(FileCategory),
      },
      file_type: {
        options: Object.keys(FileType),
      },
    },
    medications: {
      status: {
        options: MEDICATION_REQUEST_STATUS,
      },
      intent: {
        options: MEDICATION_REQUEST_INTENT,
      },
      priority: {
        options: Object.keys(MedicationPriority),
      },
      authored_on: {
        options: [
          "today",
          "yesterday",
          "last_7_days",
          "last_30_days",
          "last_90_days",
          "last_180_days",
          "last_365_days",
        ],
      },
    },
    observations: {
      status: {
        options: Object.keys(ObservationStatus),
      },
    },
  },
};
