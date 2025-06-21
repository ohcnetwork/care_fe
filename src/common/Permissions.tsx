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

// Questionnaire Permissions
export const PERMISSION_WRITE_QUESTIONNAIRE = "can_write_questionnaire";
export const PERMISSION_ARCHIVE_QUESTIONNAIRE = "can_archive_questionnaire";
export const PERMISSION_READ_QUESTIONNAIRE = "can_read_questionnaire";
export const PERMISSION_SUBMIT_QUESTIONNAIRE = "can_submit_questionnaire";
export const PERMISSION_MANAGE_QUESTIONNAIRE = "can_manage_questionnaire";

// Appointment Permissions
export const PERMISSION_LIST_USER_BOOKING = "can_list_user_booking";
export const PERMISSION_WRITE_USER_BOOKING = "can_write_user_booking";
export const PERMISSION_CREATE_APPOINTMENT = "can_create_appointment";

// Schedule Permissions
export const PERMISSION_WRITE_USER_SCHEDULE = "can_write_user_schedule";
export const PERMISSION_LIST_USER_SCHEDULE = "can_list_user_schedule";

// User Permissions
export const PERMISSION_CREATE_USER = "can_create_user";
export const PERMISSION_LIST_USER = "can_list_user";

// Template Permissions
export const PERMISSION_LIST_TEMPLATE = "can_list_template";
export const PERMISSION_MANAGE_TEMPLATE = "can_manage_template";

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
  canViewEncounter: boolean;
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
  /** Permission slug: "can_list_user_booking" */
  canViewAppointments: boolean;
  /** Permission slug: "can_write_user_booking" */
  canUpdateAppointment: boolean;
  /** Permission slug: "can_create_appointment" */
  canCreateAppointment: boolean;

  // Schedule Permissions
  /** Permission slug: "can_write_user_schedule" */
  canWriteSchedule: boolean;
  /** Permission slug: "can_list_user_schedule" */
  canViewSchedule: boolean;

  // User Permissions
  /** Permission slug: "can_create_user" */
  canCreateUser: boolean;
  /** Permission slug: "can_list_user" */
  canListUsers: boolean;

  // Template Permissions
  /** Permission slug: "can_list_template" */
  canListTemplate: boolean;
  /** Permission slug: "can_manage_template" */
  canManageTemplate: boolean;
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
    canViewEncounter: hasPermission(PERMISSION_READ_ENCOUNTER, permissions),
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
    canViewAppointments: hasPermission(
      PERMISSION_LIST_USER_BOOKING,
      permissions,
    ),
    canUpdateAppointment: hasPermission(
      PERMISSION_WRITE_USER_BOOKING,
      permissions,
    ),
    canCreateAppointment: hasPermission(
      PERMISSION_CREATE_APPOINTMENT,
      permissions,
    ),

    // Schedules and Availability
    canWriteSchedule: hasPermission(
      PERMISSION_WRITE_USER_SCHEDULE,
      permissions,
    ),
    canViewSchedule: hasPermission(PERMISSION_LIST_USER_SCHEDULE, permissions),

    // User
    canCreateUser: hasPermission(PERMISSION_CREATE_USER, permissions),
    // Currently listed, but not used in BE
    canListUsers: hasPermission(PERMISSION_LIST_USER, permissions),

    // Template
    canListTemplate: hasPermission(PERMISSION_LIST_TEMPLATE, permissions),
    canManageTemplate: hasPermission(PERMISSION_MANAGE_TEMPLATE, permissions),
  };
}
