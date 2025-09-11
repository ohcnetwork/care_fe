import dotenv from "dotenv";

import { RoleCreate } from "@/types/emr/role/role";
import {
  batchRequest,
  createScriptConfig,
  ensureAuthentication,
  getAuthHeaders,
  type BaseConfig,
} from "sudheendra-scripts/utils";

dotenv.config({ path: [".env.local", ".env"] });

const GOOGLE_SHEET_ID = "1nihZMLqvssW_jl4zubHrj4bgI6xJGUNuiENDjvEooFY";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=role%20permissions`;

const fetchRolePermissionsCsv = async () => {
  const response = await fetch(CSV_URL, {
    headers: {
      "Content-Type": "text/csv",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch role permissions CSV: ${response.statusText}`,
    );
  }

  return response.text();
};

const parseBoolean = (value: string) => {
  value = value.trim();
  if (
    value.toLowerCase() === "y" ||
    value.toLowerCase() === "yes" ||
    value.toLowerCase() === "true" ||
    value.toLowerCase() === "1"
  ) {
    return true;
  }
  if (
    value.toLowerCase() === "n" ||
    value.toLowerCase() === "no" ||
    value.toLowerCase() === "false" ||
    value.toLowerCase() === "0"
  ) {
    return false;
  }
  throw new Error(
    `Failed to parse boolean: ${value}. Expected 'y', 'yes', 'true', '1', 'n', 'no', 'false', or '0'.`,
  );
};

async function parseRolePermissionsCsv(content: string) {
  const lines = content.split("\n");

  const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  const slugIndex = header.findIndex((h) => h === "Slug");
  if (slugIndex === -1) {
    throw new Error("Slug column not found in CSV");
  }

  const roleNames = header.filter(
    (h) => h && h !== "Slug" && h !== "Permission" && h !== "Description",
  );

  const roles: RoleCreate[] = roleNames.map((name) => ({
    name,
    permissions: [],
    description: "",
    is_system: false,
  }));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));

    const permission = values[slugIndex];
    for (const role of roles) {
      const roleIndex = header.findIndex((h) => h === role.name);
      const rolePermission = values[roleIndex];
      if (parseBoolean(rolePermission)) {
        role.permissions.push(permission);
      }
    }
  }

  return roles;
}

async function createRoles(datapoints: RoleCreate[], config: BaseConfig) {
  const url = `${config.apiBaseUrl}/api/v1/role/upsert/`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(config),
    },
    body: JSON.stringify({ datapoints }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(errorText);
    return;
  }

  const result = await response.json();
  console.log(`Created ${result.length} roles`);
  return result;
}

