// Patient Permissions
export const PERMISSION_CREATE_PATIENT = "can_create_patient";
export const PERMISSION_WRITE_PATIENT = "can_write_patient";
export const PERMISSION_LIST_PATIENTS = "can_list_patients";
export const PERMISSION_VIEW_CLINICAL_DATA = "can_view_clinical_data";
export const PERMISSION_VIEW_QUESTIONNAIRE_RESPONSES =
  "can_view_questionnaire_responses";
export const PERMISSION_SUBMIT_PATIENT_QUESTIONNAIRE =
  "can_submit_patient_questionnaire";

// Encounter Permissions
export const PERMISSION_CREATE_ENCOUNTER = "can_create_encounter";
export const PERMISSION_LIST_ENCOUNTERS = "can_list_encounter";
export const PERMISSION_WRITE_ENCOUNTER = "can_write_encounter";
export const PERMISSION_READ_ENCOUNTER = "can_read_encounter";
export const PERMISSION_READ_ENCOUNTER_CLINICAL_DATA =
  "can_read_encounter_clinical_data";
export const PERMISSION_SUBMIT_ENCOUNTER_QUESTIONNAIRE =
  "can_submit_encounter_questionnaire";

// Facility Organization Permissions
export const PERMISSION_CREATE_FACILITY_ORGANIZATION =
  "can_create_facility_organization";
export const PERMISSION_CREATE_FACILITY_ORGANIZATION_ROOT =
  "can_create_facility_organization_root";
export const PERMISSION_VIEW_FACILITY_ORGANIZATION =
  "can_view_facility_organization";
export const PERMISSION_DELETE_FACILITY_ORGANIZATION =
  "can_delete_facility_organization";
export const PERMISSION_MANAGE_FACILITY_ORGANIZATION =
  "can_manage_facility_organization";
export const PERMISSION_LIST_FACILITY_ORGANIZATION_USERS =
  "can_list_facility_organization_users";
export const PERMISSION_MANAGE_FACILITY_ORGANIZATION_USERS =
  "can_manage_facility_organization_users";

// Facility Permissions
export const PERMISSION_CREATE_FACILITY = "can_create_facility";
export const PERMISSION_READ_FACILITY = "can_read_facility";
export const PERMISSION_UPDATE_FACILITY = "can_update_facility";

// Location Permissions
export const PERMISSION_LIST_FACILITY_LOCATIONS = "can_list_facility_locations";
export const PERMISSION_WRITE_FACILITY_LOCATIONS =
  "can_write_facility_locations";
export const PERMISSION_LIST_FACILITY_LOCATION_ORGANIZATIONS =
  "can_list_facility_location_organizations";
export const PERMISSION_CREATE_FACILITY_LOCATION_ORGANIZATIONS =
  "can_create_facility_location_organizations";

// Organization Permissions
export const PERMISSION_VIEW_ORGANIZATION = "can_view_organization";
export const PERMISSION_CREATE_ORGANIZATION = "can_create_organization";
export const PERMISSION_DELETE_ORGANIZATION = "can_delete_organization";
export const PERMISSION_MANAGE_ORGANIZATION = "can_manage_organization";
export const PERMISSION_MANAGE_ORGANIZATION_USERS =
  "can_manage_organization_users";
export const PERMISSION_LIST_ORGANIZATION_USERS = "can_list_organization_users";
export const PERMISSION_GEO_ADMIN = "is_geo_admin";

// Questionnaire Permissions
export const PERMISSION_WRITE_QUESTIONNAIRE = "can_write_questionnaire";
export const PERMISSION_ARCHIVE_QUESTIONNAIRE = "can_archive_questionnaire";
export const PERMISSION_READ_QUESTIONNAIRE = "can_read_questionnaire";
export const PERMISSION_SUBMIT_QUESTIONNAIRE = "can_submit_questionnaire";
export const PERMISSION_MANAGE_QUESTIONNAIRE = "can_manage_questionnaire";

// Appointment Permissions
export const PERMISSION_LIST_BOOKING = "can_list_booking";
export const PERMISSION_WRITE_BOOKING = "can_write_booking";

// Schedule Permissions
export const PERMISSION_WRITE_SCHEDULE = "can_write_schedule";
export const PERMISSION_LIST_SCHEDULE = "can_list_schedule";
export const PERMISSION_RESCHEDULE_APPOINTMENT = "can_reschedule_booking";

