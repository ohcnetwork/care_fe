"use client";

import { Link } from "raviger";
import React from "react";
import { useState } from "react";

import SubHeading from "@/CAREUI/display/SubHeading";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useEncounter } from "@/components/Facility/ConsultationDetails/EncounterContext";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

import { PrescriptionsTab } from "./PrescriptionsTab";

interface Props {
  readonly?: boolean;
  facilityId: string;
}

const MedicineAdministrationSheet = ({ facilityId }: Props) => {
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: medications, loading } = useQuery(
    routes.medicationRequest.list,
    {
      pathParams: { patientId: patient!.id },
      query: {
        encounter: encounterId,
        limit: 100,
      },
    },
  );

  const filteredMedications = medications?.results?.filter(
    (medication: MedicationRequestRead) =>
      medication.medication?.display
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const activeMedications = filteredMedications?.filter(
    (medication: MedicationRequestRead) => medication.status === "active",
  );

  const discontinuedMedications = filteredMedications?.filter(
    (medication: MedicationRequestRead) => medication.status === "stopped",
  );

  return (
    <div className="space-y-2">
      <SubHeading
        title="Prescriptions"
        options={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/facility/${facilityId}/encounter/${encounterId}/prescriptions/print`}
              >
                <CareIcon icon="l-print" className="mr-2" />
                Print
              </Link>
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border">
        <Tabs defaultValue="prescriptions">
          <TabsList className="h-9 w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="prescriptions"
              className="rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold data-[state=active]:border-primary"
            >
              Prescriptions
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
};

export default MedicineAdministrationSheet;
