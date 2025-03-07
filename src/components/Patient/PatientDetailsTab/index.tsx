import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import EncounterHistory from "@/components/Patient/PatientDetailsTab//EncounterHistory";
import { HealthProfileSummary } from "@/components/Patient/PatientDetailsTab//HealthProfileSummary";
import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";

import { Patient } from "@/types/emr/newPatient";

import { Appointments } from "./Appointments";
import { PatientFilesTab } from "./PatientFiles";
import { PatientUsers } from "./PatientUsers";
import { ResourceRequests } from "./ResourceRequests";

export interface PatientProps {
  facilityId?: string;
  patientId: string;
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
    component: QuestionnaireResponsesList,
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
