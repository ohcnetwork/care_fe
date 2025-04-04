import { FacilityModel } from "@/components/Facility/models";
import { UserBareMinimum } from "@/components/Users/models";

import { PatientModel } from "@/types/emr/patient";
import { UserBase } from "@/types/user/user";

export interface ResourceRequest {
  approving_facility: FacilityModel | null;
  assigned_facility: FacilityModel | undefined;
  category: string;
  emergency: boolean;
  id: string;
  origin_facility: FacilityModel;
  priority: number;
  reason: string;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  requested_quantity: number;
  status: string;
  title: string;
  assigned_to: UserBase | null;
  created_by: UserBase;
  updated_by: UserBase;
  created_date: string;
  modified_date: string;
  related_patient: PatientModel | null;
}

export interface CreateResourceRequest {
  title: string;
  status: string;
  reason: string;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  approving_facility: string | null;
  assigned_to: string | null;
  assigned_facility: string | null;
  origin_facility: string;
  related_patient: string;
  emergency: boolean;
  priority: number;
  category: string;
}

export interface UpdateResourceRequest {
  id: string;
  title: string;
  reason: string;
  assigned_to: string | null;
  status: string;
  referring_facility_contact_name: string;
  referring_facility_contact_number: string;
  approving_facility: string | null;
  assigned_facility: string | null;
  origin_facility: string;
  related_patient: string;
  emergency: boolean;
  priority: number;
  category: string;
}

export interface CommentModel {
  id: string;
  created_by: UserBareMinimum;
  created_date: string;
  comment: string;
}
