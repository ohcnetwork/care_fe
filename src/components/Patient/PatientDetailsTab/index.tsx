import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";
import EncounterHistory from "@/components/Patient/PatientDetailsTab/EncounterHistory";
import PatientFiles from "@/components/Patient/PatientDetailsTab/Files";
import { HealthProfileSummary } from "@/components/Patient/PatientDetailsTab/HealthProfileSummary";
import { ImmunisationRecords } from "@/components/Patient/PatientDetailsTab/ImmunisationRecords";
import PatientNotes from "@/components/Patient/PatientDetailsTab/Notes";
import ShiftingHistory from "@/components/Patient/PatientDetailsTab/ShiftingHistory";
import { PatientModel } from "@/components/Patient/models";

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
    route: "encounters",
    component: EncounterHistory,
  },
  {
    route: "health-profile",
    component: HealthProfileSummary,
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
    route: "patient-files",
    component: PatientFiles,
  },
  {
    route: "patient-notes",
    component: PatientNotes,
  },
];
