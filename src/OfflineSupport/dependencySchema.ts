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

  structured_questionnair: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },

    {
      location: "payload",
      path: ["requests", "*", "body", "patient"],
      resourceType: "patient",
    },
  ],
  non_structured_questionnaire: [
    {
      location: "payload",
      path: ["requests", "*", "body", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "patient"],
      resourceType: "patient",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "resource_id"],
      resourceType: "patient",
    },
  ],

  update_encounter_questionnaire: [],

  allergy_intolerance: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "patient"],
      resourceType: "patient",
    },
  ],
  diagnosis: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "patient"],
      resourceType: "patient",
    },
  ],
  medication_request: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "patient"],
      resourceType: "patient",
    },
  ],
  medication_statement: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "patient"],
      resourceType: "patient",
    },
  ],
  symptom: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "patient"],
      resourceType: "patient",
    },
  ],
  encounter: [
    {
      location: "payload",
      path: ["requests", "*", "body", "patient"],
      resourceType: "patient",
    },
  ],
  appointment: [
    {
      location: "payload",
      path: ["requests", "*", "body", "patient"],
      resourceType: "patient",
    },
  ],
  files: [
    {
      location: "payload",
      path: ["requests", "*", "body", "encounter"],
      resourceType: "encounter",
    },
  ],
  time_of_death: [
    {
      location: "payload",
      path: ["requests", "*", "body", "patient"],
      resourceType: "patient",
    },
  ],
  charge_item: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "patient"],
      resourceType: "patient",
    },
  ],
  service_request: [
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "encounter"],
      resourceType: "encounter",
    },
    {
      location: "payload",
      path: ["requests", "*", "body", "datapoints", "*", "patient"],
      resourceType: "patient",
    },
  ],
};
