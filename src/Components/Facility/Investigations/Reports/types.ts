import { InvestigationValueType } from "..";

export interface Investigation {
  id: string;
  group_object: any;
  investigation_object: {
    external_id: string,
    name: string;
    unit: string;
    ideal_value: string;
    min_value: number | null;
    max_value: number | null;
    investigation_type: InvestigationValueType;
    choices: string;
  },
  session_object: {
    session_external_id: string;
    session_created_date: string;
  },
  value: number | null,
  notes: any,
  investigation: number,
  group: any,
  consultation: number,
  session: number,
}

export type InvestigationResponse = Investigation[]

export interface InvestigationTableData extends Investigation {
  sessionValues: {
    min: number | null;
    max: number | null;
    value: number | null;
  }[]
}