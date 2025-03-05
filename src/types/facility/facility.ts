import { Organization } from "@/types/organization/organization";

export interface FacilityBareMinimum {
  id: string;
  name: string;
}

export interface BaseFacility {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  facility_type: string;
  read_cover_image_url?: string;
  cover_image_url?: string;
  features: number[];
  geo_organization?: string;
  is_public: boolean;
  permissions: string[];
}

export type CreateFacility = Omit<BaseFacility, "id" | "permissions">;

export interface FacilityData {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number: string;
  facility_type: string;
  read_cover_image_url?: string;
  features: number[];
  geo_organization: Organization;
  latitude: number;
  longitude: number;
  pincode: number;
  is_public: boolean;
  permissions: string[];
  root_org_permissions: string[];
  child_org_permissions: string[];
}
