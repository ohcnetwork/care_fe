import EncounterHistory from "@/components/Patient/PatientDetailsTab//EncounterHistory";
import { HealthProfileSummary } from "@/components/Patient/PatientDetailsTab//HealthProfileSummary";
import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";
import { Updates } from "@/components/Patient/PatientDetailsTab/patientUpdates";

import { Patient } from "@/types/emr/newPatient";

import { Appointments } from "./Appointments";
import { PatientFilesTab } from "./PatientFiles";
import { PatientUsers } from "./PatientUsers";
import { ResourceRequests } from "./ResourceRequests";

export interface PatientProps {
  facilityId: string;
  id: string;
  patientData: Patient;
}

const commonTabs = [
  {
    route: "demography",
    component: Demography,
  },
  {
    route: "encounters",
    component: EncounterHistory,
  },
  {
    route: "health-profile",
    component: HealthProfileSummary,
  },
  {
    route: "updates",
    component: Updates,
  },
  {
    route: "resource_requests",
    component: ResourceRequests,
  },
  {
    route: "users",
    component: PatientUsers,
  },
  {
    route: "files",
    component: PatientFilesTab,
  },
];

export const facilityPatientTabs = [
  commonTabs[0],
  {
    route: "appointments",
    component: Appointments,
  },
  ...commonTabs.slice(1),
];

export const patientTabs = [...commonTabs];
