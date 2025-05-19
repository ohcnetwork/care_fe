import { useQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { Link, usePathParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import { AdministrationTab } from "@/components/Medicine/MedicationAdministration/AdministrationTab";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { Patient } from "@/types/emr/patient";

interface EmptyStateProps {
  searching?: boolean;
  searchQuery?: string;
  message?: string;
  description?: string;
}

export const EmptyState = ({
  searching,
  searchQuery,
  message,
  description,
}: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-secondary/10 p-3">
        <CareIcon icon="l-tablets" className="text-3xl text-gray-500" />
      </div>
      <div className="max-w-[200px] space-y-1">
        <h3 className="font-medium">
          {message ||
            (searching ? t("no_matches_found") : t("no_prescriptions"))}
        </h3>
        <p className="text-sm text-gray-500">
          {description ||
            (searching
              ? t("no_medications_match_query", { searchQuery })
              : t("no_medications_prescribed"))}
        </p>
      </div>
    </div>
  );
};

interface Props {
  readonly?: boolean;
  patient: Patient;
  encounter: Encounter;
}

export default function MedicationRequestTable({ patient, encounter }: Props) {
  const { t } = useTranslation();

  const patientId = patient.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [showStopped, setShowStopped] = useState(false);
  const { hasPermission } = usePermissions();
  const { canViewClinicalData } = getPermissions(
    hasPermission,
    patient.permissions,
  );
  const { canViewEncounter, canWriteEncounter } = getPermissions(
    hasPermission,
    encounter.permissions,
  );
  const canAccess = canViewClinicalData || canViewEncounter;
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityIdExists = !!subpathMatch?.facilityId;
  const canWrite =
    facilityIdExists &&
    canWriteEncounter &&
    !inactiveEncounterStatus.includes(encounter.status);
  const { data: activeMedications, isLoading: loadingActive } = useQuery({
    queryKey: ["medication_requests_active", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounter.id,
        limit: 100,
        status: ["active", "on-hold", "draft", "unknown"].join(","),
      },
    }),
    enabled: !!patientId && canAccess,
  });

  const { data: stoppedMedications, isLoading: loadingStopped } = useQuery({
    queryKey: ["medication_requests_stopped", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounter.id,
        limit: 100,
        status: ["ended", "completed", "cancelled", "entered_in_error"].join(
          ",",
        ),
      },
    }),
    enabled: !!patientId && canAccess,
  });

  const medications = showStopped
    ? [
        ...(activeMedications?.results || []),
        ...(stoppedMedications?.results || []),
      ]
    : activeMedications?.results || [];

  const displayedMedications = !searchQuery.trim()
    ? medications
    : [
        ...(activeMedications?.results || []),
        ...(stoppedMedications?.results || []),
      ].filter((med: MedicationRequestRead) =>
        med.medication?.display
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase().trim()),
      );

  const isLoading = loadingActive || loadingStopped;

  return (
    <div className="space-y-2">
      <div className="rounded-lg">
        <Tabs defaultValue="prescriptions">
          <TabsList>
            <TabsTrigger
              value="prescriptions"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              {t("prescriptions")}
            </TabsTrigger>
            <TabsTrigger
              value="administration"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              {t("medicine_administration")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                  <CareIcon icon="l-search" className="text-lg text-gray-500" />
                  <Input
                    placeholder={t("search_medications")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-hidden placeholder:text-gray-500"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-gray-500 hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    >
                      <CareIcon icon="l-times" className="text-lg" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canWrite && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-gray-950 hover:text-gray-700 h-9"
                      data-cy="edit-prescription"
                    >
                      <Link href={`questionnaire/medication_request`}>
                        <PencilIcon className="mr-2 size-4" />
                        {t("edit")}
                      </Link>
                    </Button>
                  )}
                  {facilityIdExists && (
                    <Button
                      variant="outline"
                      disabled={!activeMedications?.results?.length}
                      size="sm"
                      className="text-gray-950 hover:text-gray-700 h-9"
                    >
                      <Link href={`prescriptions/print`}>
                        <CareIcon icon="l-print" className="mr-2" />
                        {t("print")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="min-h-[200px] flex items-center justify-center">
                  <Loading />
                </div>
              ) : !activeMedications?.results?.length &&
                !stoppedMedications?.results?.length ? (
                <EmptyState message={t("no_medications")} />
              ) : searchQuery && !displayedMedications.length ? (
                <EmptyState searching searchQuery={searchQuery} />
              ) : (
                <ScrollArea className="h-fit">
                  <div className="min-w-[800px]">
                    <div className="p-2">
                      <MedicationsTable medications={displayedMedications} />
                    </div>
                    {!!stoppedMedications?.results?.length &&
                      !searchQuery.trim() && (
                        <div
                          className="p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                          onClick={() => setShowStopped(!showStopped)}
                          data-cy="toggle-stopped-medications"
                        >
                          <CareIcon
                            icon={showStopped ? "l-eye-slash" : "l-eye"}
                            className="size-4"
                          />
                          <span className="text-sm underline">
                            {showStopped ? t("hide") : t("show")}{" "}
                            {`${stoppedMedications?.results?.length} ${t("stopped")}`}{" "}
                            {t("prescriptions")}
                          </span>
                        </div>
                      )}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <TabsContent value="administration">
            <AdministrationTab
              patientId={patientId}
              encounterId={encounter.id}
              canWrite={canWrite}
              canAccess={canAccess}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
