export interface IComment {
  id: string;
  created_by_object: CreatedByObject;
  external_id: string;
  created_date: string;
  modified_date: string;
  comment: string;
  created_by: number;
}

export interface CreatedByObject {
  id: number;
  first_name: string;
  username: string;
  email: string;
  last_name: string;
  user_type: number;
  last_login: string;
}

export interface IResource {
  id: string;
  title: string;
  emergency: boolean;
  status?: string;
  origin_facility_object: {
    name: string;
  };
  external_id: string;

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
  assigned_to_object: {
    id: number;
    first_name: string;
    username: string;
    last_name: string;
    user_type: number;
  };
  created_by_object: {
    id: number;
    first_name: string;
    username: string;
    last_name: string;
    user_type: number;
  };
  created_date: string;
  last_edited_by_object: {
    id: number;
    first_name: string;
    username: string;
    last_name: string;
    user_type: number;
  };
}