// User Permissions
export const PERMISSION_CREATE_USER = "can_create_user";
export const PERMISSION_LIST_USER = "can_list_user";

// Service Account Permissions
export const PERMISSION_CREATE_SERVICE_ACCOUNT = "can_create_service_account";

// Template Permissions
export const PERMISSION_LIST_TEMPLATE = "can_read_template";
export const PERMISSION_WRITE_TEMPLATE = "can_write_template";
export const PERMISSION_PREVIEW_TEMPLATE = "can_preview_template";
export const PERMISSION_VIEW_TEMPLATE_SCHEMA = "can_view_template_schema";
export const PERMISSION_GENERATE_REPORT_FROM_TEMPLATE =
  "can_generate_report_from_template";
export const PERMISSION_MANAGE_TEMPLATE = "can_manage_template";
export const PERMISSION_CREATE_CHARGE_ITEM_DEFINITION =
  "can_create_charge_item_definition";
export const PERMISSION_SET_CHARGE_ITEM_DEFINITION =
  "can_set_charge_item_definition";

// Token Permissions
export const PERMISSION_WRITE_TOKEN_CATEGORY = "can_write_token_category";
export const PERMISSION_LIST_TOKEN_CATEGORIES = "can_list_token_category";
export const PERMISSION_WRITE_TOKEN = "can_write_token";
export const PERMISSION_LIST_TOKENS = "can_list_token";

// Healthcare Permissions
export const PERMISSION_WRITE_HEALTHCARE_SERVICE =
  "can_write_healthcare_service";
export const PERMISSION_READ_HEALTHCARE_SERVICE = "can_read_healthcare_service";

// Resource Category Permissions
export const PERMISSION_WRITE_RESOURCE_CATEGORY = "can_write_resource_category";
export const PERMISSION_READ_RESOURCE_CATEGORY = "can_read_resource_category";

// Account Permissions
export const PERMISSION_CREATE_ACCOUNT = "can_create_account";
export const PERMISSION_UPDATE_ACCOUNT = "can_update_account";
export const PERMISSION_READ_ACCOUNT = "can_read_account";

// Invoice Permissions
export const PERMISSION_MANAGE_LOCKED_INVOICE =
  "can_manage_locked_invoice_in_facility";

export interface Permissions {
  // Patient Permissions
  /** Permission slug: "can_create_patient" */
  canCreatePatient: boolean;
  /** Permission slug: "can_write_patient" */
  canWritePatient: boolean;
  /** Permission slug: "can_list_patients" */
  canViewPatients: boolean;
  /** Permission slug: "can_view_clinical_data" */
  canViewClinicalData: boolean;
  /** Permission slug: "can_view_questionnaire_responses" */
  canViewPatientQuestionnaireResponses: boolean;
  /** Permission slug: "can_submit_patient_questionnaire" */
  canSubmitPatientQuestionnaireResponses: boolean;

  // Encounter Permissions
  /** Permission slug: "can_create_encounter" */
  canCreateEncounter: boolean;
  /** Permission slug: "can_list_encounter" */
  canListEncounters: boolean;
  /** Permission slug: "can_write_encounter" */
  canWriteEncounter: boolean;
  /** Permission slug: "can_read_encounter" */
  canReadEncounter: boolean;
  /** Permission slug: "can_read_encounter_clinical_data" */
  canReadEncounterClinicalData: boolean;
  /** Permission slug: "can_submit_encounter_questionnaire" */
  canSubmitEncounterQuestionnaire: boolean;

  // Facility Organization Permissions
  /** Permission slug: "can_create_facility_organization" */
  canCreateFacilityOrganization: boolean;
  /** Permission slug: "can_create_facility_organization_root" */
  canCreateFacilityOrganizationRoot: boolean;
  /** Permission slug: "can_view_facility_organization" */
  canViewFacilityOrganizations: boolean;
  /** Permission slug: "can_delete_facility_organization" */
  canDeleteFacilityOrganization: boolean;
  /** Permission slug: "can_manage_facility_organization" */
  canManageFacilityOrganization: boolean;
  /** Permission slug: "can_list_facility_organization_users" */
  canListFacilityOrganizationUsers: boolean;
  /** Permission slug: "can_manage_facility_organization_users" */
  canManageFacilityOrganizationUsers: boolean;

  // Facility Permissions
  /** Permission slug: "can_create_facility" */
  canCreateFacility: boolean;
  /** Permission slug: "can_read_facility" */
  canReadFacility: boolean;
  /** Permission slug: "can_update_facility" */
  canUpdateFacility: boolean;

