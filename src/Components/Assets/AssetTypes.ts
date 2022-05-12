export interface AssetLocationObject {
  id: string;
  name: string;
  description: string;
  created_date?: string;
  modified_date?: string;
  facility: {
    id: string;
    name: string;
  };
}

export interface AssetData {
  id: string;
  name: string;
  location: string;
  description: string;
  is_working: boolean;
  not_working_reason: string;
  created_date: string;
  modified_date: string;
  serial_number: string;
  warranty_details: string;
  asset_type: "INTERNAL" | "EXTERNAL";
  location_object: AssetLocationObject;
  status: "ACTIVE" | "TRANSFER_IN_PROGRESS";
  vendor_name: string;
  support_name: string;
  support_email: string;
  support_phone: string;
  qr_code_id: string;
  meta?: {
    [key: string]: any;
  };
}

export interface AssetsResponse {
  count: number;
  next?: string;
  previous?: string;
  results: AssetData[];
}

export interface AssetTransaction {
  id: string;
  asset: {
    id: string;
    name: string;
  };
  from_location: AssetLocationObject;
  to_location: AssetLocationObject;
  performed_by: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    user_type: string;
  };
  created_date: string;
  modified_date: string;
}
