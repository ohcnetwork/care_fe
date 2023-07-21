import { BedModel } from "../Facility/models";
import { PatientModel } from "../Patient/models";

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

export const assetClassProps = {
  ONVIF: {
    name: "ONVIF Camera",
    description: "",
    icon: "camera",
  },
  HL7MONITOR: {
    name: "HL7 Vitals Monitor",
    description: "",
    icon: "monitor-heart-rate",
  },
  VENTILATOR: {
    name: "Ventilator",
    description: "",
    icon: "lungs",
  },
  NONE: {
    name: "N/A",
    icon: "box",
  },
};

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
  last_serviced_on: string;
  notes: string;
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

export interface AssetUptimeRecord {
  id: string;
  asset: {
    id: string;
    name: string;
  };
  status: string;
  timestamp: string;
  created_date: string;
  modified_date: string;
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
}

export interface PatientAssetBed {
  asset: AssetData;
  bed: BedModel;
  patient?: PatientModel;
  meta?: Record<string, any>;
}
