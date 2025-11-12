import { FileCategory, FileType } from "@/types/files/file";
import {
  ALLERGY_CATEGORY,
  ALLERGY_CLINICAL_STATUS,
  ALLERGY_CRITICALITY,
  ALLERGY_VERIFICATION_STATUS,
} from "../allergyIntolerance/allergyIntolerance";
import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_SEVERITY,
  DIAGNOSIS_VERIFICATION_STATUS,
} from "../diagnosis/diagnosis";
import {
  MEDICATION_REQUEST_INTENT,
  MEDICATION_REQUEST_STATUS,
  MedicationPriority,
} from "../medicationRequest/medicationRequest";
import { ObservationStatus } from "../observation/observation";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_VERIFICATION_STATUS,
} from "../symptom/symptom";

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
  fields: string[];
  filters?: Record<string, string>;
  limit?: number | null;
}

export interface TemplateCreate {
  name: string;
  slug: string;
  status: string;
  format: string;
  facility?: string;
  template_data: string;
  context_config: Record<string, ContextConfig>;
}

export interface BaseTemplateRead {
  id: string;
  name: string;
  slug: string;
  status: string;
  template_type: string;
  format: string;
  created_date: string;
}

export interface TemplateRead extends BaseTemplateRead {
  template_data: string;
  context_config: Record<string, ContextConfig>;
  facility?: string;
  modified_date: string;
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

export interface ReportCreate {
  template_id: string;
  report_type: string;
  associating_id: string;
  patient_id?: string;
  encounter_id?: string;
  context_config: Record<string, ContextConfig> | null;
  output_format: string;
  options: Record<string, string>;
}

export interface ReportRead {
  id: string;
  name: string;
  template: Partial<BaseTemplateRead>;
  report_type: string;
  associating_id: string;
  upload_completed: boolean;
  is_archived: boolean;
  created_date: string;
  meta: Record<string, string>;
}

export interface ReportDownloadRead {
  download_url: string;
  file_name: string;
  mime_type: string;
}

export interface ReportArchiveRead {
  detail: string;
  archived_datetime: string;
  archived_by: string;
}

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
