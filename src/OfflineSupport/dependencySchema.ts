
import { OfflineKey } from "./offlineKeys";

type DependencyDescriptor = {
  location: string;
  path: string[];
  resourceType: string;
};

export type DependencySchema = {
  [K in OfflineKey]: DependencyDescriptor[];
};

export const dependencySchema: DependencySchema = {
  // Patient mutations (no parent dependencies)
  create_patient: [],
  update_patient: [],

  // Encounter mutations (depend on patient)
  create_encounter: [
    { location: "payload", path: ["patient"], resourceType: "patient" },
  ],
  mark_encounter_as_complete: [
    { location: "mutationPathParams", path: ["id"], resourceType: "encounter" },
  ],

  // Resource request ( depend on patient)
  create_resource_request: [
    { location: "payload", path: ["related_patient"], resourceType: "patient" },
  ],
  update_resource_request: [
    { location: "payload", path: ["related_patient"], resourceType: "patient" },
  ],

  // Assign/remove user to patient (depends on patient)
  assign_user_to_patient: [
    {
      location: "mutationPathParams",
      path: ["patientId"],
      resourceType: "patient",
    },
  ],
  remove_user_from_patient: [
    {
      location: "mutationPathParams",
      path: ["patientId"],
      resourceType: "patient",
    },
  ],

  // Appointment mutations (depend on patient)
  create_appointment: [
    { location: "payload", path: ["patient"], resourceType: "patient" },
  ],

  reschedule_appointment: [
    {
      location: "mutationPathParams",
      path: ["id"],
      resourceType: "appointment",
    },
  ],
  update_appointment_status: [
    {
      location: "mutationPathParams",
      path: ["id"],
      resourceType: "appointment",
    },
  ],
  cancel_appointment: [
    {
      location: "mutationPathParams",
      path: ["id"],
      resourceType: "appointment",
    },
  ],

  // Questionnaire mutations ( have deeply nested dependencies)
  structured_questionnair: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
  ],
  non_structured_questionnaire: [
    {
      location: "payload",
      path: ["requests", "*", "body", "encounter"],
      resourceType: "encounter",
    },
  ],

  // update encounter questionnair is not used for dependency resolution,it is a special case
  update_encounter_questionnair: [],
};
