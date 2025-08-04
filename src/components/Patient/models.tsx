import {
  DOMESTIC_HEALTHCARE_SUPPORT_CHOICES,
  OCCUPATION_TYPES,
  SOCIOECONOMIC_STATUS_CHOICES,
} from "@/common/constants";

export interface AssignedToObjectModel {
  first_name: string;
  last_name: string;
  last_login?: string;
  alt_phone_number?: string;
  user_type: string;
}

export interface PatientMeta {
  readonly id: number;
  occupation?: Occupation;
  socioeconomic_status?: (typeof SOCIOECONOMIC_STATUS_CHOICES)[number];
  domestic_healthcare_support?: (typeof DOMESTIC_HEALTHCARE_SUPPORT_CHOICES)[number];
}

export type Occupation = (typeof OCCUPATION_TYPES)[number]["value"];
