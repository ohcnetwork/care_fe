import { IconName } from "@/CAREUI/icons/CareIcon";

import { BedModel } from "@/components/Facility/models";
import { PatientModel } from "@/components/Patient/models";
import { UserBareMinimum } from "@/components/Users/models";

export enum AssetLocationType {
  OTHER = "OTHER",
  WARD = "WARD",
  ICU = "ICU",
}

export interface AssetLocationObject {
  id?: string;
  name: string;
  description: string;
  created_date?: string;
  modified_date?: string;
  location_type: AssetLocationType;
  middleware_address?: string;
  facility?: {
    id: string;
    name: string;
  };
}

export enum AssetType {
  NONE = "NONE",
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

export enum AssetClass {
  NONE = "NONE",
  ONVIF = "ONVIF",
  HL7MONITOR = "HL7MONITOR",
  VENTILATOR = "VENTILATOR",
}

export const AssetStatus = {
  not_monitored: "Not Monitored",
  operational: "Operational",
  down: "Down",
  maintenance: "Under Maintenance",
};

export const assetClassProps: {
  [key in AssetClass]: {
    name: string;
    description?: string;
    icon: IconName;
  };
} = {
  ONVIF: {
    name: "ONVIF Camera",
    description: "",
    icon: "l-camera",
  },
  HL7MONITOR: {
    name: "HL7 Vitals Monitor",
    description: "",
    icon: "l-monitor-heart-rate",
  },
  VENTILATOR: {
    name: "Ventilator",
    description: "",
    icon: "l-lungs",
  },
  NONE: {
    name: "N/A",
    icon: "l-box",
  },
};

export interface AssetService {
  id: string;
  created_date: string;
  modified_date: string;
  serviced_on: string;
  note: string;
}

export interface ResolvedMiddleware {
  hostname: string;
  source: "asset" | "location" | "facility";
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
  asset_type: AssetType;
  asset_class?: AssetClass;
  location_object: AssetLocationObject;
  status: "ACTIVE" | "TRANSFER_IN_PROGRESS";
  vendor_name: string;
  support_name: string;
  support_email: string;
  support_phone: string;
  qr_code_id: string;
  manufacturer: string;
  warranty_amc_end_of_validity: string;
  resolved_middleware?: ResolvedMiddleware;
  latest_status: string;
  last_service: AssetService;
  meta?: {
    middleware_hostname?: string;
    local_ip_address?: string;
    camera_access_key?: string;
    [key: string]: any;
  };
}

export interface AssetsResponse {
  count: number;
  next?: string;
  previous?: string;
  results: AssetData[];
}

export interface AvailabilityRecord {
  linked_id: string;
  linked_model: string;
  status: string;
  timestamp: string;
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

export interface AssetBedModel {
  id: string;
  asset_object: AssetData;
  bed_object: BedModel;
  created_date: string;
  modified_date: string;
  meta: Record<string, any>;
  asset?: string;
  bed?: string;
}

export type AssetBedBody = Partial<AssetBedModel>;

export interface AssetServiceEdit {
  id: string;
  asset_service: AssetService;
  serviced_on: string;
  note: string;
  edited_on: string;
  edited_by: UserBareMinimum;
}
export interface AssetService {
  id: string;
  asset: {
    id: string;
    name: string;
  };
  serviced_on: string;
  note: string;
  edits: AssetServiceEdit[];
  created_date: string;
  modified_date: string;
}

export interface PatientAssetBed {
  asset: AssetData;
  bed: BedModel;
  patient?: PatientModel;
  meta?: Record<string, any>;
}

export interface AssetServiceUpdate {
  external_id: string;
  serviced_on: string;
  note: string;
}
