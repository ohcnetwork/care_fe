import { UserBareMinimum } from "@/components/Users/models";

import { FeatureFlag } from "@/Utils/featureFlags";

export interface FacilityModel {
  id?: string;
  name?: string;
  read_cover_image_url?: string;
  facility_type?: string;
  address?: string;
  features?: number[];
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  phone_number?: string;
  middleware_address?: string;
  modified_date?: string;
  created_date?: string;
  geo_organization?: string;
  pincode?: string;
  facility_flags?: FeatureFlag[];
  latitude?: string;
  longitude?: string;
  is_public?: boolean;
}

export type PatientCategory =
  | "Comfort Care" // Discontinued
  | "Mild"
  | "Moderate"
  | "Critical"
  | "Actively Dying";

export type IUserFacilityRequest = {
  facility: string;
};

export type FacilityRequest = Omit<FacilityModel, "location" | "id">;

export interface CommentModel {
  id: string;
  created_by_object: UserBareMinimum;
  created_date: string;
  modified_date: string;
  comment: string;
  created_by: number;
}