const existingRoles = [
  {
    id: "50a79250-a9ba-4065-a261-3bcef1f70fec",
    name: "Doctor",
    description: "Doctor at some facility",
    is_system: true,
    is_archived: false,
    permissions: [
      {
        name: "Can Read on Facility",
        slug: "can_read_facility",
        context: "FACILITY",
        description: "Something Here",
      },
      {
        name: "Can Read Questionnaires",
        slug: "can_read_questionnaire",
        context: "QUESTIONNAIRE",
        description: "",
      },
      {
        name: "Can Submit Questionnaires",
        slug: "can_submit_questionnaire",
        context: "QUESTIONNAIRE",
        description: "",
      },
      {
        name: "Can View Organizations",
        slug: "can_view_organization",
        context: "ORGANIZATION",
        description: "",
      },
      {
        name: "Can List Users in an Organizations",
        slug: "can_list_organization_users",
        context: "ORGANIZATION",
        description: "",
      },
      {
        name: "Can View Facility Organizations",
        slug: "can_view_facility_organization",
        context: "FACILITY_ORGANIZATION",
        description: "",
      },
      {
        name: "Can List Users in a Facility Organizations",
        slug: "can_list_facility_organization_users",
        context: "FACILITY_ORGANIZATION",
        description: "",
      },
      {
        name: "Can write encounter",
        slug: "can_create_encounter",
        context: "ENCOUNTER",
        description: "",
      },
      {
        name: "Can list encounters",
        slug: "can_list_encounter",
        context: "ENCOUNTER",
        description: "Clinical data is not associated with this permission",
      },
      {
        name: "Update Encounter and Create all associated datapoints",
        slug: "can_write_encounter",
        context: "ENCOUNTER",
        description: "",
      },
      {
        name: "Can Read encounter and related data",
        slug: "can_read_encounter",
        context: "ENCOUNTER",
        description: "",
      },
      {
        name: "Can submit questionnaire about patient encounters",
        slug: "can_submit_encounter_questionnaire",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can Create Patient",
        slug: "can_create_patient",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can Update a Patient's data",
        slug: "can_write_patient",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can list patients",
        slug: "can_list_patients",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can view clinical data about patients",
        slug: "can_view_clinical_data",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can view questionnaire responses on patient",
        slug: "can_view_questionnaire_responses",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can submit questionnaire about patients",
        slug: "can_submit_patient_questionnaire",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can list Users in Care",
        slug: "can_list_user",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create on User Schedule",
        slug: "can_write_user_schedule",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can list user schedule on Facility",
        slug: "can_list_user_schedule",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can list bookings on Facility",
        slug: "can_list_user_booking",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can update bookings on user",
        slug: "can_write_user_booking",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can create appointment on facility",
        slug: "can_create_appointment",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can reschedule appointment on facility",
        slug: "can_reschedule_appointment",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can List Facility Locations",
        slug: "can_list_facility_locations",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Observation Definition",
        slug: "can_read_observation_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can List Devices on Facility",
        slug: "can_list_devices",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Manage Device Associations to Encounters",
        slug: "can_manage_device_associations_to_encounters",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Specimen Definition",
        slug: "can_read_specimen_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Activity Definition",
        slug: "can_read_activity_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Service Request on Facility",
        slug: "can_write_service_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Service Request",
        slug: "can_read_service_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Healthcare Service",
        slug: "can_read_healthcare_service",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Specimen on Facility",
        slug: "can_write_specimen",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Specimen",
        slug: "can_read_specimen",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Diagnostic Report on Facility",
        slug: "can_write_diagnostic_report",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Diagnostic Report",
        slug: "can_read_diagnostic_report",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Charge Item Definition",
        slug: "can_read_charge_item_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Charge Item",
        slug: "can_create_charge_item",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Charge Item",
        slug: "can_read_charge_item",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Charge Item",
        slug: "can_read_account",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Write Payment Reconciliation",
        slug: "can_write_payment_reconciliation",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Payment Reconciliation",
        slug: "can_read_payment_reconciliation",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Write Invoice",
        slug: "can_write_invoice",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Invoice",
        slug: "can_read_invoice",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Medication Dispense Read",
        slug: "read_medication_dispense",
        context: "FACILITY",
        description: "Users can read medication dispenses",
      },
      {
        name: "Write Medication Dispense",
        slug: "write_medication_dispense",
        context: "FACILITY",
        description: "Users can write medication dispenses",
      },
      {
        name: "Can Read Product Knowledge",
        slug: "can_read_product_knowledge",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Product",
        slug: "can_read_product",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Supply Request",
        slug: "can_read_supply_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Inventory Item",
        slug: "can_read_inventory_item",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Supply Delivery",
        slug: "can_read_supply_delivery",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Supply Request on Facility",
        slug: "can_write_supply_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Tag Config",
        slug: "can_read_tag_config",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Patient Identifier Config",
        slug: "can_read_patient_identifier_config",
        context: "FACILITY",
        description: "",
      },
    ],
  },
  {
    id: "73c0de1d-ebb4-48ad-ad42-e2331392e9e6",
    name: "Nurse",
    description: "Nurse at some facility",
    is_system: true,
    is_archived: false,
    permissions: [
      {
        name: "Can Read on Facility",
        slug: "can_read_facility",
        context: "FACILITY",
        description: "Something Here",
      },
      {
        name: "Can Read Questionnaires",
        slug: "can_read_questionnaire",
        context: "QUESTIONNAIRE",
        description: "",
      },
      {
        name: "Can Submit Questionnaires",
        slug: "can_submit_questionnaire",
        context: "QUESTIONNAIRE",
        description: "",
      },
      {
        name: "Can View Organizations",
        slug: "can_view_organization",
        context: "ORGANIZATION",
        description: "",
      },
      {
        name: "Can List Users in an Organizations",
        slug: "can_list_organization_users",
        context: "ORGANIZATION",
        description: "",
      },
      {
        name: "Can View Facility Organizations",
        slug: "can_view_facility_organization",
        context: "FACILITY_ORGANIZATION",
        description: "",
      },
      {
        name: "Can List Users in a Facility Organizations",
        slug: "can_list_facility_organization_users",
        context: "FACILITY_ORGANIZATION",
        description: "",
      },
      {
        name: "Can write encounter",
        slug: "can_create_encounter",
        context: "ENCOUNTER",
        description: "",
      },
      {
        name: "Can list encounters",
        slug: "can_list_encounter",
        context: "ENCOUNTER",
        description: "Clinical data is not associated with this permission",
      },
      {
        name: "Update Encounter and Create all associated datapoints",
        slug: "can_write_encounter",
        context: "ENCOUNTER",
        description: "",
      },
      {
        name: "Can Read encounter and related data",
        slug: "can_read_encounter",
        context: "ENCOUNTER",
        description: "",
      },
      {
        name: "Can submit questionnaire about patient encounters",
        slug: "can_submit_encounter_questionnaire",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can Create Patient",
        slug: "can_create_patient",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can Update a Patient's data",
        slug: "can_write_patient",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can list patients",
        slug: "can_list_patients",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can view clinical data about patients",
        slug: "can_view_clinical_data",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can view questionnaire responses on patient",
        slug: "can_view_questionnaire_responses",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can submit questionnaire about patients",
        slug: "can_submit_patient_questionnaire",
        context: "PATIENT",
        description: "",
      },
      {
        name: "Can list Users in Care",
        slug: "can_list_user",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create on User Schedule",
        slug: "can_write_user_schedule",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can list user schedule on Facility",
        slug: "can_list_user_schedule",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can list bookings on Facility",
        slug: "can_list_user_booking",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can update bookings on user",
        slug: "can_write_user_booking",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can create appointment on facility",
        slug: "can_create_appointment",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can reschedule appointment on facility",
        slug: "can_reschedule_appointment",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can List Facility Locations",
        slug: "can_list_facility_locations",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Observation Definition",
        slug: "can_read_observation_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can List Devices on Facility",
        slug: "can_list_devices",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Manage Device Associations to Encounters",
        slug: "can_manage_device_associations_to_encounters",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Specimen Definition",
        slug: "can_read_specimen_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Activity Definition",
        slug: "can_read_activity_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Service Request on Facility",
        slug: "can_write_service_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Service Request",
        slug: "can_read_service_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Healthcare Service",
        slug: "can_read_healthcare_service",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Specimen on Facility",
        slug: "can_write_specimen",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Specimen",
        slug: "can_read_specimen",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Diagnostic Report on Facility",
        slug: "can_write_diagnostic_report",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Diagnostic Report",
        slug: "can_read_diagnostic_report",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Charge Item Definition",
        slug: "can_read_charge_item_definition",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Charge Item",
        slug: "can_create_charge_item",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Charge Item",
        slug: "can_read_charge_item",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Charge Item",
        slug: "can_read_account",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Write Payment Reconciliation",
        slug: "can_write_payment_reconciliation",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Payment Reconciliation",
        slug: "can_read_payment_reconciliation",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Write Invoice",
        slug: "can_write_invoice",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Invoice",
        slug: "can_read_invoice",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Medication Dispense Read",
        slug: "read_medication_dispense",
        context: "FACILITY",
        description: "Users can read medication dispenses",
      },
      {
        name: "Write Medication Dispense",
        slug: "write_medication_dispense",
        context: "FACILITY",
        description: "Users can write medication dispenses",
      },
      {
        name: "Can Read Product Knowledge",
        slug: "can_read_product_knowledge",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Product",
        slug: "can_read_product",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Supply Request",
        slug: "can_read_supply_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Inventory Item",
        slug: "can_read_inventory_item",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Supply Delivery",
        slug: "can_read_supply_delivery",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Create Supply Request on Facility",
        slug: "can_write_supply_request",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Tag Config",
        slug: "can_read_tag_config",
        context: "FACILITY",
        description: "",
      },
      {
        name: "Can Read Patient Identifier Config",
        slug: "can_read_patient_identifier_config",
        context: "FACILITY",
        description: "",
      },
    ],
  },
];

function checkRoles(role: RoleCreate) {
  const existingRole = existingRoles.find((r) => r.name === role.name);
  if (!existingRole) {
    console.log(`Role ${role.name} not found in existing roles`);
    return;
  }

  // Compare permissions
  const existingPermissions = existingRole.permissions.map((p) => p.slug);
  const newPermissions = role.permissions.filter(
    (p) => !existingPermissions.includes(p),
  );
  const removedPermissions = existingPermissions.filter(
    (p) => !role.permissions.includes(p),
  );

  console.log(`New permissions for ${role.name}:`, newPermissions);
  console.log(`Removed permissions for ${role.name}:`, removedPermissions);
}

async function main(configOverride?: Partial<BaseConfig>) {
  // Create config for authentication
  let config: BaseConfig = configOverride
    ? createScriptConfig("", "", configOverride) // No input/output files for this script
    : createScriptConfig("", "");

  // Ensure authentication tokens are available if token auth is enabled
  config = await ensureAuthentication(config);

  const csvContent = await fetchRolePermissionsCsv();
  const roles = await parseRolePermissionsCsv(csvContent);
  await batchRequest(roles, (datapoints) => createRoles(datapoints, config));
}

main();
