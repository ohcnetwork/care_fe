import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { LocationList } from "@/types/location/location";

// import { Code } from "@/types/questionnaire/code";

export interface StylingMetadata {
  careIcon?: string;
}

export enum InternalType {
  pharmacy = "pharmacy",
  lab = "lab",
  scheduling = "scheduling",
}

export interface BaseHealthcareServiceSpec {
  id: string;
  //   service_type: Code
  name: string;
  styling_metadata: StylingMetadata;
  extra_details: string;
  internal_type?: InternalType;
}

export interface HealthcareServiceCreateSpec
  extends Omit<BaseHealthcareServiceSpec, "id"> {
  facility: string;
  locations: string[];
  managing_organization?: string;
}

export interface HealthcareServiceUpdateSpec extends BaseHealthcareServiceSpec {
  facility: string;
  locations: string[];
  managing_organization?: string;
}

export interface HealthcareServiceReadSpec extends BaseHealthcareServiceSpec {
  version?: number;
  locations: LocationList[];
  managing_organization: FacilityOrganizationRead | null;
}
