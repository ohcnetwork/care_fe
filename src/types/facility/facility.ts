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
  latitude?: number;
  longitude?: number;
  middleware_address?: string;
  pincode?: number;
}

export interface FacilityPublicRead
  extends Omit<FacilityBase, "latitude" | "longitude"> {
  features: number[];
  read_cover_image_url?: string;
  cover_image_url?: string;
  geo_organization: Organization;
  latitude?: string;
  longitude?: string;
}

export interface FacilityRead
  extends Omit<FacilityBase, "latitude" | "longitude">,
    FacilityPermissions {
  id: string;
  read_cover_image_url?: string;
  cover_image_url?: string;
  created_date?: string;
  modified_date?: string;
  geo_organization: Organization;
  latitude?: string;
  longitude?: string;
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
