import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Appointments } from "@/components/Patient/PatientDetailsTab/Appointments";
import { PatientRead } from "@/types/emr/patient/patient";
import PatientHomeEncounters from "./PatientHomeEncounters";
import PatientHomeTokens from "./PatientHomeTokens";

interface PatientHomeTabsProps {
  patientId: string;
  facilityId: string;
  facilityPermissions: string[];
  canListEncounters: boolean;
  canCreateAppointment: boolean;
  canCreateToken: boolean;
  patientData: PatientRead;
}

export default function PatientHomeTabs({
  patientId,
  facilityId,
  facilityPermissions,
  canListEncounters,
  canCreateAppointment,
  canCreateToken,
  patientData,
}: PatientHomeTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("encounters");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="encounters" className="flex items-center gap-2">
          <span>{t("encounters")}</span>
        </TabsTrigger>
        {canCreateAppointment && (
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <span>{t("appointments")}</span>
          </TabsTrigger>
        )}
        {canCreateToken && (
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <span>{t("tokens")}</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="encounters" className="mt-4">
        <PatientHomeEncounters
          patientId={patientId}
          facilityId={facilityId}
          facilityPermissions={facilityPermissions}
          canListEncounters={canListEncounters}
        />
      </TabsContent>

      {canCreateAppointment && (
        <TabsContent value="appointments" className="mt-4">
          <Appointments
            patientData={patientData}
            facilityId={facilityId}
            patientId={patientId}
          />
        </TabsContent>
      )}

      {canCreateToken && (
        <TabsContent value="tokens" className="mt-4">
          <PatientHomeTokens patientId={patientId} facilityId={facilityId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
