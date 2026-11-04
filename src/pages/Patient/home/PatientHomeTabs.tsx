import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import PatientTokensList from "@/components/Tokens/PatientTokensList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBreakpoints from "@/hooks/useBreakpoints";
import { BookingsList } from "@/pages/Appointments/BookAppointment/BookingsList";
import { EncounterListRead } from "@/types/emr/encounter/encounter";
import { FacilityRead } from "@/types/facility/facility";
import PatientHomeEncounters from "./PatientHomeEncounters";

interface PatientHomeTabsProps {
  patientId: string;
  facility: FacilityRead;
  facilityPermissions: string[];
  canListEncounters: boolean;
  canWriteAppointment: boolean;
  canListTokens: boolean;
  actions?: (encounter: EncounterListRead) => React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function PatientHomeTabs({
  patientId,
  facility,
  facilityPermissions,
  canListEncounters,
  canWriteAppointment,
  canListTokens,
  actions,
  activeTab,
  onTabChange,
}: PatientHomeTabsProps) {
  const { t } = useTranslation();
  const isTab = useBreakpoints({ default: true, lg: false });

  const tabs = [
    { id: "encounters", label: t("encounters"), alwaysVisible: true },
    {
      id: "appointments",
      label: t("appointments"),
      visible: canWriteAppointment,
    },
    { id: "tokens", label: t("tokens"), visible: canListTokens && isTab },
  ].filter((tab) => tab.alwaysVisible || tab.visible);

  useEffect(() => {
    if (!isTab && activeTab === "tokens") {
      const fallbackTab = tabs.find(
        (tab) => tab.id !== "tokens" && (tab.alwaysVisible || tab.visible),
      );
      if (fallbackTab) {
        onTabChange(fallbackTab.id);
      }
    }
  }, [isTab, activeTab, tabs, onTabChange]);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="overflow-x-auto border-b border-border">
        <TabsList variant="line">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <TabsContent value="encounters">
          <PatientHomeEncounters
            patientId={patientId}
            facilityId={facility.id}
            facilityPermissions={facilityPermissions}
            canListEncounters={canListEncounters}
            actions={actions}
          />
        </TabsContent>
        {canWriteAppointment && (
          <TabsContent value="appointments">
            <BookingsList patientId={patientId} facilityId={facility.id} />
          </TabsContent>
        )}

        {canListTokens && isTab && (
          <TabsContent value="tokens">
            <PatientTokensList patientId={patientId} facility={facility} />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}
