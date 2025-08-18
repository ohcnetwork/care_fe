import { VariantProps } from "class-variance-authority";

import { IconName } from "@/CAREUI/icons/CareIcon";

import { badgeVariants } from "@/components/ui/badge";

import { Code } from "@/types/base/code/code";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import { FacilityPermissions } from "@/types/emr/permission/permission";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

export interface FacilityBareMinimum {
  id: string;
  name: string;
}

export interface FacilityBase extends FacilityBareMinimum {
  description: string;
  address: string;
  phone_number: string;
  facility_type: string;
  is_public: boolean;
  latitude?: string;
  longitude?: string;
  middleware_address?: string;
  pincode?: number;
}

export interface FacilityPublicRead extends FacilityBase {
  features: number[];
  read_cover_image_url?: string;
  cover_image_url?: string;
  geo_organization: Organization;
}

export interface FacilityRead extends FacilityBase, FacilityPermissions {
  id: string;
  read_cover_image_url?: string;
  cover_image_url?: string;
  created_date?: string;
  modified_date?: string;
  geo_organization: Organization;
  instance_discount_codes: Code[];
  instance_discount_monetary_components: MonetaryComponentRead[];
  instance_informational_codes: Code[];
  instance_tax_codes: Code[];
  instance_tax_monetary_components: MonetaryComponentRead[];
  invoice_number_expression: string;
  discount_codes: Code[];
  discount_monetary_components: MonetaryComponentRead[];
  patient_instance_identifier_configs: PatientIdentifierConfig[];
  patient_facility_identifier_configs: PatientIdentifierConfig[];
  features: number[];
}

export type FacilityListRead = Omit<
  FacilityRead,
  "permissions" | "root_org_permissions" | "child_org_permissions"
>;

export interface FacilityCreate extends Omit<FacilityBase, "id"> {
  geo_organization: string;
  features: number[];
}

export const FACILITY_FEATURE_TYPES: {
  id: number;
  name: string;
  icon: IconName;
  variant: VariantProps<typeof badgeVariants>["variant"];
}[] = [
  {
    id: 1,
    name: "CT Scan",
    icon: "l-compact-disc",
    variant: "blue",
  },
  {
    id: 2,
    name: "Maternity Care",
    icon: "l-baby-carriage",
    variant: "pink",
  },
  {
    id: 3,
    name: "X-Ray",
    icon: "l-clipboard-alt",
    variant: "blue",
  },
  {
    id: 4,
    name: "Neonatal Care",
    icon: "l-baby-carriage",
    variant: "pink",
  },
  {
    id: 5,
    name: "Operation Theater",
    icon: "l-syringe",
    variant: "orange",
  },
  {
    id: 6,
    name: "Blood Bank",
    icon: "l-medical-drip",
    variant: "purple",
  },
  {
    id: 7,
    name: "Emergency Services",
    icon: "l-ambulance",
    variant: "destructive",
  },
  {
    id: 8,
    name: "Inpatient Services",
    icon: "l-hospital",
    variant: "orange",
  },
  {
    id: 9,
    name: "Outpatient Services",
    icon: "l-hospital",
    variant: "indigo",
  },
  {
    id: 10,
    name: "Intensive Care Units (ICU)",
    icon: "l-hospital",
    variant: "destructive",
  },
  {
    id: 11,
    name: "Pharmacy",
    icon: "l-hospital",
    variant: "indigo",
  },
  {
    id: 12,
    name: "Rehabilitation Services",
    icon: "l-hospital",
    variant: "teal",
  },
  {
    id: 13,
    name: "Home Care Services",
    icon: "l-hospital",
    variant: "teal",
  },
  {
    id: 14,
    name: "Psychosocial Support",
    icon: "l-hospital",
    variant: "purple",
  },
  {
    id: 15,
    name: "Respite Care",
    icon: "l-hospital",
    variant: "destructive",
  },
  {
    id: 16,
    name: "Daycare Programs",
    icon: "l-hospital",
    variant: "yellow",
  },
];

export type FacilityType = {
  id: number;
  text: string;
};

export const FACILITY_TYPES: Array<FacilityType> = [
  // { id: 1, text: "Educational Inst" },
  // { id: 4, text: "Hostel" },
  // { id: 5, text: "Hotel" },
  // { id: 6, text: "Lodge" },
  { id: 800, text: "Primary Health Centres" },
  { id: 802, text: "Family Health Centres" },
  { id: 803, text: "Community Health Centres" },
  { id: 840, text: "Women and Child Health Centres" },
  { id: 830, text: "Taluk Hospitals" },
  { id: 860, text: "District Hospitals" },
  { id: 870, text: "Govt Medical College Hospitals" },
  { id: 9, text: "Govt Labs" },
  { id: 10, text: "Private Labs" },
  { id: 7, text: "TeleMedicine" },
  { id: 2, text: "Private Hospital" },
  { id: 910, text: "Autonomous healthcare facility" },
  { id: 1300, text: "Shifting Centre" },
  { id: 1500, text: "Request Approving Center" },
  { id: 1510, text: "Request Fulfilment Center" },
  { id: 3, text: "Other" },

  // { id: 8, text: "Govt Hospital" },
  // { id: 801, text: "24x7 Public Health Centres" },
  // { id: 820, text: "Urban Primary Health Center" },
  // { id: 831, text: "Taluk Headquarters Hospitals" },
  // { id: 850, text: "General hospitals" },

  // { id: 900, text: "Co-operative hospitals" },

  // { id: 950, text: "Corona Testing Labs" },
  // { id: 1000, text: "Corona Care Centre" },

  // { id: 1010, text: "COVID-19 Domiciliary Care Center" },
  // { id: 1100, text: "First Line Treatment Centre" },
  // { id: 1200, text: "Second Line Treatment Center" },
  // { id: 1400, text: "Covid Management Center" },
  // { id: 1600, text: "District War Room" },
  { id: 3000, text: "Clinical Non Governmental Organization" },
  { id: 3001, text: "Non Clinical Non Governmental Organization" },
  { id: 4000, text: "Community Based Organization" },
];