  // Location Permissions
  /** Permission slug: "can_list_facility_locations" */
  canListFacilityLocations: boolean;
  /** Permission slug: "can_write_facility_locations" */
  canWriteFacilityLocation: boolean;
  /** Permission slug: "can_list_facility_location_organizations" */
  canListFacilityLocationOrganizations: boolean;
  /** Permission slug: "can_create_facility_location_organizations" */
  canCreateFacilityLocationOrganizations: boolean;

  // Organization Permissions
  /** Permission slug: "can_view_organization" */
  canViewOrganizations: boolean;
  /** Permission slug: "can_create_organization" */
  canCreateOrganization: boolean;
  /** Permission slug: "can_delete_organization" */
  canDeleteOrganization: boolean;
  /** Permission slug: "can_manage_organization" */
  canManageOrganization: boolean;
  /** Permission slug: "can_manage_organization_users" */
  canManageOrganizationUsers: boolean;
  /** Permission slug: "can_list_organization_users" */
  canListOrganizationUsers: boolean;
  /** Permission slug: "is_geo_admin" */
  isGeoAdmin: boolean;

  // Questionnaire Permissions
  /** Permission slug: "can_write_questionnaire" */
  canWriteQuestionnaire: boolean;
  /** Permission slug: "can_archive_questionnaire" */
  canArchiveQuestionnaire: boolean;
  /** Permission slug: "can_read_questionnaire" */
  canReadQuestionnaire: boolean;
  /** Permission slug: "can_submit_questionnaire" */
  canSubmitQuestionnaire: boolean;
  /** Permission slug: "can_manage_questionnaire" */
  canManageQuestionnaire: boolean;

  // Appointment Permissions
  /** Permission slug: "can_list_booking" */
  canViewAppointments: boolean;
  /** Permission slug: "can_write_booking" */
  canWriteAppointment: boolean;

  // Schedule Permissions
  /** Permission slug: "can_write_user_schedule" */
  canWriteSchedule: boolean;
  /** Permission slug: "can_list_user_schedule" */
  canViewSchedule: boolean;
  /** Permission slug: "can_reschedule_booking" */
  canRescheduleAppointment: boolean;

  // User Permissions
  /** Permission slug: "can_create_user" */
  canCreateUser: boolean;
  /** Permission slug: "can_list_user" */
  canListUsers: boolean;

  // Service Account Permissions
  /** Permission slug: "can_create_service_account" */
  canCreateServiceAccount: boolean;

  // Template Permissions
  /** Permission slug: "can_list_template" */
  canListTemplate: boolean;
  /** Permission slug: "can_write_template" */
  canWriteTemplate: boolean;
  /** Permission slug: "can_preview_template" */
  canPreviewTemplate: boolean;
  /** Permission slug: "can_view_template_schema" */
  canViewTemplateSchema: boolean;
  /** Permission slug: "can_generate_report_from_template" */
  canGenerateReportFromTemplate: boolean;
  // @deprecated Use canWriteTemplate instead
  /** Permission slug: "can_manage_template" */
  canManageTemplate: boolean;
  /** Permission slug: "can_create_charge_item_definition" */
  canSetChargeItemDefinition: boolean;

  // Token Permissions
  /** Permission slug: "can_write_token_category" */
  canWriteTokenCategory: boolean;
  /** Permission slug: "can_list_token_category" */
  canListTokenCategories: boolean;
  /** Permission slug: "can_write_token" */
  canWriteToken: boolean;
  /** Permission slug: "can_list_token" */
  canListTokens: boolean;

  /** Permission slug: "can_write_healthcare_service" */
  canWriteHealthcareService: boolean;
  /** Permission slug: "can_read_healthcare_service" */
  canReadHealthcareService: boolean;

  /** Permission slug: "can_write_resource_category" */
  canWriteResourceCategory: boolean;
  /** Permission slug: "can_read_resource_category" */
  canReadResourceCategory: boolean;

  /** Permission slug: "can_create_account" */
  canCreateAccount: boolean;
  /** Permission slug: "can_update_account" */
  canUpdateAccount: boolean;
  /** Permission slug: "can_read_account" */
  canReadAccount: boolean;

  /** Permission slug: "can_manage_locked_invoice_in_facility" */
  canManageLockedInvoice: boolean;
}

export type HasPermissionFn = (
  permission: string,
  permissions: string[],
) => boolean;

