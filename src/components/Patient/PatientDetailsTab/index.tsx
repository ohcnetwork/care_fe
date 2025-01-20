import EncounterHistory from "@/components/Patient/PatientDetailsTab//EncounterHistory";
import { HealthProfileSummary } from "@/components/Patient/PatientDetailsTab//HealthProfileSummary";
import { Appointments } from "@/components/Patient/PatientDetailsTab/Appointments";
import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";
import { PatientFilesTab } from "@/components/Patient/PatientDetailsTab/PatientFiles";
import { PatientUsers } from "@/components/Patient/PatientDetailsTab/PatientUsers";
import { ResourceRequests } from "@/components/Patient/PatientDetailsTab/ResourceRequests";
import { Updates } from "@/components/Patient/PatientDetailsTab/patientUpdates";

import { Patient } from "@/types/emr/newPatient";

export interface PatientProps {
  facilityId: string;
  id: string;
  patientData: Patient;
}

export const patientTabs = [
  {
    route: "demography",
    component: Demography,
  },
  {
    route: "appointments",
    component: Appointments,
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
