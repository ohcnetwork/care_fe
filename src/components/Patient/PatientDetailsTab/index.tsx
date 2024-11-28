import { PatientModel } from "../models";
import { Demography } from "./Demography";
import EncounterHistory from "./EncounterHistory";
import { HealthProfileSummary } from "./HealthProfileSummary";
import { ImmunisationRecords } from "./ImmunisationRecords";
import PatientNotes from "./Notes";
import { SampleTestHistory } from "./SampleTestHistory";
import ShiftingHistory from "./ShiftingHistory";

export interface PatientProps {
  facilityId: string;
  id: string;
  patientData: PatientModel;
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
    route: "request-sample-test",
    component: SampleTestHistory,
  },
  {
    route: "patient-notes",
    component: PatientNotes,
  },
];
