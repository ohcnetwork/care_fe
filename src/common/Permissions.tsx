export enum PermissionType {
  // Patient Permissions
  CREATE_PATIENT = "can_create_patient",
  WRITE_PATIENT = "can_write_patient",
  LIST_PATIENTS = "can_list_patients",
  VIEW_CLINICAL_DATA = "can_view_clinical_data",
  VIEW_QUESTIONNAIRE_RESPONSES = "can_view_questionnaire_responses",
  SUBMIT_PATIENT_QUESTIONNAIRE = "can_submit_patient_questionnaire",

  // Encounter Permissions
  CREATE_ENCOUNTER = "can_create_encounter",
  LIST_ENCOUNTERS = "can_list_encounter",
  WRITE_ENCOUNTER = "can_write_encounter",
  READ_ENCOUNTER = "can_read_encounter",
  SUBMIT_ENCOUNTER_QUESTIONNAIRE = "can_submit_encounter_questionnaire",

  // Facility Organization Permissions
  CREATE_FACILITY_ORGANIZATION = "can_create_facility_organization",
  CREATE_FACILITY_ORGANIZATION_ROOT = "can_create_facility_organization_root",
  VIEW_FACILITY_ORGANIZATION = "can_view_facility_organization",
  DELETE_FACILITY_ORGANIZATION = "can_delete_facility_organization",
  MANAGE_FACILITY_ORGANIZATION = "can_manage_facility_organization",
  LIST_FACILITY_ORGANIZATION_USERS = "can_list_facility_organization_users",
  MANAGE_FACILITY_ORGANIZATION_USERS = "can_manage_facility_organization_users",

  // Facility Permissions
  CREATE_FACILITY = "can_create_facility",
  READ_FACILITY = "can_read_facility",
  UPDATE_FACILITY = "can_update_facility",

  // Location Permissions
  LIST_FACILITY_LOCATIONS = "can_list_facility_locations",
  WRITE_FACILITY_LOCATIONS = "can_write_facility_locations",
  LIST_FACILITY_LOCATION_ORGANIZATIONS = "can_list_facility_location_organizations",
  CREATE_FACILITY_LOCATION_ORGANIZATIONS = "can_create_facility_location_organizations",

  // Organization Permissions
  VIEW_ORGANIZATION = "can_view_organization",
  CREATE_ORGANIZATION = "can_create_organization",
  DELETE_ORGANIZATION = "can_delete_organization",
  MANAGE_ORGANIZATION = "can_manage_organization",
  MANAGE_ORGANIZATION_USERS = "can_manage_organization_users",
  LIST_ORGANIZATION_USERS = "can_list_organization_users",

  // Questionnaire Permissions
  WRITE_QUESTIONNAIRE = "can_write_questionnaire",
  ARCHIVE_QUESTIONNAIRE = "can_archive_questionnaire",
  READ_QUESTIONNAIRE = "can_read_questionnaire",
  SUBMIT_QUESTIONNAIRE = "can_submit_questionnaire",
  MANAGE_QUESTIONNAIRE = "can_manage_questionnaire",

  // Appointment Permissions
  LIST_BOOKING = "can_list_booking",
  WRITE_BOOKING = "can_write_booking",

  // Schedule Permissions
  WRITE_SCHEDULE = "can_write_schedule",
  LIST_SCHEDULE = "can_list_schedule",
  RESCHEDULE_APPOINTMENT = "can_reschedule_booking",

  // User Permissions
  CREATE_USER = "can_create_user",
  LIST_USER = "can_list_user",

  // Template Permissions
  LIST_TEMPLATE = "can_list_template",
  MANAGE_TEMPLATE = "can_manage_template",
  CREATE_CHARGE_ITEM_DEFINITION = "can_create_charge_item_definition",
  SET_CHARGE_ITEM_DEFINITION = "can_set_charge_item_definition",

  // Token Permissions
  WRITE_TOKEN_CATEGORY = "can_write_token_category",
  LIST_TOKEN_CATEGORIES = "can_list_token_category",
  WRITE_TOKEN = "can_write_token",
  LIST_TOKENS = "can_list_token",
}

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

  // Template Permissions
  /** Permission slug: "can_list_template" */
  canListTemplate: boolean;
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
}

export type HasPermissionFn = (
  permission: PermissionType,
  permissions: PermissionType[],
) => boolean;

