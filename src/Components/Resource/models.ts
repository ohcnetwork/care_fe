import { PerformedByModel } from "../HCX/misc";

export interface IComment {
  id: string;
  created_by_object: PerformedByModel;
  created_date: string;
  modified_date: string;
  comment: string;
  created_by: number;
}

export interface IResource {
  id: string;
  title: string;
  emergency: boolean;
  status?: string;
  origin_facility_object: {
    name: string;
  };
  approving_facility_object: {
    name: string;
  };
  assigned_facility_object: {
    name: string;
  };
  assigned_quantity: number;
  modified_date: string;
  category: any;
  sub_category: number;
  origin_facility: string;
  approving_facility: string;
  assigned_facility: string;
  reason: string;
  refering_facility_contact_name: string;
  refering_facility_contact_number: string;
  requested_quantity: number;
  assigned_to_object: PerformedByModel;
  created_by_object: PerformedByModel;
  created_date: string;
  last_edited_by_object: PerformedByModel;
}