export function getPermissions(
  hasPermission: HasPermissionFn,
  permissions: string[],
): Permissions {
  return {
    // Patients
    canCreatePatient: hasPermission(PERMISSION_CREATE_PATIENT, permissions),
    canWritePatient: hasPermission(PERMISSION_WRITE_PATIENT, permissions),
    canViewPatients: hasPermission(PERMISSION_LIST_PATIENTS, permissions),
    canViewClinicalData: hasPermission(
      PERMISSION_VIEW_CLINICAL_DATA,
      permissions,
    ),
    canViewPatientQuestionnaireResponses: hasPermission(
      PERMISSION_VIEW_QUESTIONNAIRE_RESPONSES,
      permissions,
    ),
    canSubmitPatientQuestionnaireResponses: hasPermission(
      PERMISSION_SUBMIT_PATIENT_QUESTIONNAIRE,
      permissions,
    ),

    // Encounters
    canCreateEncounter: hasPermission(PERMISSION_CREATE_ENCOUNTER, permissions),
    canListEncounters: hasPermission(PERMISSION_LIST_ENCOUNTERS, permissions),
    canWriteEncounter: hasPermission(PERMISSION_WRITE_ENCOUNTER, permissions),
    canReadEncounter: hasPermission(PERMISSION_READ_ENCOUNTER, permissions),
    canReadEncounterClinicalData: hasPermission(
      PERMISSION_READ_ENCOUNTER_CLINICAL_DATA,
      permissions,
    ),
    canSubmitEncounterQuestionnaire: hasPermission(
      PERMISSION_SUBMIT_ENCOUNTER_QUESTIONNAIRE,
      permissions,
    ),

    // Facility Organizations
    canCreateFacilityOrganization: hasPermission(
      PERMISSION_CREATE_FACILITY_ORGANIZATION,
      permissions,
    ),
    canCreateFacilityOrganizationRoot: hasPermission(
      PERMISSION_CREATE_FACILITY_ORGANIZATION_ROOT,
      permissions,
    ),
    canViewFacilityOrganizations: hasPermission(
      PERMISSION_VIEW_FACILITY_ORGANIZATION,
      permissions,
    ),
    canDeleteFacilityOrganization: hasPermission(
      PERMISSION_DELETE_FACILITY_ORGANIZATION,
      permissions,
    ),
    canManageFacilityOrganization: hasPermission(
      PERMISSION_MANAGE_FACILITY_ORGANIZATION,
      permissions,
    ),
    canListFacilityOrganizationUsers: hasPermission(
      PERMISSION_LIST_FACILITY_ORGANIZATION_USERS,
      permissions,
    ),
    canManageFacilityOrganizationUsers: hasPermission(
      PERMISSION_MANAGE_FACILITY_ORGANIZATION_USERS,
      permissions,
    ),

    // Facility
    canCreateFacility: hasPermission(PERMISSION_CREATE_FACILITY, permissions),
    canReadFacility: hasPermission(PERMISSION_READ_FACILITY, permissions),
    canUpdateFacility: hasPermission(PERMISSION_UPDATE_FACILITY, permissions),

    // Locations
    canListFacilityLocations: hasPermission(
      PERMISSION_LIST_FACILITY_LOCATIONS,
      permissions,
    ),
    canWriteFacilityLocation: hasPermission(
      PERMISSION_WRITE_FACILITY_LOCATIONS,
      permissions,
    ),
    canListFacilityLocationOrganizations: hasPermission(
      PERMISSION_LIST_FACILITY_LOCATION_ORGANIZATIONS,
      permissions,
    ),
    canCreateFacilityLocationOrganizations: hasPermission(
      PERMISSION_CREATE_FACILITY_LOCATION_ORGANIZATIONS,
      permissions,
    ),

    // Organizations
    canViewOrganizations: hasPermission(
      PERMISSION_VIEW_ORGANIZATION,
      permissions,
    ),
    canCreateOrganization: hasPermission(
      PERMISSION_CREATE_ORGANIZATION,
      permissions,
    ),
    canDeleteOrganization: hasPermission(
      PERMISSION_DELETE_ORGANIZATION,
      permissions,
    ),
    canManageOrganization: hasPermission(
      PERMISSION_MANAGE_ORGANIZATION,
      permissions,
    ),
    canManageOrganizationUsers: hasPermission(
      PERMISSION_MANAGE_ORGANIZATION_USERS,
      permissions,
    ),
    canListOrganizationUsers: hasPermission(
      PERMISSION_LIST_ORGANIZATION_USERS,
      permissions,
    ),
    isGeoAdmin: hasPermission(PERMISSION_GEO_ADMIN, permissions),

    // Questionnaire
    canWriteQuestionnaire: hasPermission(
      PERMISSION_WRITE_QUESTIONNAIRE,
      permissions,
    ),
    canArchiveQuestionnaire: hasPermission(
      PERMISSION_ARCHIVE_QUESTIONNAIRE,
      permissions,
    ),
    canReadQuestionnaire: hasPermission(
      PERMISSION_READ_QUESTIONNAIRE,
      permissions,
    ),
    canSubmitQuestionnaire: hasPermission(
      PERMISSION_SUBMIT_QUESTIONNAIRE,
      permissions,
    ),
    canManageQuestionnaire: hasPermission(
      PERMISSION_MANAGE_QUESTIONNAIRE,
      permissions,
    ),

    // Appointments
    canViewAppointments: hasPermission(PERMISSION_LIST_BOOKING, permissions),
    canWriteAppointment: hasPermission(PERMISSION_WRITE_BOOKING, permissions),

    // Schedules and Availability
    canWriteSchedule: hasPermission(PERMISSION_WRITE_SCHEDULE, permissions),
    canViewSchedule: hasPermission(PERMISSION_LIST_SCHEDULE, permissions),
    canRescheduleAppointment: hasPermission(
      PERMISSION_RESCHEDULE_APPOINTMENT,
      permissions,
    ),

    // User
    canCreateUser: hasPermission(PERMISSION_CREATE_USER, permissions),
    // Currently listed, but not used in BE
    canListUsers: hasPermission(PERMISSION_LIST_USER, permissions),

    // Service Account
    canCreateServiceAccount: hasPermission(
      PERMISSION_CREATE_SERVICE_ACCOUNT,
      permissions,
    ),

    // Template
    canListTemplate: hasPermission(PERMISSION_LIST_TEMPLATE, permissions),
    canWriteTemplate: hasPermission(PERMISSION_WRITE_TEMPLATE, permissions),
    canPreviewTemplate: hasPermission(PERMISSION_PREVIEW_TEMPLATE, permissions),
    canViewTemplateSchema: hasPermission(
      PERMISSION_VIEW_TEMPLATE_SCHEMA,
      permissions,
    ),
    canGenerateReportFromTemplate: hasPermission(
      PERMISSION_GENERATE_REPORT_FROM_TEMPLATE,
      permissions,
    ),
    // @deprecated Use canWriteTemplate instead
    canManageTemplate: hasPermission(PERMISSION_MANAGE_TEMPLATE, permissions),
    canSetChargeItemDefinition: hasPermission(
      PERMISSION_SET_CHARGE_ITEM_DEFINITION,
      permissions,
    ),

    // Tokens
    canWriteTokenCategory: hasPermission(
      PERMISSION_WRITE_TOKEN_CATEGORY,
      permissions,
    ),
    canListTokenCategories: hasPermission(
      PERMISSION_LIST_TOKEN_CATEGORIES,
      permissions,
    ),
    canWriteToken: hasPermission(PERMISSION_WRITE_TOKEN, permissions),
    canListTokens: hasPermission(PERMISSION_LIST_TOKENS, permissions),

    //Healthcare Services
    canWriteHealthcareService: hasPermission(
      PERMISSION_WRITE_HEALTHCARE_SERVICE,
      permissions,
    ),
    canReadHealthcareService: hasPermission(
      PERMISSION_READ_HEALTHCARE_SERVICE,
      permissions,
    ),

    // Resource Category
    canWriteResourceCategory: hasPermission(
      PERMISSION_WRITE_RESOURCE_CATEGORY,
      permissions,
    ),
    canReadResourceCategory: hasPermission(
      PERMISSION_READ_RESOURCE_CATEGORY,
      permissions,
    ),

    // Account
    canCreateAccount: hasPermission(PERMISSION_CREATE_ACCOUNT, permissions),
    canUpdateAccount: hasPermission(PERMISSION_UPDATE_ACCOUNT, permissions),
    canReadAccount: hasPermission(PERMISSION_READ_ACCOUNT, permissions),

    // Invoice
    canManageLockedInvoice: hasPermission(
      PERMISSION_MANAGE_LOCKED_INVOICE,
      permissions,
    ),
  };
}
