import { BedModel, FacilityModel } from "@/components/Facility/models";
import { UserBareMinimum } from "@/components/Users/models";

import { PatientCategoryID } from "@/common/constants";

import { UserBase } from "@/types/user/base";

export const ENCOUNTER_SUGGESTIONS = [
  "A", // Admit
  "R", // Refer
  "OP", // Outpatient
  "DC", // Domiciliary Care
  "DD", // Death
] as const;

export type EncounterSuggestion = (typeof ENCOUNTER_SUGGESTIONS)[number];

export const ROUTE_TO_FACILITY = [
  10, // Direct
  20, // Referred
  30, // Transfer
] as const;

export type RouteToFacility = (typeof ROUTE_TO_FACILITY)[number];

export interface Encounter {
  id: string;
  patient: string;
  facility: string;
  created_by: UserBase;
  updated_by: UserBase;
  created_date: string;
  modified_date: string;

  suggestion: EncounterSuggestion;
  route_to_facility?: RouteToFacility;

  // Admission details
  admitted: boolean;
  admitted_to?: string;
  category: PatientCategoryID;
  encounter_date: string;
  icu_admission_date?: string;
  discharge_date: string | null;
  patient_no: string;
  current_bed?: { bed_object: BedModel };

  // Referral details
  referred_to?: string;
  referred_to_object?: FacilityModel;
  referred_to_external?: string;
  referred_from_facility?: string;
  referred_from_facility_object?: FacilityModel;
  referred_from_facility_external?: string;
  referred_by_external?: string;
  transferred_from_location?: string;

  // Doctor details
  treating_physician: string;
  treating_physician_object: UserBareMinimum | null;
  assigned_to?: string;
  assigned_to_object?: UserBareMinimum;

  // Death details
  new_discharge_reason?: number;
  discharge_notes?: string; // cause_of_death
  death_datetime?: string;
  death_confirmed_doctor?: string;

  // Other flags
  kasp_enabled_date: string | null;
}

export interface EncounterRequest {
  suggestion: EncounterSuggestion;
  route_to_facility?: RouteToFacility;

  patient: string;
  facility: string;
  admitted: boolean;
  category: string;
  encounter_date: string;
  icu_admission_date?: string;
  patient_no: string | null;
  bed?: string;

  referred_to?: string;
  referred_to_external?: string;
  referred_from_facility?: string;
  referred_from_facility_external?: string;
  referred_by_external?: string;
  transferred_from_location?: string;

  treating_physician: string;
  assigned_to?: string;

  // Death details
  new_discharge_reason?: number;
  discharge_notes?: string;
  death_datetime?: string;
  death_confirmed_doctor?: string;
}
