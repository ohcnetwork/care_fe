import EncounterHistory from "@/components/Patient/PatientDetailsTab//EncounterHistory";
import { HealthProfileSummary } from "@/components/Patient/PatientDetailsTab//HealthProfileSummary";
import { ImmunisationRecords } from "@/components/Patient/PatientDetailsTab//ImmunisationRecords";
import PatientNotes from "@/components/Patient/PatientDetailsTab//Notes";
import ShiftingHistory from "@/components/Patient/PatientDetailsTab//ShiftingHistory";
import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";
import { Updates } from "@/components/Patient/PatientDetailsTab/patientUpdates";

import { PatientModel } from "@/types/emr/patient";

import { Appointments } from "./Appointments";
import { ResourceRequests } from "./ResourceRequests";

export interface PatientProps {
  facilityId: string;
  id: string;
  patientData: PatientModel;
  refetch: () => void;
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
    route: "immunisation-records",
    component: ImmunisationRecords,
  },
  {
    route: "shift",
    component: ShiftingHistory,
  },
  {
    route: "resource_requests",
    component: ResourceRequests,
  },
  {
    route: "patient-notes",
    component: PatientNotes,
  },
];
