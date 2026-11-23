/**
 * Capability registry for the Playwright suite.
 *
 * Every test carries one `@cap:<id>` tag naming the user intent it verifies;
 * this file describes each id. `npm run playwright:index` joins the two into
 * tests/ATOMIC_TEST_INDEX.md, and `npm run playwright:index:check` fails when
 * a tag has no entry here, an entry has no tests, or a `step`/`seed` is not
 * an exported function. See "Tags, capabilities and step functions" in
 * tests/PLAYWRIGHT_GUIDE.md.
 */
export interface Capability {
  /** One line: what the user does. */
  label: string;
  /** Exported function that performs it in the UI: "tests/helper/<file>.ts:<fn>". */
  step?: string;
  /** Exported function that creates the same thing through the API. */
  seed?: string;
  /** What must exist first (facility, patient, encounter, …). */
  requires?: string[];
  /** What it leaves behind for the next step. */
  produces?: string[];
}

export const capabilities: Record<string, Capability> = {
  "admin.action.condition.configure": {
    label:
      "Build action conditions (fields, typed values, AND/OR, expression mode) in the action editor",
  },
  "admin.action.create": {
    label:
      "Create an action configuration (trigger context, conditions, instructions) at /admin/actions/new",
    produces: ["action-configuration"],
  },
  "admin.action.instruction.configure": {
    label:
      "Pick a compatible instruction and its parameters (e.g. tag) for an action",
  },
  "admin.action.list": {
    label: "List action configurations with client-side paging",
  },
  "admin.action.remove-step": {
    label: "Remove an action from an unsaved configuration after confirmation",
  },
  "admin.action.view": {
    label:
      "Open an existing action configuration (legacy/unsupported ones are read-only)",
    requires: ["action-configuration"],
  },
  "admin.app.create": {
    label: "Open a new app config prefilled from an app store id",
  },
  "admin.app.list": {
    label: "Browse installed/available apps tabs on /admin/apps",
  },
  "admin.immunization-policy.create": {
    label:
      "Create an immunization policy (recommendation tree) at instance or facility level",
    requires: ["facility"],
    produces: ["immunization-policy"],
  },
  "admin.immunization-policy.edit": {
    label:
      "Edit an immunization policy tree (codes, nested groups, duplicate nodes)",
    requires: ["immunization-policy"],
  },
  "admin.immunization-policy.list": {
    label: "List immunization policies with ownership, paging and retry",
    requires: ["facility"],
  },
  "admin.immunization-policy.search": {
    label:
      "Search immunization policies by name (URL-synced) on admin and facility lists",
  },
  "admin.immunization-policy.view": {
    label:
      "View an immunization policy read-only when ownership/permissions forbid edits",
    requires: ["immunization-policy"],
  },
  "admin.organization.create": {
    label:
      "Create a governance (govt) organization, as a root or under a parent",
    step: "tests/helper/admin.ts:createOrganizationViaUi",
    requires: ["organization:govt-root"],
    produces: ["organization:govt"],
  },
  "admin.organization.edit": {
    label: "Rename a governance organization from its parent's listing",
    requires: ["organization:govt"],
    produces: ["organization:govt-child"],
  },
  "admin.organization.list": {
    label: "Open the governance, suppliers and responsibilities directories",
    requires: ["organization:govt-root"],
  },
  "admin.organization.navigate": {
    label: "Navigate governance organizations via breadcrumbs",
    requires: ["organization:govt"],
  },
  "admin.organization.search": {
    label:
      "Search child organizations of a governance organization (URL-synced)",
    requires: ["organization:govt"],
  },
  "admin.organization.tree.navigate": {
    label: "Expand/collapse the governance organization tree",
    requires: ["organization:govt"],
  },
  "admin.organization.view": {
    label:
      "Open a governance organization's detail page via picker or see-details link",
    requires: ["organization:govt"],
  },
  "admin.patient-identifier-config.create": {
    label: "Create an instance patient identifier config",
    step: "tests/helper/admin.ts:createPatientIdentifierConfigViaUi",
    produces: ["patient-identifier-config:instance"],
  },
  "admin.patient-identifier-config.edit": {
    label: "Edit a patient identifier config's display and description",
    requires: ["patient-identifier-config:instance"],
    produces: ["patient-identifier-config:instance"],
  },
  "admin.patient-identifier-config.filter": {
    label:
      "Filter patient identifier configs by status (URL-synced) on admin and facility lists",
  },
  "admin.permission.list": {
    label:
      "Page through the roles x permissions matrix at /admin/rbac/permissions",
  },
  "admin.responsibility.create": {
    label:
      "Create a responsibility (role organization) in the responsibilities directory",
    step: "tests/helper/admin.ts:createResponsibilityViaUi",
    produces: ["organization:role"],
  },
  "admin.responsibility.edit": {
    label: "Edit a responsibility's title and description",
    requires: ["organization:role"],
  },
  "admin.responsibility.list": {
    label: "List responsibilities (server paging, desktop layout)",
  },
  "admin.responsibility.managed.link": {
    label:
      "Link a managed responsibility to a manager responsibility (and unlink it)",
    requires: ["organization:role"],
    produces: ["managed-responsibility-link"],
  },
  "admin.responsibility.search": {
    label: "Search the responsibilities directory",
    requires: ["organization:role"],
  },
  "admin.responsibility.view": {
    label: "View a responsibility's details (with retry on load failure)",
    requires: ["organization:role"],
  },
  "admin.role.clone": {
    label: "Clone an existing role with its permissions",
    requires: ["role"],
    produces: ["role"],
  },
  "admin.role.create": {
    label: "Create a role with chosen contexts and permissions",
    step: "tests/helper/admin.ts:createRoleViaUi",
    produces: ["role"],
  },
  "admin.role.edit": {
    label: "Rename a role and change its permissions",
    requires: ["role"],
    produces: ["role"],
  },
  "admin.role.search": { label: "Search roles by name (URL-synced)" },
  "admin.supplier.create": {
    label: "Create a product supplier organization in the suppliers directory",
    step: "tests/helper/admin.ts:createSupplierViaUi",
    produces: ["organization:product_supplier"],
  },
  "admin.supplier.list": {
    label: "List suppliers with load-more paging and retry",
  },
  "admin.supplier.navigate": {
    label: "Legacy supplier detail URLs redirect to the suppliers directory",
  },
  "admin.tag.child.create": {
    label: "Add a child tag under a parent tag config",
    step: "tests/helper/admin.ts:addChildTagConfigViaUi",
    requires: ["tag-config"],
    produces: ["tag-config:child"],
  },
  "admin.tag.create": {
    label:
      "Create a tag config (instance or facility; category, organization, expiry)",
    step: "tests/helper/admin.ts:createTagConfigViaUi",
    produces: ["tag-config"],
  },
  "admin.tag.edit": {
    label: "Edit a (child) tag config with prefilled values",
    requires: ["tag-config"],
    produces: ["tag-config:instance", "tag-config:child"],
  },
  "admin.tag.filter": {
    label:
      "Filter tag configs by status/category/resource (URL-synced) on admin and facility lists",
  },
  "admin.tag.list": { label: "List tag configs on /admin/tag_config" },
  "admin.tag.view": {
    label: "View a tag config's details and child tags",
    requires: ["tag-config"],
    produces: ["tag-config:instance", "tag-config:child"],
  },
  "admin.workspace.access.assign": {
    label: "Grant/replace/clear organization access on a workspace",
    requires: ["workspace"],
  },
  "admin.workspace.create": {
    label: "Create an instance workspace (encounter screen) configuration",
    produces: ["workspace"],
  },
  "admin.workspace.edit": {
    label: "Edit a workspace configuration's fields",
    requires: ["workspace"],
  },
  "admin.workspace.filter": {
    label: "Filter workspaces by status tab (URL-synced)",
  },
  "admin.workspace.section.configure": {
    label:
      "Configure sections (settings, chart codes, limits, tab subsets) in the workspace studio",
    requires: ["workspace"],
  },
  "admin.workspace.status.edit": {
    label: "Change a workspace's status (draft/active/archived)",
    requires: ["workspace"],
  },
  "admin.workspace.tab.configure": {
    label:
      "Configure tabs (built-in, history screens, limits) in the workspace studio",
    requires: ["workspace"],
  },
  "admin.workspace.template.edit": {
    label: "Edit a workspace template in the visual studio or JSON",
    requires: ["workspace"],
  },
  "admin.workspace.template.preview": {
    label: "Preview what a workspace hides automatically in the studio",
    requires: ["workspace"],
  },
  "admin.workspace.view": {
    label:
      "Open a workspace configuration (failed reads do not become new ones)",
    requires: ["workspace"],
  },
  "appointment.book": {
    label:
      "Book an appointment for a patient from the Schedule Appointment sheet",
    step: "tests/helper/appointment.ts:bookAppointmentViaUi",
    seed: "tests/helper/appointment.ts:createAppointmentViaApi",
    requires: ["facility", "patient", "schedule"],
    produces: ["appointment"],
  },
  "appointment.detail.view": {
    label: "View an appointment's detail page and its booking success message",
    requires: ["facility", "appointment"],
  },
  "appointment.encounter.create": {
    label: "Create a planned encounter from an appointment",
    requires: ["facility", "appointment"],
    produces: ["encounter"],
  },
  "appointment.list.filter": {
    label:
      "Filter the facility or location appointment list (status, dates, auto refresh) through its URL",
    requires: ["facility"],
  },
  "appointment.list.print": {
    label: "Open the appointment print page with the list's filters",
    requires: ["facility"],
  },
  "appointment.note.create": {
    label: "Write a Markdown note on an appointment while cancelling it",
    requires: ["facility", "appointment"],
    produces: ["schedule", "appointment", "patient"],
  },
  "appointment.note.validate": {
    label:
      "Appointment note validation rejects formatting-only rich text (pure unit test)",
  },
  "appointment.public-booking.navigate": {
    label:
      "Go from the public booking patient select to registration, keeping the slot and reason",
    requires: ["facility", "patient-login"],
  },
  "appointment.public-patient.register": {
    label: "Register a patient on the public booking registration form",
    requires: ["facility", "patient-login"],
    produces: ["patient"],
  },
  "appointment.schedule-exception.create": {
    label: "Add an unavailability exception to a user's schedule",
    requires: ["facility", "user"],
    produces: ["schedule-exception"],
  },
  "appointment.schedule.create": {
    label: "Create a schedule template on a user's Availability tab",
    step: "tests/helper/appointment.ts:createScheduleTemplateViaUi",
    seed: "tests/helper/appointment.ts:createScheduleViaApi",
    requires: ["facility", "user"],
    produces: ["schedule"],
  },
  "appointment.schedule.edit": {
    label: "Edit a schedule template (name, encounter type)",
    requires: ["facility", "user", "schedule"],
  },
  "appointment.token.cancel": {
    label:
      "Cancel an appointment's token from its menu (hidden for read-only users)",
    requires: ["facility", "appointment", "token"],
  },
  "auth.login": {
    label: "Sign in through the staff sign-in form",
    step: "tests/helper/auth.ts:loginViaUi",
    seed: "tests/helper/auth.ts:loginViaApi",
    requires: ["user"],
    produces: ["session"],
  },
  "auth.login.redirect": {
    label:
      "A signed-out staff URL sends you to sign-in and back to that URL after signing in",
    step: "tests/helper/auth.ts:loginViaUi",
    requires: ["user", "facility"],
    produces: ["session"],
  },
  "auth.password-reset": {
    label: "Reset a forgotten password with a phone OTP while signed out",
    step: "tests/helper/auth.ts:resetPasswordViaUi",
    requires: ["user"],
    produces: ["user"],
  },
  "billing.account.create": {
    label:
      "Create a billing account for a patient from the patient's Accounts page",
    step: "tests/helper/billing.ts:createAccountViaUi",
    seed: "tests/helper/billing.ts:createAccount",
    requires: ["facility", "patient"],
    produces: ["account"],
  },
  "billing.account.edit": {
    label:
      "Edit or rebalance an account (role access, billing status choices in the edit sheet)",
    requires: ["facility", "account"],
  },
  "billing.account.filter": {
    label: "Filter the facility account list by status through the URL",
    requires: ["facility"],
  },
  "billing.account.report.list": {
    label:
      "List an account's generated reports with the query string's filters and page",
    requires: ["facility", "account"],
  },
  "billing.chargeitem.change-account": {
    label: "Move billable charge items to another account of the patient",
    requires: ["facility", "account", "chargeitem"],
  },
  "billing.chargeitem.filter": {
    label: "Filter an account's (bed) charge items by status through the URL",
    requires: ["facility", "account"],
  },
  "billing.chargeitem.print": {
    label: "Print an account's charge items in a chosen order",
    requires: ["facility", "account"],
  },
  "billing.chargeitem.quick-add": {
    label: "Add charge items to an account from a Quick Add package",
    step: "tests/helper/billing.ts:addChargeItemViaQuickAdd",
    seed: "tests/helper/billing.ts:createChargeItem",
    requires: ["facility", "account", "quick-add-package"],
    produces: ["chargeitem"],
  },
  "billing.chargeitem.search": {
    label:
      "Search an account's charge items by title, keeping the status filter",
    requires: ["facility", "account"],
  },
  "billing.discount-code.create": {
    label: "Create a facility discount code from billing settings",
    step: "tests/helper/facilitySettings.ts:createDiscountCodeViaUi",
    requires: ["facility"],
    produces: ["discount-code"],
  },
  "billing.discount-component.create": {
    label: "Create a facility discount component from billing settings",
    requires: ["facility"],
    produces: ["discount-component"],
  },
  "billing.invoice.create": {
    label: "Create a draft invoice for an account's billable charge items",
    step: "tests/helper/billing.ts:createInvoiceViaUi",
    seed: "tests/helper/billing.ts:createInvoice",
    requires: ["facility", "account", "chargeitem"],
    produces: ["invoice"],
  },
  "billing.invoice.filter": {
    label:
      "Filter invoices by date, status or creator, with the filters kept in the URL",
    requires: ["facility", "invoice"],
  },
  "billing.invoice.list": {
    label: "List the facility's invoices, page by page",
    seed: "tests/helper/billing.ts:seedInvoiceViaApi",
    requires: ["facility", "invoice"],
  },
  "billing.invoice.navigate": {
    label:
      "Open an invoice from another page and return to it through sourceUrl",
    requires: ["facility", "invoice"],
  },
  "billing.invoice.search": {
    label: "Search the invoice list, keeping its filters",
    requires: ["facility", "invoice"],
  },
  "billing.payment.change-account": {
    label: "Move active or draft payments to another account of the patient",
    requires: ["facility", "account", "payment"],
  },
  "billing.payment.filter": {
    label:
      "Filter payments by status or account, with the filters kept in the URL",
    requires: ["facility"],
  },
  "billing.payment.record": {
    label:
      "Record a payment or advance on an account from its Advance/Receipt sheet",
    step: "tests/helper/billing.ts:recordPaymentViaUi",
    seed: "tests/helper/billing.ts:createPayment",
    requires: ["facility", "account"],
    produces: ["payment"],
  },
  "billing.payment.sheet.navigate": {
    label:
      "Open the payment or credit note sheet by URL, keep it across reloads, and close it",
    requires: ["facility", "account"],
  },
  "billing.payment.transfer": {
    label: "Transfer a paid amount from one active account to another",
    requires: ["facility", "account", "payment"],
    produces: ["payment"],
  },
  "definition.activity.category.create": {
    label: "Create an activity definition resource category",
    requires: ["facility"],
    produces: ["resource-category"],
  },
  "definition.activity.category.edit": {
    label: "Edit an activity definition resource category",
    requires: ["facility", "resource-category"],
    produces: ["resource-category:activity-definition"],
  },
  "definition.activity.category.search": {
    label: "Search activity definition categories",
    requires: ["facility"],
    produces: ["resource-category:activity-definition"],
  },
  "definition.activity.create": {
    label: "Create an activity definition in a resource category",
    step: "tests/helper/definitions.ts:createActivityDefinitionViaUi",
    requires: ["facility", "resource-category:lab-tests"],
    produces: ["activity-definition"],
  },
  "definition.activity.delete": {
    label: "Delete (retire) an activity definition",
    requires: ["facility", "activity-definition"],
  },
  "definition.activity.edit": {
    label: "Edit an activity definition",
    requires: ["facility", "activity-definition"],
    produces: ["activity-definition"],
  },
  "definition.activity.filter": {
    label:
      "Filter a category's activity definitions by status or classification",
    requires: ["facility", "resource-category:lab-tests"],
    produces: ["activity-definition"],
  },
  "definition.activity.list": {
    label: "View activity definition rows and open their view and edit pages",
    requires: ["facility", "activity-definition"],
    produces: ["activity-definition"],
  },
  "definition.activity.navigate": {
    label: "Navigate between activity definition categories, lists and forms",
    requires: ["facility", "resource-category:lab-tests"],
  },
  "definition.activity.search": {
    label: "Search a category's activity definitions by title",
    requires: ["facility", "activity-definition"],
    produces: ["activity-definition"],
  },
  "definition.chargeitem.category.search": {
    label: "Search charge item definition categories",
    requires: ["facility"],
  },
  "definition.chargeitem.create": {
    label: "Create a charge item definition in a category",
    step: "tests/helper/definitions.ts:createChargeItemDefinitionViaUi",
    requires: ["facility", "resource-category:Medications"],
    produces: ["charge-item-definition"],
  },
  "definition.chargeitem.delete": {
    label: "Delete a charge item definition",
    requires: ["facility", "charge-item-definition"],
  },
  "definition.chargeitem.edit": {
    label: "Edit a charge item definition's text and prices",
    requires: ["facility", "charge-item-definition"],
  },
  "definition.chargeitem.filter": {
    label: "Filter a category's charge item definitions by status",
    requires: ["facility"],
  },
  "definition.observation.create": {
    label: "Create an observation definition",
    step: "tests/helper/definitions.ts:createObservationDefinitionViaUi",
    requires: ["facility"],
    produces: ["observation-definition"],
  },
  "definition.observation.filter": {
    label: "Filter observation definitions by status or category",
    requires: ["facility"],
  },
  "definition.observation.interpretation.create": {
    label:
      "Add an interpretation (conditions and ranges) on the observation definition form",
    requires: ["facility"],
    produces: ["observation-definition"],
  },
  "definition.observation.interpretation.delete": {
    label: "Delete an interpretation on the observation definition form",
    requires: ["facility"],
    produces: ["observation-definition"],
  },
  "definition.observation.interpretation.edit": {
    label: "Edit an interpretation on the observation definition form",
    requires: ["facility"],
    produces: ["observation-definition"],
  },
  "definition.specimen.create": {
    label: "Create a specimen definition",
    step: "tests/helper/definitions.ts:createSpecimenDefinitionViaUi",
    requires: ["facility"],
    produces: ["specimen-definition"],
  },
  "definition.specimen.delete": {
    label: "Delete (retire) a specimen definition",
    requires: ["facility", "specimen-definition"],
  },
  "definition.specimen.edit": {
    label: "Edit a specimen definition",
    requires: ["facility", "specimen-definition"],
    produces: ["specimen-definition"],
  },
  "definition.specimen.filter": {
    label: "Filter specimen definitions by status",
    requires: ["facility"],
  },
  "department.create": {
    label: "Create a department or team in a facility",
    step: "tests/helper/facilitySettings.ts:createDepartmentViaUi",
    seed: "tests/helper/facilitySettings.ts:createDepartmentViaApi",
    requires: ["facility"],
    produces: ["department"],
  },
  "department.list": {
    label: "List and page through the facility's departments",
    requires: ["facility"],
  },
  "department.search": {
    label: "Search the facility's departments by name",
    requires: ["facility"],
    produces: ["department"],
  },
  "department.sub-department.create": {
    label: "Create a sub-department inside a department",
    step: "tests/helper/facilitySettings.ts:createDepartmentViaUi",
    requires: ["facility", "department"],
    produces: ["department"],
  },
  "department.sub-team.create": {
    label: "Create a team inside a department",
    step: "tests/helper/facilitySettings.ts:createDepartmentViaUi",
    requires: ["facility", "department"],
    produces: ["department"],
  },
  "department.user.create": {
    label: "Create a new user from a department and link them to it",
    requires: ["facility", "department"],
    produces: ["user", "department-membership"],
  },
  "department.user.link": {
    label: "Link an existing user to a department with a role",
    step: "tests/helper/facilitySettings.ts:linkUserToDepartmentViaUi",
    requires: ["facility", "department", "user"],
    produces: ["department-membership"],
  },
  "department.user.role.edit": {
    label: "Change the role of a user linked to a department",
    requires: ["department-membership"],
  },
  "department.user.search": {
    label: "Search the users of a department",
    requires: ["facility", "department"],
  },
  "department.user.unlink": {
    label: "Remove a user from a department",
    requires: ["department-membership"],
  },
  "device.create": {
    label: "Register a device in a facility",
    step: "tests/helper/facilitySettings.ts:createDeviceViaUi",
    requires: ["facility"],
    produces: ["device"],
  },
  "device.delete": {
    label: "Delete a device",
    requires: ["device"],
    produces: ["device"],
  },
  "device.edit": {
    label: "Edit a device's details",
    requires: ["device"],
    produces: ["device"],
  },
  "device.list": {
    label: "List and page through the facility's devices",
    requires: ["facility"],
  },
  "device.location.assign": {
    label: "Associate a device with a location",
    requires: ["device", "location"],
    produces: ["device-location"],
  },
  "device.location.unlink": {
    label: "Disassociate a device from its location",
    requires: ["device-location"],
  },
  "device.location.view": {
    label: "View a device's current location and location history",
    requires: ["device"],
    produces: ["device"],
  },
  "device.organization.assign": {
    label: "Associate or change a device's managing organization",
    requires: ["device", "department"],
    produces: ["device-organization-association"],
  },
  "device.organization.view": {
    label: "View a device's managing organization",
    requires: ["device"],
    produces: ["device"],
  },
  "device.questionnaire.submit": {
    label: "Submit a device-subject form and read its saved response",
    requires: ["facility", "questionnaire:e2e-subject-device"],
    produces: ["device", "device.questionnaire-response"],
  },
  "device.responses.filter": {
    label: "Filter a device's form response history",
    requires: ["facility", "questionnaire:e2e-subject-device"],
    produces: ["device"],
  },
  "device.search": {
    label: "Search the facility's devices",
    requires: ["facility"],
  },
  "device.service-history.edit": {
    label: "Edit a device service record",
    requires: ["facility"],
    produces: ["device", "device.service-record"],
  },
  "device.service-record.create": {
    label: "Add a service record to a device",
    step: "tests/helper/facilitySettings.ts:addDeviceServiceRecordViaUi",
    requires: ["device"],
    produces: ["device-service-record"],
  },
  "device.service-record.edit": {
    label: "Edit a device service record",
    requires: ["device-service-record"],
    produces: ["device-service-record"],
  },
  "device.service-record.list": {
    label: "Page through a device's service history",
    requires: ["device"],
  },
  "encounter.appointment-actions.view": {
    label:
      "See and use the appointment action bar on an encounter opened from an appointment",
    requires: ["facility", "patient", "encounter", "appointment"],
  },
  "encounter.careteam.assign": {
    label: "Add a member with a practitioner role to the encounter care team",
    step: "tests/helper/encounterCare.ts:addCareTeamMemberViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["careteam-member"],
  },
  "encounter.consent.create": {
    label: "Create a consent on the encounter's Consents tab",
    step: "tests/helper/consent.ts:createConsentViaUi",
    seed: "tests/helper/consent.ts:createTestConsent",
    requires: ["facility", "patient", "encounter"],
    produces: ["consent"],
  },
  "encounter.consent.edit": {
    label: "Edit a consent's status or note from its detail page",
    requires: ["facility", "patient", "encounter", "consent"],
    produces: ["consent"],
  },
  "encounter.consent.file.download": {
    label: "Download a file attached to a consent",
    requires: ["facility", "patient", "encounter", "consent", "file"],
  },
  "encounter.consent.file.upload": {
    label: "Upload a file to a consent from its detail page",
    step: "tests/helper/consent.ts:uploadConsentFileViaUi",
    requires: ["facility", "patient", "encounter", "consent"],
    produces: ["file"],
  },
  "encounter.consent.file.view": {
    label: "Preview an image attached to a consent",
    requires: ["facility", "patient", "encounter", "consent", "file"],
  },
  "encounter.consent.list": {
    label: "Consent list cards show expiry and paginate past one page",
    seed: "tests/helper/consent.ts:createTestConsent",
    requires: ["facility", "patient", "encounter"],
    produces: ["consent"],
  },
  "encounter.consent.search": {
    label: "Search encounter consents by attached file name",
    requires: ["facility", "patient", "encounter", "consent"],
  },
  "encounter.consent.view": {
    label: "View a consent's details and attachment badges",
    requires: ["facility", "patient", "encounter", "consent"],
    produces: ["consent"],
  },
  "encounter.create": {
    label:
      "Create an encounter for a patient (class, status, priority, date, departments)",
    step: "tests/helper/encounter.ts:createEncounterViaUi",
    seed: "tests/helper/encounter.ts:createTestEncounter",
    requires: ["facility", "patient"],
    produces: ["encounter"],
  },
  "encounter.department.link": {
    label: "Link a facility department to an encounter",
    step: "tests/helper/encounter.ts:linkEncounterDepartmentViaUi",
    requires: ["facility", "patient", "encounter", "department"],
    produces: ["encounter-department"],
  },
  "encounter.department.unlink": {
    label: "Remove a linked department from an encounter",
    step: "tests/helper/encounter.ts:unlinkEncounterDepartmentViaUi",
    requires: ["facility", "patient", "encounter", "encounter-department"],
  },
  "encounter.diagnosticreport.create": {
    label: "Create a diagnostic report on a service request",
    step: "tests/facility/patient/encounter/serviceRequests/serviceRequest.ts:createDiagnosticReportViaUi",
    requires: ["service-request"],
    produces: ["diagnostic-report"],
  },
  "encounter.diagnosticreport.edit": {
    label: "Edit an existing diagnostic report",
    requires: ["diagnostic-report"],
  },
  "encounter.diagnosticreport.observation.add": {
    label: "Add extra observations to a diagnostic report",
    requires: ["diagnostic-report"],
    produces: ["observation"],
  },
  "encounter.diagnosticreport.print": {
    label: "Print the final diagnostic reports of a service request",
    requires: ["diagnostic-report"],
  },
  "encounter.diagnosticreport.result.enter": {
    label: "Enter and save diagnostic report results",
    step: "tests/facility/patient/encounter/serviceRequests/serviceRequest.ts:enterDiagnosticResultsViaUi",
    requires: ["diagnostic-report"],
    produces: ["observation"],
  },
  "encounter.diagnosticreport.review": {
    label: "Review and approve a diagnostic report",
    requires: ["diagnostic-report"],
  },
  "encounter.diagnosticreport.view": {
    label: "View diagnostic reports on a service request",
    requires: ["diagnostic-report"],
  },
  "encounter.files.list": {
    label: "Paginate the encounter Files tab with numeric offsets",
    requires: ["facility", "patient", "encounter"],
    produces: ["file"],
  },
  "encounter.files.navigate": {
    label: "Open the encounter Files tab and its sub tabs",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.history.filter": {
    label: "Filter the patient's encounter history",
    requires: ["facility", "patient"],
  },
  "encounter.immunization-policy.apply": {
    label: "Apply an immunization policy to create recommended doses",
    requires: ["facility", "patient", "encounter", "immunization-policy"],
    produces: ["immunization-recommendation"],
  },
  "encounter.immunization.record": {
    label: "Record an immunization on an encounter",
    requires: ["facility", "patient", "encounter"],
    produces: ["immunization"],
  },
  "encounter.immunization.view": {
    label: "View an encounter's immunizations and recommendations",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.list.filter": {
    label: "Filter the facility encounter list",
    requires: ["facility"],
    produces: ["facility", "department"],
  },
  "encounter.medication.edit": {
    label: "Edit a prescription and remove a medication from it",
    requires: ["facility", "patient", "encounter", "prescription"],
  },
  "encounter.medication.prescribe": {
    label: "Prescribe a medication from the encounter's Medications tab",
    step: "tests/helper/encounterCare.ts:prescribeMedicationViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["prescription"],
  },
  "encounter.navigate": {
    label:
      "Move between encounter sections and encounters, and leave the encounter",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.notes.create": {
    label: "Start a discussion thread on the encounter's Notes tab",
    step: "tests/helper/encounterCare.ts:createEncounterNoteThreadViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["note-thread"],
  },
  "encounter.notes.message": {
    label: "Send messages in an encounter note thread (single and multi-user)",
    requires: [
      "facility",
      "patient",
      "encounter",
      "note-thread",
      "user:facilityAdmin",
    ],
    produces: ["note-message"],
  },
  "encounter.notes.view": {
    label:
      "Switch between encounter note threads and see only each thread's messages",
    requires: ["facility", "patient", "encounter", "note-thread"],
    produces: ["note-thread"],
  },
  "encounter.plots.view": {
    label: "View the encounter Plots tab",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.responses.filter": {
    label: "Filter encounter questionnaire responses by author role",
    requires: ["facility", "patient", "encounter"],
    produces: [
      "patient",
      "encounter",
      "questionnaire",
      "questionnaire-response",
    ],
  },
  "encounter.responses.view": {
    label: "View submitted questionnaire responses on an encounter",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.servicerequest.create": {
    label: "Create a service request on an encounter",
    step: "tests/facility/patient/encounter/serviceRequests/serviceRequest.ts:createServiceRequestViaUi",
    requires: ["facility", "patient", "encounter", "activity-definition"],
    produces: ["service-request"],
  },
  "encounter.servicerequest.filter": {
    label:
      "Filter an encounter's service requests and keep the filters in the URL",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.servicerequest.list": {
    label: "View the encounter Service Requests list and toolbar",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.shortcut.navigate": {
    label: "Switch encounter tabs with keyboard shortcuts",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.shortcut.open": {
    label: "Open encounter forms and dialogs with keyboard shortcuts",
    requires: ["facility", "patient", "encounter"],
  },
  "encounter.specimen.collect": {
    label: "Collect the specimen of a service request",
    step: "tests/facility/patient/encounter/serviceRequests/serviceRequest.ts:collectSpecimenViaUi",
    requires: ["service-request"],
    produces: ["specimen"],
  },
  "encounter.status.transition": {
    label:
      "Change an encounter's status (update form, discharge, mark as complete)",
    step: "tests/helper/encounter.ts:changeEncounterStatusViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["patient", "encounter"],
  },
  "encounter.workspace-plugin.navigate": {
    label: "Open a workspace page provided by a plugin",
    requires: ["facility", "patient", "encounter", "workspace"],
  },
  "encounter.workspace-plugin.view": {
    label: "Render plugin widgets in an encounter workspace",
    requires: ["facility", "patient", "encounter", "workspace"],
  },
  "encounter.workspace.filter": {
    label: "Filter lists on workspace system pages",
    requires: ["facility", "patient", "encounter", "workspace"],
  },
  "encounter.workspace.select": {
    label: "Choose the workspace an encounter is shown with",
    requires: ["facility", "patient", "encounter", "workspace"],
  },
  "encounter.workspace.view": {
    label:
      "View an encounter through a configured workspace (pages and widgets)",
    requires: ["facility", "patient", "encounter", "workspace"],
  },
  "facility.bed-availability.filter": {
    label:
      "Filter the facility bed availability dashboard by status and search",
    requires: ["facility"],
  },
  "facility.create": {
    label: "Create a facility from a governance organization's Facilities tab",
    step: "tests/helper/facility.ts:createFacilityViaUi",
    requires: ["org:govt"],
    produces: ["facility"],
  },
  "facility.delete": {
    label: "Delete a facility after typing its confirmation text",
    step: "tests/helper/facility.ts:deleteFacilityViaUi",
    requires: ["facility"],
  },
  "facility.details.view": {
    label: "View a facility's details page (call link, map link, type badge)",
    requires: ["facility"],
  },
  "facility.edit": {
    label:
      "Edit a facility's details (description, phone, PIN code, address, map location)",
    step: "tests/helper/facility.ts:updateFacilityViaUi",
    requires: ["facility"],
  },
  "facility.overview.navigate": {
    label: "Open a page from a facility overview quick link card",
    requires: ["facility"],
  },
  "facility.patient-identifier-config.create": {
    label: "Create a facility-level patient identifier config",
    step: "tests/helper/facilitySettings.ts:createFacilityPatientIdentifierConfigViaUi",
    requires: ["facility"],
    produces: ["patient-identifier-config"],
  },
  "facility.pinned-link.create": {
    label: "Pin a facility page to the overview's Pinned Links with Shift+B",
    step: "tests/helper/facility.ts:pinCurrentPageViaUi",
    requires: ["facility"],
    produces: ["pinned-link"],
  },
  "facility.print-template.configure": {
    label: "Customize, edit or reset the facility's print templates",
    requires: ["facility"],
    produces: ["print-template"],
  },
  "facility.print-template.list": {
    label: "List the facility's print types and templates",
    requires: ["facility"],
  },
  "facility.public-details.view": { label: "Open a public facility page" },
  "facility.public-list.filter": {
    label: "Search and filter the public facility list through its URL",
    requires: ["org:govt"],
  },
  "facility.questionnaire.submit": {
    label: "Submit a facility-subject form and read its saved response",
    requires: ["facility", "questionnaire:e2e-subject-facility"],
    produces: ["facility.questionnaire-response"],
  },
  "facility.resource-request.create": {
    label: "Fill the facility resource request form",
    requires: ["facility"],
  },
  "facility.resource-request.filter": {
    label: "Filter the facility resource request list by direction and status",
    requires: ["facility"],
  },
  "facility.responses.filter": {
    label: "Filter a facility's form response history",
    requires: ["facility", "questionnaire:e2e-subject-facility"],
  },
  "facility.settings.cover.upload": {
    label: "Upload or replace the facility cover image",
    step: "tests/helper/facilitySettings.ts:uploadFacilityCoverViaUi",
    requires: ["facility"],
    produces: ["facility-cover"],
  },
  "facility.settings.general.view": {
    label: "View the facility's general settings page",
    requires: ["facility"],
  },
  "facility.templates.filter": {
    label: "Filter the facility report template list",
    requires: ["facility"],
  },
  "facility.user.search": {
    label: "Search the facility users list by username",
    requires: ["facility"],
  },
  "facility.workspace.configure": {
    label:
      "Create/configure a facility-scoped workspace with department access",
    requires: ["facility"],
    produces: ["workspace:facility"],
  },
  "facility.workspace.department.configure": {
    label: "Create/edit a department-owned workspace in a facility",
    requires: ["facility", "department"],
    produces: ["workspace:department"],
  },
  "facility.workspace.filter": {
    label: "Filter the facility workspace list by status (URL-synced)",
    requires: ["facility"],
  },
  "facility.workspace.list": {
    label: "List facility workspaces (all ownership contexts, server paging)",
    requires: ["facility"],
  },
  "inventory.delivery.cancel": {
    label:
      "Cancel (abandon / enter in error) an external delivery order and reverse unconsumed stock",
    seed: "tests/helper/inventory.ts:createExternalDeliveryDraftViaApi",
    requires: ["facility", "location:Pharmacy", "product:priced-fixture"],
    produces: ["delivery-order"],
  },
  "inventory.delivery.create": {
    label:
      "Create an external delivery order (inward entry), optionally prefilled from a purchase order",
    seed: "tests/helper/inventory.ts:createExternalDeliveryDraftViaApi",
    requires: ["facility", "location:Pharmacy"],
    produces: ["delivery-order"],
  },
  "inventory.delivery.filter": {
    label:
      "Filter a location's inward entry (delivery order) list by tab (URL state)",
    requires: ["facility", "location:Pharmacy"],
  },
  "inventory.delivery.item.add": {
    label:
      "Add purchase-request items to an external delivery draft and save them together",
    seed: "tests/helper/inventory.ts:createExternalDeliveryDraftViaApi",
    requires: ["facility", "location:Pharmacy", "product:priced-fixture"],
    produces: ["supply-delivery"],
  },
  "inventory.delivery.item.edit": {
    label: "Edit or replace items on an external delivery draft",
    seed: "tests/helper/inventory.ts:createExternalDeliveryDraftViaApi",
    requires: ["facility", "location:Pharmacy", "product:priced-fixture"],
    produces: ["supply-delivery"],
  },
  "inventory.delivery.receive": {
    label:
      "Receive an internal delivery into stock and complete it (To Receive)",
    step: "tests/helper/inventory.ts:receiveDeliveryViaUi",
    requires: ["facility", "delivery-order", "location:Bio-Chemistry Lab"],
    produces: ["stock"],
  },
  "inventory.dispense-order.filter": {
    label:
      "Filter the pharmacy dispense order list by tab and date range (URL state)",
    requires: ["facility", "location:Pharmacy"],
  },
  "inventory.medication-return.create": {
    label: "Create a medication return for a patient from the pharmacy",
    requires: ["facility", "patient", "location:Pharmacy"],
    produces: ["medication-return"],
  },
  "inventory.medication-return.filter": {
    label: "Filter the pharmacy medication return list by status (URL state)",
    requires: ["facility", "location:Pharmacy"],
  },
  "inventory.medication-return.view": {
    label:
      "Open a medication return; it loads the dispenses of the orders in its URL",
    requires: ["facility", "location:Pharmacy"],
  },
  "inventory.medication.dispense": {
    label:
      "Dispense a stocked medicine from the pharmacy with Bill Selected (one invoice issued)",
    step: "tests/helper/inventory.ts:dispenseMedicationViaUi",
    requires: [
      "facility",
      "encounter",
      "location:Pharmacy",
      "product:Paracetamol",
    ],
    produces: ["medication-dispense", "dispense-order", "invoice"],
  },
  "inventory.order.dispatch": {
    label:
      "Create, fill and approve a delivery order for an approved stock request (To Dispatch)",
    step: "tests/helper/inventory.ts:dispatchOrderViaUi",
    requires: [
      "facility",
      "stock-request",
      "location:Pharmacy",
      "product:Paracetamol",
    ],
    produces: ["delivery-order"],
  },
  "inventory.prescription-queue.filter": {
    label:
      "Filter the pharmacy prescription queue by status (URL state, cached filters)",
    requires: ["facility", "location:Pharmacy"],
  },
  "inventory.prescription.filter": {
    label:
      "Search and filter a patient's prescriptions preview in the pharmacy (URL state)",
    requires: [
      "facility",
      "encounter",
      "medication-request",
      "location:Pharmacy",
    ],
  },
  "inventory.purchase-order.create": {
    label: "Create a purchase order (external request order) for a location",
    requires: ["facility", "location:Pharmacy"],
    produces: ["purchase-order"],
  },
  "inventory.purchase-order.filter": {
    label:
      "Filter a location's purchase order list by tab and priority (URL state)",
    requires: ["facility", "location:Pharmacy"],
  },
  "inventory.stock.filter": {
    label: "Filter and sort a location's inventory list (URL state)",
    requires: ["facility", "location:Pharmacy"],
  },
  "inventory.stockrequest.complete": {
    label: "Mark an approved stock request as completed",
    step: "tests/helper/inventory.ts:completeStockRequestViaUi",
    requires: ["facility", "stock-request"],
    produces: ["stock-request"],
  },
  "inventory.stockrequest.create": {
    label: "Raise an internal stock request with one item and approve it",
    step: "tests/helper/inventory.ts:createStockRequestViaUi",
    seed: "tests/helper/inventory.ts:createStockRequestViaApi",
    requires: [
      "facility",
      "location:Bio-Chemistry Lab",
      "location:Pharmacy",
      "product:Paracetamol",
    ],
    produces: ["stock-request"],
  },
  "inventory.stockrequest.view": {
    label:
      "View an internal stock request's requested items without failing delivery reads",
    seed: "tests/helper/inventory.ts:createStockRequestViaApi",
    requires: ["facility", "location:any-2", "product:Paracetamol"],
    produces: ["stock-request"],
  },
  "inventory.transfer.filter": {
    label:
      "Filter To Dispatch / To Receive request and delivery lists by status (URL state)",
    requires: ["facility", "location:Pharmacy", "location:Bio-Chemistry Lab"],
  },
  "inventory.usage-gate.view": {
    label:
      "Inventory and Pharmacy pages and sidebar entries follow a location's inventory usage",
    seed: "tests/helper/locations.ts:createInventoryLocationViaApi",
    requires: ["facility"],
    produces: ["location"],
  },
  "location.bed-board.filter": {
    label: "Filter the bed board by bed state and bed or patient name",
    requires: ["facility", "location"],
  },
  "location.bed-board.navigate": {
    label: "Move between locations in the bed board's location tree",
    requires: ["facility", "location"],
  },
  "location.bed-board.view": {
    label: "View the beds of a location on the bed board",
    requires: ["facility", "location"],
  },
  "location.bed.create": {
    label: "Create one or more beds inside a location",
    requires: ["facility", "location"],
    produces: ["bed"],
  },
  "location.create": {
    label: "Create a top-level location in a facility",
    step: "tests/helper/facilitySettings.ts:createLocationViaUi",
    requires: ["facility"],
    produces: ["location"],
  },
  "location.edit": {
    label: "Edit a location's details",
    requires: ["location"],
    produces: ["location"],
  },
  "location.forms.navigate": {
    label: "Open and dismiss the location forms picker",
    requires: ["facility", "questionnaire:e2e-subject-location"],
    produces: ["location"],
  },
  "location.inventory-usage.configure": {
    label: "Set the inventory usage of a location or bed",
    requires: ["facility"],
    produces: ["location"],
  },
  "location.list": {
    label: "List the facility's top-level locations",
    requires: ["facility"],
  },
  "location.navigate": {
    label: "Navigate between locations, sub-locations and beds",
    requires: ["facility", "location"],
    produces: ["location", "location:bed"],
  },
  "location.questionnaire.submit": {
    label: "Submit a location-subject form from the location workspace",
    requires: ["facility", "questionnaire:e2e-subject-location"],
    produces: ["location", "location.questionnaire-response"],
  },
  "location.response.mark-error": {
    label: "Mark a location form response as entered in error",
    requires: ["facility", "questionnaire:e2e-subject-location"],
    produces: ["location"],
  },
  "location.responses.filter": {
    label: "Filter a location's form response history",
    requires: ["facility", "questionnaire:e2e-subject-location"],
    produces: ["location"],
  },
  "location.schedule.navigate": {
    label:
      "Switch a location schedule's view and exception sheet through the URL",
    requires: ["facility", "location"],
  },
  "location.servicerequest.filter": {
    label:
      "Filter a lab location's service request list by status and priority (URL state)",
    requires: [
      "facility",
      "service:Pathology Lab",
      "location:Bio-Chemistry Lab",
    ],
  },
  "location.switcher.navigate": {
    label: "Switch the current location from the sidebar location switcher",
    requires: [
      "facility",
      "healthcare-service",
      "location:Pharmacy",
      "location:Bio-Chemistry Lab",
    ],
    produces: ["healthcare-service"],
  },
  "location.tags.assign": {
    label: "Assign a tag to a location",
    requires: ["facility", "location", "tag-config"],
    produces: ["tag-config:facility-location", "location"],
  },
  "location.view": {
    label: "View a location with its sub-locations and beds",
    requires: ["facility", "location"],
  },
  "misc.date-range-picker.filter": {
    label:
      "Pick, type, clear and apply a date range in the shared date range picker",
  },
  "misc.runtime-env.configure": {
    label:
      "A deployment's runtime-env.js overrides build settings, and bad or missing values stop the app",
  },
  "nav.back.navigate": {
    label:
      "Back, Cancel and Close return to the page a view was opened from, or its parent when opened directly",
    requires: ["facility"],
    produces: ["device"],
  },
  "nav.back.view": {
    label: "Show the back button only when the page has in-app history",
    requires: ["facility"],
  },
  "nav.breadcrumb.navigate": {
    label: "Navigate through the breadcrumbs of a deep settings page",
    requires: ["facility", "device"],
    produces: ["device"],
  },
  "nav.dashboard.filter": {
    label: "Search the home dashboard's facilities and responsibilities",
    requires: ["facility"],
  },
  "nav.dashboard.view": { label: "See the signed-in user dashboard greeting" },
  "nav.developer-mode.toggle": {
    label: "Turn developer mode on with ?debug=true",
  },
  "nav.encounter-list.configure": {
    label: "Open an encounter list from the sidebar and save a default list",
    requires: ["facility"],
  },
  "nav.facility-switcher.search": {
    label: "Search facilities in the sidebar facility switcher",
    requires: ["facility"],
  },
  "nav.facility.navigate": {
    label: "Open a facility from the dashboard",
    requires: ["facility"],
  },
  "nav.landing.view": { label: "Load the signed-out landing page" },
  "nav.layout.view": {
    label: "Full-screen routes hide the sidebar while their neighbours keep it",
    requires: ["facility", "patient", "encounter"],
  },
  "nav.page-actions.run": {
    label: "Search and run a page action from the Shift+? palette",
    requires: ["facility", "patient", "encounter"],
  },
  "nav.plugin.route": {
    label: "Plugin routes load, use the host router and fall back to not found",
    requires: ["facility"],
  },
  "nav.route-areas.guard": {
    label:
      "Each route area (public, staff, patient portal) sends other sessions to the right place",
    requires: ["facility"],
  },
  "nav.router.link": {
    label: "Typed router links encode params like legacy links",
    requires: ["facility"],
  },
  "nav.router.redirect": {
    label: "Moved settings routes redirect and keep search and hash",
    requires: ["facility"],
  },
  "nav.settings.navigate": {
    label: "Navigate facility settings pages through the settings sidebar",
    requires: ["facility"],
  },
  "nav.shortcut.submit": {
    label: "Shift+Enter submits a sheet only when no overlay covers it",
    requires: ["facility", "patient"],
  },
  "nav.sidebar.navigate": {
    label:
      "Navigate workspaces through the sidebar groups, pickers and mobile drawer",
    requires: ["facility"],
  },
  "nav.sidebar.toggle": {
    label: "Hide, preview and pin the sidebar from the header or keyboard",
    requires: ["facility"],
    produces: ["questionnaire"],
  },
  "nav.sidebar.view": { label: "The sidebar shows when it can scroll further" },
  "nav.unsaved-changes.guard": {
    label: "Leaving a form with unsaved changes asks for confirmation",
    requires: ["facility"],
  },
  "nav.user-routes.redirect": {
    label:
      "/user and /users/<username> routes open the right user page and tab",
    requires: ["user:admin"],
  },
  "org.encounter.view": {
    label: "Open a patient's encounter through an organization's patient pages",
    requires: ["org:govt", "patient", "encounter"],
  },
  "org.facility.search": {
    label: "Search an organization's facilities by name",
    requires: ["org:govt"],
  },
  "org.patient.search": {
    label: "Search an organization's patients by name",
    requires: ["org:govt"],
  },
  "org.plugin-tab.view": {
    label: "Open a plugin-provided organization tab",
    requires: ["org:govt"],
  },
  "org.referral.filter": {
    label: "Filter an organization's referrals by status",
    requires: ["org:govt"],
  },
  "org.suborganization.search": {
    label: "Search an organization's sub-organizations by name",
    requires: ["org:govt"],
  },
  "org.user.search": {
    label: "Search an organization's users by username",
    requires: ["org:govt"],
  },
  "patient.encounters.list": {
    label: "List a patient's encounters",
    requires: ["facility", "patient"],
  },
  "patient.files.archive": {
    label: "Archive a patient file with a reason",
    requires: ["facility", "patient", "file"],
    produces: ["file"],
  },
  "patient.files.filter": {
    label: "Filter patient files by archived status (URL search params)",
    requires: ["facility", "patient"],
  },
  "patient.files.navigate": {
    label: "Open the patient files Reports sub tab from the URL",
    requires: ["facility", "patient"],
  },
  "patient.files.rename": {
    label: "Rename a patient file",
    requires: ["facility", "patient", "file"],
    produces: ["file"],
  },
  "patient.files.upload": {
    label: "Upload files (with display names) on the patient's Files tab",
    step: "tests/helper/patient.ts:uploadPatientFileViaUi",
    requires: ["facility", "patient"],
    produces: ["file"],
  },
  "patient.files.view": {
    label: "Preview a patient file, including one uploaded by another user",
    requires: ["facility", "patient", "file", "user:nurse"],
    produces: ["file"],
  },
  "patient.history.filter": {
    label: "Filter the patient's clinical history",
    requires: ["facility", "patient"],
  },
  "patient.history.navigate": {
    label: "Return from a patient's clinical history to where it was opened",
    requires: ["facility", "patient"],
  },
  "patient.history.procedure.list": {
    label: "View a patient's recorded procedures in clinical history",
    requires: ["facility", "patient", "procedure"],
  },
  "patient.home.view": {
    label: "Open a patient's home page after verification",
    requires: ["facility", "patient"],
  },
  "patient.identifier.view": {
    label:
      "See a facility-level patient identifier on the profile and encounter header",
    requires: ["facility", "patient", "encounter"],
    produces: ["patient-identifier-config"],
  },
  "patient.immunization.view": {
    label: "View a patient's immunization forecast and administered doses",
    requires: ["facility", "patient"],
  },
  "patient.infocard.view": {
    label:
      "Patient info hover card hides Patient Home on the patient home page",
    requires: ["facility", "encounter"],
  },
  "patient.notes.create": {
    label: "Start a discussion thread on the patient's Notes tab",
    step: "tests/helper/patient.ts:createPatientNoteThreadViaUi",
    requires: ["facility", "patient"],
    produces: ["note-thread"],
  },
  "patient.notes.message": {
    label: "Send messages in a patient note thread (single and multi-user)",
    requires: ["facility", "patient", "note-thread", "user:facilityAdmin"],
    produces: ["note-message"],
  },
  "patient.notes.view": {
    label:
      "Switch between patient note threads and see only each thread's messages",
    requires: ["facility", "patient", "note-thread"],
    produces: ["note-thread"],
  },
  "patient.register": {
    label: "Register a new patient through the registration form",
    step: "tests/helper/patient.ts:registerPatientViaUi",
    seed: "tests/helper/patient.ts:createTestPatient",
    requires: ["facility"],
    produces: ["patient"],
  },
  "patient.request.create": {
    label: "Create a resource request from the patient's Requests tab",
    step: "tests/helper/patient.ts:createResourceRequestViaUi",
    requires: ["facility", "patient"],
    produces: ["resource-request"],
  },
  "patient.search": {
    label: "Search patients by phone number",
    requires: ["facility"],
  },
  "patient.tags.assign": {
    label:
      "Apply a facility tag (with custom expiry) to a patient from the patient page",
    requires: ["facility", "patient", "tag-config:facility"],
    produces: ["patient-tag"],
  },
  "patient.user.assign": {
    label: "Assign a user with a role to a patient from the Users tab",
    step: "tests/helper/patient.ts:assignUserToPatientViaUi",
    requires: ["facility", "patient"],
    produces: ["patient-user"],
  },
  "product.create": {
    label:
      "Create a product by receiving a new batch of a product knowledge on a delivery order",
    step: "tests/helper/definitions.ts:createProductViaUi",
    seed: "tests/helper/definitions.ts:createProductViaApi",
    requires: [
      "facility",
      "product-knowledge",
      "charge-item-category",
      "delivery-order:draft",
      "location:Pharmacy",
    ],
    produces: ["product", "charge-item-definition", "supply-delivery"],
  },
  "product.edit": {
    label: "Edit a product's status",
    requires: ["facility", "product"],
  },
  "product.filter": {
    label: "Filter products by product knowledge or status",
    requires: ["facility"],
  },
  "product.knowledge.create": {
    label: "Create a product knowledge in a category",
    step: "tests/helper/definitions.ts:createProductKnowledgeViaUi",
    seed: "tests/helper/definitions.ts:createProductKnowledgeViaApi",
    requires: ["facility", "resource-category:Medications"],
    produces: ["product-knowledge"],
  },
  "product.knowledge.delete": {
    label: "Delete a product knowledge",
    requires: ["facility", "product-knowledge"],
  },
  "product.knowledge.edit": {
    label: "Edit a product knowledge",
    requires: ["facility", "product-knowledge"],
    produces: ["product-knowledge"],
  },
  "product.knowledge.filter": {
    label: "Filter a category's product knowledge by status or product type",
    requires: ["facility"],
  },
  "product.knowledge.list": {
    label: "View a category's product knowledge list",
    requires: ["facility"],
  },
  "product.list": { label: "View the product list", requires: ["facility"] },
  "profile.avatar.delete": {
    label: "Delete a user's avatar",
    step: "tests/helper/auth.ts:deleteAvatarViaUi",
    requires: ["user", "avatar"],
  },
  "profile.avatar.upload": {
    label: "Upload, crop and save a user's avatar",
    step: "tests/helper/auth.ts:uploadAvatarViaUi",
    requires: ["user"],
    produces: ["avatar"],
  },
  "profile.cache.clear": {
    label:
      "Clear the browser cache (or apply an update) from the profile without losing local drafts",
    requires: ["facility", "user:admin", "patient", "encounter"],
  },
  "profile.details.view": {
    label: "View another user's profile without their private account settings",
    requires: ["user"],
  },
  "profile.password.edit": {
    label: "Open and cancel the update-password form on the own account",
  },
  "profile.professional-details.edit": {
    label: "Edit a user's languages and qualifications",
    requires: ["user"],
  },
  "profile.software-update.apply": {
    label: "Apply a software update without losing the last form edit",
    requires: ["facility", "patient", "encounter"],
  },
  "profile.theme.edit": {
    label:
      "Change the own account's theme, contrast, font size and motion preferences",
    requires: ["user", "session"],
  },
  "questionnaire.author.action.configure": {
    label:
      "Author a submit-time action (condition + instruction with answer template) and save it",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.answeroption.configure": {
    label:
      "Configure a choice question's custom options or bind a value set (instance by slug, facility by id)",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.builder.navigate": {
    label:
      "Select and navigate questions in the builder (canvas, outline, toolbar, mobile select, URL params)",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.clone": {
    label: "Clone a questionnaire into a new draft from its detail page",
    step: "tests/helper/questionnaireV2.ts:cloneQuestionnaireViaUi",
    seed: "tests/helper/questionnaireV2.ts:createFacilityQuestionnaireViaApi",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.coding.link": {
    label:
      "Bind, change or remove an observation code on a question from the value set search",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.condition.configure": {
    label:
      "Author enable-when visibility conditions on a question and save them",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.create": {
    label:
      "Create a questionnaire through the v2 create form (facility mount, or admin mount without facilityId)",
    step: "tests/helper/questionnaireV2.ts:createQuestionnaireViaUi",
    seed: "tests/helper/questionnaireV2.ts:createFacilityQuestionnaireViaApi",
    requires: ["facility"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.edit": {
    label:
      "Edit a questionnaire's metadata (title) on its detail page and save",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.export": {
    label: "Download a questionnaire definition as JSON without audit fields",
    requires: ["questionnaire"],
  },
  "questionnaire.author.group.add": {
    label: "Add a group question with sub-questions in the builder",
    requires: ["questionnaire"],
    produces: ["question"],
  },
  "questionnaire.author.group.edit": {
    label: "Change a group's layout preset or type in the builder",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.import": {
    label:
      "Import questions from a JSON file or URL into the builder, or a full definition from the list",
    step: "tests/helper/questionnaireV2.ts:importQuestionsViaUi",
    requires: ["questionnaire"],
    produces: ["question"],
  },
  "questionnaire.author.label.format": {
    label:
      "Question labels stay distinct for duplicate titles (pure unit test)",
  },
  "questionnaire.author.list": {
    label:
      "List questionnaires per mount (admin = instance, facility = facility scope), permission-scoped and paginated",
    requires: ["facility"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.list.filter": {
    label:
      "Filter the questionnaire list by status tab, subject type and search, kept in the URL",
    requires: ["facility"],
  },
  "questionnaire.author.organization.assign": {
    label:
      "Link role organizations (instance) or departments (facility) to a questionnaire",
    requires: ["questionnaire"],
    produces: ["questionnaire", "department"],
  },
  "questionnaire.author.preview": {
    label:
      "Preview a questionnaire's rendered inputs in the builder's preview mode",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.preview.enablewhen": {
    label:
      "Enable-when conditions evaluate live in builder preview (kitchen-sink fixture)",
    requires: ["questionnaire:e2e-kitchen-sink-facility"],
  },
  "questionnaire.author.question.add": {
    label:
      "Append a top-level question in the builder (optionally picking its type)",
    step: "tests/helper/questionnaireV2.ts:addQuestionViaUi",
    requires: ["questionnaire"],
    produces: ["question"],
  },
  "questionnaire.author.question.delete": {
    label: "Delete questions or sub-questions in the builder",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.question.edit": {
    label:
      "Edit a question's title, type, required/repeats flags in the builder",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.question.reorder": {
    label: "Reorder questions (builder Move dialog, detail-page kebab)",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.registered-group.configure": {
    label:
      "Author a plugin-registered question group (slot chart) and repair an outdated schema",
    requires: ["questionnaire"],
    produces: ["question"],
  },
  "questionnaire.author.registered-group.validate": {
    label:
      "Core validation invokes a registered group's validator (module-level, vite-modules project)",
    requires: [
      "env:CARE_GROUP_VALIDATION_URL",
      "plugin-source:care_dental_fe",
      "plugin-source:care_vision_prescription_fe",
    ],
  },
  "questionnaire.author.save": {
    label:
      "Save builder changes (Save Changes + success toast), including failure and in-flight edit handling",
    step: "tests/helper/questionnaireV2.ts:saveQuestionnaireBuilderViaUi",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.status.transition": {
    label: "Change a questionnaire's status from the detail sidebar",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.unit.configure": {
    label:
      "Configure units on integer/decimal/quantity questions and save them",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.version": {
    label: "Browse version history and open past revisions read-only",
    requires: ["questionnaire"],
    produces: ["questionnaire"],
  },
  "questionnaire.author.view": {
    label:
      "View a questionnaire's detail page (tabs, question overview, read-only state)",
    requires: ["questionnaire"],
  },
  "questionnaire.fill.actions": {
    label:
      "Questionnaire actions run after submit and flag referenced blank answers",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.autosave": {
    label:
      "Fill sessions autosave a local draft that can be resumed or discarded",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.context-refresh": {
    label:
      "A failed background refresh keeps edited answers and offers a retry",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.draft": {
    label: "Save and resume questionnaire drafts",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.draft.discard": {
    label: "Discard on a draft overview row removes only that draft",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.draft.list": {
    label: "The encounter's Draft Forms overview lists local and server drafts",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.draft.resume": {
    label: "Continue on a draft overview row reopens the form with its answers",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.enablewhen": {
    label: "enable_when conditions show, hide and exclude dependent questions",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.history-tab": {
    label: "View the patient's clinical history tab without leaving the form",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.input.a11y": {
    label:
      "Required composite inputs expose their label and requirement accessibly",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.input.choice": {
    label: "Choice chips and dropdowns keep the selected option's coding",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.input.date": {
    label: "Decimal answers stay valid and optional dates can be cleared",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.input.quantity": {
    label:
      "A value-set quantity answer submits its unit as both unit and coding",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.input.valueset": {
    label: "Repeating value-set choice entries each keep their own code",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.layout": {
    label: "The fullscreen fill page keeps its layout and actions in view",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.mount-guard": {
    label:
      "Mismatched subject or patient/encounter URLs render a guard, not the form",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.multi-form.remove": {
    label:
      "Remove an added questionnaire from the fill session before submitting",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.multi-form.submit": {
    label:
      "Add a second questionnaire to the session and submit both in one batch",
    step: "tests/helper/questionnaire.ts:addQuestionnaireViaUi",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.navigate": {
    label: "Closing the fill page returns to the page named in return_page",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.fill.outline.navigate": {
    label: "Open the questions outline and jump to a question",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.outline.view": {
    label:
      "The fill page outline rail and panel reflect visible and answered questions",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.picker": {
    label:
      "Questionnaire pickers offer only forms for this facility, subject and status",
    requires: ["facility", "patient", "encounter", "questionnaire"],
  },
  "questionnaire.fill.readonly": {
    label: "Read-only structured questions disable their history imports",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.fill.scribe": {
    label:
      "Scribe actions write date, time and clinical rows into the fill session",
    requires: ["vite-dev-server"],
  },
  "questionnaire.fill.serialize": {
    label:
      "Time and repeating answers are serialized correctly in the submit batch",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.server-draft.discard": {
    label: "Close discards a resumed server draft",
    requires: [
      "facility",
      "patient",
      "encounter",
      "questionnaire",
      "form-submission",
    ],
    produces: ["form-submission"],
  },
  "questionnaire.fill.server-draft.resume": {
    label: "Resume a server draft and save it back onto the same record",
    requires: [
      "facility",
      "patient",
      "encounter",
      "questionnaire",
      "form-submission",
    ],
    produces: ["form-submission"],
  },
  "questionnaire.fill.server-draft.save": {
    label: "Save as Draft stores the fill session as a server draft",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["form-submission"],
  },
  "questionnaire.fill.server-draft.submit": {
    label: "Submitting a resumed server draft links and completes it",
    requires: [
      "facility",
      "patient",
      "encounter",
      "questionnaire",
      "form-submission",
    ],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.submit": {
    label: "Fill a questionnaire on an encounter or patient and submit it",
    step: "tests/helper/questionnaire.ts:submitQuestionnaireViaUi",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.validation": {
    label: "Required and broken questions block Save Changes with field errors",
    requires: ["facility", "patient", "encounter", "questionnaire"],
    produces: ["questionnaire-response"],
  },
  "questionnaire.fill.valueset.configure": {
    label:
      "Switch a value-set question between the facility override and the instance set",
    requires: ["facility", "patient", "encounter", "questionnaire", "valueset"],
    produces: ["valueset-preference"],
  },
  "questionnaire.structured.allergy.create": {
    label: "Record an allergy from the encounter's Add Allergy link",
    step: "tests/helper/structuredQuestions.ts:addAllergyViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["allergy"],
  },
  "questionnaire.structured.chargeitem.create": {
    label:
      "Add a charge item to an encounter through the charge item questionnaire",
    step: "tests/helper/structuredQuestions.ts:addStructuredChargeItemViaUi",
    requires: ["facility", "patient", "encounter", "charge-item-definition"],
    produces: ["charge-item"],
  },
  "questionnaire.structured.chargeitem.edit": {
    label: "Charge item rows keep their identity across removal and remount",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.structured.diagnosis.create": {
    label:
      "Record a diagnosis on an encounter through the diagnosis questionnaire",
    step: "tests/helper/structuredQuestions.ts:addDiagnosisViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["diagnosis"],
  },
  "questionnaire.structured.diagnosis.edit": {
    label: "Diagnosis edits survive remount and local draft recovery",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.structured.encounter.edit": {
    label:
      "Edit the encounter through its structured question and keep the edits",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.structured.files.edit": {
    label: "Attached files keep their names across remount and block Minimize",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.structured.files.upload": {
    label: "Upload files through the files question within the size limit",
    requires: ["facility", "patient", "encounter"],
    produces: ["file"],
  },
  "questionnaire.structured.medication-request.create": {
    label:
      "Prescribe a medication through the medication request questionnaire",
    step: "tests/helper/structuredQuestions.ts:addMedicationRequestViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["medication-request"],
  },
  "questionnaire.structured.medication-request.edit": {
    label: "Prescription drafts stay isolated per prescription context",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.structured.medication-template.create": {
    label: "Save the current medications as a response template",
    requires: ["facility", "patient", "encounter"],
  },
  "questionnaire.structured.procedure.create": {
    label: "Record a procedure with outcome and details on an encounter",
    seed: "tests/helper/structuredQuestions.ts:createProcedureViaApi",
    requires: ["facility", "patient", "encounter"],
    produces: ["procedure"],
  },
  "questionnaire.structured.procedure.delete": {
    label: "Remove a saved procedure, marking it entered in error",
    requires: ["facility", "patient", "encounter", "procedure"],
  },
  "questionnaire.structured.symptom.create": {
    label: "Record a symptom on an encounter through the symptom questionnaire",
    step: "tests/helper/structuredQuestions.ts:addSymptomViaUi",
    requires: ["facility", "patient", "encounter"],
    produces: ["symptom"],
  },
  "questionnaire.structured.widget.view": {
    label:
      "Each core structured question widget mounts on the encounter fill page",
    requires: ["facility", "patient", "encounter"],
  },
  "queue.board.filter": {
    label:
      "Search a queue board by patient and toggle auto refresh through its URL",
    requires: ["facility", "queue"],
  },
  "queue.create": {
    label: "Create a token queue from the facility queue list",
    step: "tests/helper/queue.ts:createQueueViaUi",
    requires: ["facility"],
    produces: ["queue"],
  },
  "queue.edit": {
    label: "Rename a token queue",
    step: "tests/helper/queue.ts:renameQueueViaUi",
    requires: ["facility", "queue"],
    produces: ["queue"],
  },
  "queue.list.filter": {
    label: "Filter the queue list by date and page through its URL",
    requires: ["facility"],
  },
  "queue.practitioner.filter": {
    label: "Pick the practitioner whose queues are listed",
    requires: ["facility", "user:care-doctor"],
  },
  "queue.token-category.create": {
    label: "Create a token category for a resource type",
    step: "tests/helper/facilitySettings.ts:createTokenCategoryViaUi",
    requires: ["facility"],
    produces: ["token-category"],
  },
  "queue.token-category.default.set": {
    label: "Make a token category the default for its resource type",
    seed: "tests/helper/facilitySettings.ts:setDefaultTokenCategoryViaApi",
    requires: ["token-category"],
    produces: ["token-category"],
  },
  "queue.token-category.edit": {
    label: "Edit a token category's name and shorthand",
    requires: ["token-category"],
    produces: ["token-category"],
  },
  "queue.token-category.list": {
    label: "List the facility's token categories by resource type",
    requires: ["facility"],
  },
  "queue.token-category.search": {
    label: "Search the facility's token categories",
    requires: ["facility"],
  },
  "referral.appointment.book": {
    label: "Book an appointment from a referral and keep it linked",
    requires: ["facility", "referral", "schedule"],
    produces: ["appointment"],
  },
  "referral.availability.create": {
    label:
      "Configure a referral availability (destination) with its request form",
    seed: "tests/helper/referrals.ts:createReferralAvailabilityFixture",
    requires: ["facility", "questionnaire:referral-form"],
    produces: ["referral-availability"],
  },
  "referral.availability.list": {
    label: "List an organization's referral availabilities, newest first",
    requires: ["organization"],
  },
  "referral.create": {
    label: "Send a referral from a patient's or encounter's referrals tab",
    step: "tests/helper/referrals.ts:createReferralViaUi",
    seed: "tests/helper/referrals.ts:createReferralFixture",
    requires: ["facility", "patient", "referral-availability"],
    produces: ["referral"],
  },
  "referral.detail.navigate": {
    label: "Go back from a referral page to its source URL",
    requires: ["facility"],
  },
  "referral.handoff.complete": {
    label:
      "Complete a cross-facility referral: send, receive, book or walk in, document and respond",
    requires: ["facility"],
    produces: ["referral", "appointment", "encounter"],
  },
  "referral.list.filter": {
    label: "Filter the facility referral list through its URL",
    requires: ["facility"],
  },
  "referral.resource.link": {
    label: "Share clinical records on a referral request or response",
    requires: ["facility", "referral"],
    produces: ["referral-resource"],
  },
  "referral.resource.upload": {
    label: "Upload and share a file on a referral response",
    requires: ["facility", "referral"],
    produces: ["referral-resource"],
  },
  "referral.resource.view": {
    label: "Preview a record shared on a referral",
    requires: ["facility", "referral"],
    produces: ["referral", "service-request"],
  },
  "referral.status.transition": {
    label: "Edit a referral, assign its team and move it through its statuses",
    requires: ["facility", "referral"],
    produces: ["referral-response"],
  },
  "service.create": {
    label: "Create a healthcare service",
    step: "tests/helper/healthcareService.ts:createHealthcareServiceViaUi",
    seed: "tests/helper/healthcareService.ts:createHealthcareServiceViaApi",
    requires: ["facility"],
    produces: ["healthcare-service"],
  },
  "service.delete": {
    label: "Delete a healthcare service",
    requires: ["healthcare-service"],
  },
  "service.list": {
    label: "List and page through the facility's healthcare services",
    requires: ["facility"],
  },
  "service.search": {
    label: "Search the facility's healthcare services",
    requires: ["facility"],
    produces: ["healthcare-service"],
  },
  "service.switcher.navigate": {
    label: "Switch healthcare service from the sidebar service switcher",
    requires: ["facility", "healthcare-service", "service:Pathology Lab"],
    produces: ["healthcare-service"],
  },
  "service.view": {
    label: "View a healthcare service's details",
    requires: ["healthcare-service"],
  },
  "user.account.delete": {
    label: "Delete a user account from its Security tab",
    requires: ["facility", "user"],
  },
  "user.create": {
    label: "Create a user from an organization's Add User sheet",
    step: "tests/helper/user.ts:createUserViaUi",
    requires: ["org:govt"],
    produces: ["user"],
  },
  "user.department.link": {
    label: "Link a user to a facility department",
    requires: ["facility", "user", "department"],
    produces: ["department"],
  },
  "user.departments.list": {
    label: "List a user's department memberships and roles",
    requires: ["facility", "user"],
    produces: ["user", "department"],
  },
  "valueset.compose": {
    label:
      "Compose include/exclude rules (and parent rules) and preview the expansion",
  },
  "valueset.create": {
    label: "Create an instance value set through the admin create form",
    step: "tests/helper/valueSet.ts:createValueSetViaUi",
    seed: "tests/helper/valueSet.ts:createInstanceValueSet",
    requires: ["facility"],
    produces: ["valueset"],
  },
  "valueset.edit": {
    label: "Edit a value set's fields while its slug stays locked",
    requires: ["valueset"],
    produces: ["valueset"],
  },
  "valueset.list": {
    label: "Find a value set in the admin list under its status tab",
    requires: ["valueset"],
    produces: ["valueset"],
  },
  "valueset.list.filter": {
    label: "Value set list status/search/catalogue filters kept in the URL",
  },
  "valueset.override": {
    label: "Customize an instance value set into a facility override",
    seed: "tests/helper/valueSet.ts:createFacilityOverride",
    requires: ["facility", "valueset"],
    produces: ["valueset"],
  },
  "workflow.appointment-to-encounter": {
    label:
      "Book a healthcare service appointment for a patient and create the patient's planned encounter from it",
    requires: ["facility", "patient"],
    produces: ["appointment", "encounter"],
  },
  "workflow.billing-cycle": {
    label:
      "Bill a patient end to end: open an account, add a Quick Add charge, invoice it and record a payment that reduces the amount due",
    requires: ["facility", "patient"],
    produces: ["account", "charge-item", "invoice", "payment"],
  },
  "workflow.facility-setup": {
    label:
      "Set up a facility: a department with a linked staff member, a location, a lab service there, a charge item definition and an active activity definition",
    requires: ["facility"],
    produces: [
      "department",
      "location",
      "healthcare-service",
      "user",
      "department-membership",
      "charge-item-definition",
      "activity-definition",
    ],
  },
  "workflow.lab-order-to-result": {
    label:
      "Lab order to result: order a lab test on an encounter, collect the specimen, create the diagnostic report and save its result",
    requires: ["facility", "patient", "encounter", "activity-definition"],
    produces: [
      "service-request",
      "specimen",
      "diagnostic-report",
      "observation",
    ],
  },
  "workflow.outpatient-visit": {
    label:
      "Outpatient visit: register a patient, open an ambulatory encounter, record a clinical form, a diagnosis and a prescription, then complete the encounter",
    requires: ["facility", "questionnaire:respiratory_status-v3"],
    produces: [
      "patient",
      "encounter",
      "questionnaire-response",
      "diagnosis",
      "medication-request",
    ],
  },
  "workflow.prescription-to-dispense": {
    label:
      "Prescribe a stocked medicine on an encounter, then dispense and bill it at the pharmacy (the dispense is not yet linked to the prescription)",
    requires: [
      "facility",
      "patient",
      "encounter",
      "location:Pharmacy",
      "product:Paracetamol",
    ],
    produces: [
      "prescription",
      "medication-dispense",
      "dispense-order",
      "invoice",
    ],
  },
  "workflow.stock-replenishment": {
    label:
      "Replenish lab stock: raise and approve a stock request, dispatch it from the Pharmacy, receive it at the Bio-Chemistry Lab and close the request",
    requires: ["facility", "location:Pharmacy", "location:Bio-Chemistry Lab"],
    produces: ["stock-request", "delivery-order", "stock"],
  },
};
