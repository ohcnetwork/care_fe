import { InvestigationValueType } from "@/components/Facility/Investigations";
import { ConsultationModel } from "@/components/Facility/models";

export interface Investigation {
  id: string;
  group_object: any;
  consultation_object: ConsultationModel;
  investigation_object: {
    external_id: string;
    name: string;
    unit: string;
    ideal_value: string;
    min_value: number | null;
    max_value: number | null;
    investigation_type: InvestigationValueType;
    choices: string;
  };
  session_object: {
    session_external_id: string;
    session_created_date: string;
    facility_name: string;
    facility_id: string;
  };
  value: number | null;
  notes: any;
  investigation: number;
  group: any;
  session: number;
}

export type InvestigationResponse = Investigation[];

export interface InvestigationTableData extends Investigation {
  sessionValues: {
    min: number | null;
    max: number | null;
    value: number | null;
  }[];
}