export function getPermissions(
  hasPermission: HasPermissionFn,
  permissions: PermissionType[],
): Permissions {
  return {
    // Patients
    canCreatePatient: hasPermission(PermissionType.CREATE_PATIENT, permissions),
    canWritePatient: hasPermission(PermissionType.WRITE_PATIENT, permissions),
    canViewPatients: hasPermission(PermissionType.LIST_PATIENTS, permissions),
    canViewClinicalData: hasPermission(
      PermissionType.VIEW_CLINICAL_DATA,
      permissions,
    ),
    canViewPatientQuestionnaireResponses: hasPermission(
      PermissionType.VIEW_QUESTIONNAIRE_RESPONSES,
      permissions,
    ),
    canSubmitPatientQuestionnaireResponses: hasPermission(
      PermissionType.SUBMIT_PATIENT_QUESTIONNAIRE,
      permissions,
    ),

    // Encounters
    canCreateEncounter: hasPermission(
      PermissionType.CREATE_ENCOUNTER,
      permissions,
    ),
    canListEncounters: hasPermission(
      PermissionType.LIST_ENCOUNTERS,
      permissions,
    ),
    canWriteEncounter: hasPermission(
      PermissionType.WRITE_ENCOUNTER,
      permissions,
    ),
    canViewEncounter: hasPermission(PermissionType.READ_ENCOUNTER, permissions),
    canSubmitEncounterQuestionnaire: hasPermission(
      PermissionType.SUBMIT_ENCOUNTER_QUESTIONNAIRE,
      permissions,
    ),

    // Facility Organizations
    canCreateFacilityOrganization: hasPermission(
      PermissionType.CREATE_FACILITY_ORGANIZATION,
      permissions,
    ),
    canCreateFacilityOrganizationRoot: hasPermission(
      PermissionType.CREATE_FACILITY_ORGANIZATION_ROOT,
      permissions,
    ),
    canViewFacilityOrganizations: hasPermission(
      PermissionType.VIEW_FACILITY_ORGANIZATION,
      permissions,
    ),
    canDeleteFacilityOrganization: hasPermission(
      PermissionType.DELETE_FACILITY_ORGANIZATION,
      permissions,
    ),
    canManageFacilityOrganization: hasPermission(
      PermissionType.MANAGE_FACILITY_ORGANIZATION,
      permissions,
    ),
    canListFacilityOrganizationUsers: hasPermission(
      PermissionType.LIST_FACILITY_ORGANIZATION_USERS,
      permissions,
    ),
    canManageFacilityOrganizationUsers: hasPermission(
      PermissionType.MANAGE_FACILITY_ORGANIZATION_USERS,
      permissions,
    ),

    // Facility
    canCreateFacility: hasPermission(
      PermissionType.CREATE_FACILITY,
      permissions,
    ),
    canReadFacility: hasPermission(PermissionType.READ_FACILITY, permissions),
    canUpdateFacility: hasPermission(
      PermissionType.UPDATE_FACILITY,
      permissions,
    ),

    // Locations
    canListFacilityLocations: hasPermission(
      PermissionType.LIST_FACILITY_LOCATIONS,
      permissions,
    ),
    canWriteFacilityLocation: hasPermission(
      PermissionType.WRITE_FACILITY_LOCATIONS,
      permissions,
    ),
    canListFacilityLocationOrganizations: hasPermission(
      PermissionType.LIST_FACILITY_LOCATION_ORGANIZATIONS,
      permissions,
    ),
    canCreateFacilityLocationOrganizations: hasPermission(
      PermissionType.CREATE_FACILITY_LOCATION_ORGANIZATIONS,
      permissions,
    ),

    // Organizations
    canViewOrganizations: hasPermission(
      PermissionType.VIEW_ORGANIZATION,
      permissions,
    ),
    canCreateOrganization: hasPermission(
      PermissionType.CREATE_ORGANIZATION,
      permissions,
    ),
    canDeleteOrganization: hasPermission(
      PermissionType.DELETE_ORGANIZATION,
      permissions,
    ),
    canManageOrganization: hasPermission(
      PermissionType.MANAGE_ORGANIZATION,
      permissions,
    ),
    canManageOrganizationUsers: hasPermission(
      PermissionType.MANAGE_ORGANIZATION_USERS,
      permissions,
    ),
    canListOrganizationUsers: hasPermission(
      PermissionType.LIST_ORGANIZATION_USERS,
      permissions,
    ),

    // Questionnaire
    canWriteQuestionnaire: hasPermission(
      PermissionType.WRITE_QUESTIONNAIRE,
      permissions,
    ),
    canArchiveQuestionnaire: hasPermission(
      PermissionType.ARCHIVE_QUESTIONNAIRE,
      permissions,
    ),
    canReadQuestionnaire: hasPermission(
      PermissionType.READ_QUESTIONNAIRE,
      permissions,
    ),
    canSubmitQuestionnaire: hasPermission(
      PermissionType.SUBMIT_QUESTIONNAIRE,
      permissions,
    ),
    canManageQuestionnaire: hasPermission(
      PermissionType.MANAGE_QUESTIONNAIRE,
      permissions,
    ),

    // Appointments
    canViewAppointments: hasPermission(
      PermissionType.LIST_BOOKING,
      permissions,
    ),
    canWriteAppointment: hasPermission(
      PermissionType.WRITE_BOOKING,
      permissions,
    ),

    // Schedules and Availability
    canWriteSchedule: hasPermission(PermissionType.WRITE_SCHEDULE, permissions),
    canViewSchedule: hasPermission(PermissionType.LIST_SCHEDULE, permissions),
    canRescheduleAppointment: hasPermission(
      PermissionType.RESCHEDULE_APPOINTMENT,
      permissions,
    ),

    // User
    canCreateUser: hasPermission(PermissionType.CREATE_USER, permissions),
    // Currently listed, but not used in BE
    canListUsers: hasPermission(PermissionType.LIST_USER, permissions),

    // Template
    canListTemplate: hasPermission(PermissionType.LIST_TEMPLATE, permissions),
    canManageTemplate: hasPermission(
      PermissionType.MANAGE_TEMPLATE,
      permissions,
    ),
    canSetChargeItemDefinition: hasPermission(
      PermissionType.SET_CHARGE_ITEM_DEFINITION,
      permissions,
    ),

    // Tokens
    canWriteTokenCategory: hasPermission(
      PermissionType.WRITE_TOKEN_CATEGORY,
      permissions,
    ),
    canListTokenCategories: hasPermission(
      PermissionType.LIST_TOKEN_CATEGORIES,
      permissions,
    ),
    canWriteToken: hasPermission(PermissionType.WRITE_TOKEN, permissions),
    canListTokens: hasPermission(PermissionType.LIST_TOKENS, permissions),
  };
}
