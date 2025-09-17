import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Appointments } from "@/components/Patient/PatientDetailsTab/Appointments";
import { PatientRead } from "@/types/emr/patient/patient";
import PatientHomeEncounters from "./PatientHomeEncounters";
import PatientHomeTokens from "./PatientHomeTokens";

interface PatientHomeTabsProps {
  patientId: string;
  facilityId: string;
  facilityPermissions: string[];
  canListEncounters: boolean;
  canWriteAppointment: boolean;
  canCreateToken: boolean;
  patientData: PatientRead;
}

export default function PatientHomeTabs({
  patientId,
  facilityId,
  facilityPermissions,
  canListEncounters,
  canWriteAppointment,
  canCreateToken,
  patientData,
}: PatientHomeTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("encounters");

  const tabs = [
    { id: "encounters", label: t("encounters"), alwaysVisible: true },
    {
      id: "appointments",
      label: t("appointments"),
      visible: canWriteAppointment,
    },
    { id: "tokens", label: t("tokens"), visible: canCreateToken },
  ].filter((tab) => tab.alwaysVisible || tab.visible);

  return (
    <div className="w-full">
      {/* Custom Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-700 hover:text-gray-500 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "encounters" && (
          <PatientHomeEncounters
            patientId={patientId}
            facilityId={facilityId}
            facilityPermissions={facilityPermissions}
            canListEncounters={canListEncounters}
          />
        )}

        {activeTab === "appointments" && canWriteAppointment && (
          <Appointments
            patientData={patientData}
            facilityId={facilityId}
            patientId={patientId}
          />
        )}

        {activeTab === "tokens" && canCreateToken && (
          <PatientHomeTokens patientId={patientId} facilityId={facilityId} />
        )}
      </div>
    </div>
  );
}
