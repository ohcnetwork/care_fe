import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import PatientTokensList from "@/components/Tokens/PatientTokensList";
import useBreakpoints from "@/hooks/useBreakpoints";
import { BookingsList } from "@/pages/Appointments/BookAppointment/BookingsList";
import { FacilityRead } from "@/types/facility/facility";
import PatientHomeEncounters from "./PatientHomeEncounters";

interface PatientHomeTabsProps {
  patientId: string;
  facility: FacilityRead;
  facilityPermissions: string[];
  canListEncounters: boolean;
  canWriteAppointment: boolean;
  canCreateToken: boolean;
}

export default function PatientHomeTabs({
  patientId,
  facility,
  facilityPermissions,
  canListEncounters,
  canWriteAppointment,
  canCreateToken,
}: PatientHomeTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("encounters");
  const isTab = useBreakpoints({ default: true, lg: false });

  const tabs = [
    { id: "encounters", label: t("encounters"), alwaysVisible: true },
    {
      id: "appointments",
      label: t("appointments"),
      visible: canWriteAppointment,
    },
    { id: "tokens", label: t("tokens"), visible: canCreateToken && isTab },
  ].filter((tab) => tab.alwaysVisible || tab.visible);

  useEffect(() => {
    if (!isTab && activeTab === "tokens") {
      const fallbackTab = tabs.find(
        (tab) => tab.id !== "tokens" && (tab.alwaysVisible || tab.visible),
      );
      if (fallbackTab) {
        setActiveTab(fallbackTab.id);
      }
    }
  }, [isTab, activeTab, tabs]);

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
            facilityId={facility.id}
            facilityPermissions={facilityPermissions}
            canListEncounters={canListEncounters}
          />
        )}
        {activeTab === "appointments" && canWriteAppointment && (
          <BookingsList patientId={patientId} facilityId={facility.id} />
        )}

        {activeTab === "tokens" && canCreateToken && isTab && (
          <PatientTokensList patientId={patientId} facility={facility} />
        )}
      </div>
    </div>
  );
}
