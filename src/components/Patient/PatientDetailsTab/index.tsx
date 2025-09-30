import { HasPermissionFn, getPermissions } from "@/common/Permissions";

import { PatientRead } from "@/types/emr/patient/patient";

import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";
import EncounterHistory from "@/components/Patient/PatientDetailsTab/EncounterHistory";
import { ClinicalHistory } from "./ClinicalHistory";

import { BookingsList } from "@/pages/Appointments/BookAppointment/BookingsList";
import { Accounts } from "./Accounts";
import { PatientFilesTab } from "./PatientFiles";
import { PatientNotesTab } from "./PatientNotes";
import { PatientUsers } from "./PatientUsers";
import { ResourceRequests } from "./ResourceRequests";
import { Updates } from "./patientUpdates";

export interface PatientProps {
  facilityId?: string;
  patientId: string;
  patientData: PatientRead;
}

export interface Tab {
  route: string;
  component: (props: PatientProps) => React.ReactNode;
  visible?: boolean;
}

interface Tabs {
  getPatientTabs: Tab[];
}

export const BASE_PATIENT_TABS: Tab[] = [
  {
    route: "demography",
    component: Demography,
  },
  {
    route: "appointments",
    component: BookingsList,
  },
  {
    route: "encounters",
    component: EncounterHistory,
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
    route: "notes",
    component: PatientNotesTab,
  },
  {
    route: "files",
    component: PatientFilesTab,
  },
  {
    route: "accounts",
    component: Accounts,
  },
  {
    route: "clinical_history",
    component: ClinicalHistory,
  },
];

export function getTabs(
  permissions: string[],
  hasPermission: HasPermissionFn,
): Tabs {
  const {
    canViewAppointments,
    canViewEncounter,
    canViewClinicalData,
    canViewPatientQuestionnaireResponses,
    canListEncounters,
    canViewPatients,
  } = getPermissions(hasPermission, permissions);

  const getTabVisibility = (tab: Tab) => {
    switch (tab.route) {
      case "appointments":
        return { ...tab, visible: canViewAppointments };
      case "encounters":
        return { ...tab, visible: canListEncounters || canViewPatients };
      case "files":
        return { ...tab, visible: canViewEncounter || canViewClinicalData };
      case "clinical_history":
        return { ...tab, visible: canViewClinicalData };
      case "updates":
        return {
          ...tab,
          visible: canViewPatientQuestionnaireResponses,
        };
      default:
        return tab;
    }
  };

  return {
    getPatientTabs: BASE_PATIENT_TABS.map((tab) =>
      getTabVisibility(tab),
    ).filter((tab) => tab.visible ?? true),
  };
}

// For router types
export const patientTabs = BASE_PATIENT_TABS;
