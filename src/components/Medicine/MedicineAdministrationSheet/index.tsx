import { Link } from "raviger";
import React from "react";
import { useState } from "react";

import SubHeading from "@/CAREUI/display/SubHeading";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useEncounter } from "@/components/Facility/ConsultationDetails/EncounterContext";
import { AdministrationTab } from "@/components/Medicine/MedicineAdministrationSheet/AdministrationTab";
import { PrescriptionsTab } from "@/components/Medicine/MedicineAdministrationSheet/PrescriptionsTab";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

interface Props {
  readonly?: boolean;
  facilityId: string;
}

const MedicineAdministrationSheet = ({ facilityId }: Props) => {
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "prescriptions" | "administration"
  >("prescriptions");

  const { data: medications, loading } = useTanStackQueryInstead(
    routes.medicationRequest.list,
    {
      pathParams: { patientId: patient!.id },
      query: {
        encounter: encounterId,
        limit: 100,
      },
    },
  );

  const { data: administrations, loading: loadingAdministrations } =
    useTanStackQueryInstead(routes.medicationAdministration.list, {
      pathParams: { patientId: patient!.id },
      query: {
        encounter: encounterId,
        limit: 100,
      },
    });

  const filteredMedications = medications?.results?.filter(
    (med: MedicationRequestRead) => {
      if (!searchQuery.trim()) return true;
      const searchTerm = searchQuery.toLowerCase().trim();
      const medicationName = med.medication?.display?.toLowerCase() || "";
      return medicationName.includes(searchTerm);
    },
  );

  const activeMedications = filteredMedications?.filter(
    (med: MedicationRequestRead) =>
      ["active", "on_hold"].includes(med.status || ""),
  );
  const discontinuedMedications = filteredMedications?.filter(
    (med: MedicationRequestRead) =>
      !["active", "on_hold"].includes(med.status || ""),
  );

  return (
    <div className="space-y-2">
      <SubHeading
        title={
          activeTab === "prescriptions"
            ? "Prescriptions"
            : "Medicine Administration"
        }
        options={
          <div className="flex items-center gap-2">
            {activeTab === "prescriptions" && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/facility/${facilityId}/encounter/${encounterId}/prescriptions/print`}
                >
                  <CareIcon icon="l-print" className="mr-2" />
                  Print
                </Link>
              </Button>
            )}
            {activeTab === "administration" && (
              <Button variant="outline" size="sm">
                <CareIcon icon="l-plus" className="mr-2" />
                Administer Medicine
              </Button>
            )}
          </div>
        }
      />

      <div className="rounded-lg border">
        <Tabs
          defaultValue="prescriptions"
          className="w-full"
          onValueChange={(value) =>
            setActiveTab(value as "prescriptions" | "administration")
          }
        >
          <div className="border-b">
            <TabsList className="h-9 w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="prescriptions"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold data-[state=active]:border-primary"
              >
                Prescriptions
              </TabsTrigger>
              <TabsTrigger
                value="administration"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold data-[state=active]:border-primary"
              >
                Medicine Administration
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="prescriptions">
            <PrescriptionsTab
              loading={loading}
              medications={medications}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredMedications={filteredMedications}
              activeMedications={activeMedications}
              discontinuedMedications={discontinuedMedications}
            />
          </TabsContent>

          <TabsContent value="administration">
            <AdministrationTab
              loadingAdministrations={loadingAdministrations}
              activeMedications={activeMedications}
              administrations={administrations}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MedicineAdministrationSheet;
