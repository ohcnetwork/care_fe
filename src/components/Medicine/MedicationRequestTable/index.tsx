import { useQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";

import SubHeading from "@/CAREUI/display/SubHeading";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";

import query from "@/Utils/request/query";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

interface Props {
  readonly?: boolean;
  facilityId: string;
  patientId: string;
  encounterId: string;
}

export default function MedicationRequestTable({
  facilityId,
  patientId,
  encounterId,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: medications, isLoading: loading } = useQuery({
    queryKey: ["medication_requests", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: { encounter: encounterId },
    }),
    enabled: !!patientId,
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

  const EmptyState = ({ searching }: { searching?: boolean }) => (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-secondary/10 p-3">
        <CareIcon icon="l-tablets" className="text-3xl text-muted-foreground" />
      </div>
      <div className="max-w-[200px] space-y-1">
        <h3 className="font-medium">
          {searching ? "No matches found" : "No Prescriptions"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {searching
            ? `No medications match "${searchQuery}"`
            : "No medications have been prescribed yet"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <SubHeading
        title="Prescriptions"
        options={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`}
              >
                <PencilIcon />
                Edit
              </Link>
            </Button>
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
        <div className="flex items-center gap-2 border-b p-2">
          <CareIcon icon="l-search" className="text-lg text-muted-foreground" />
          <input
            type="text"
            placeholder="Search medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <CareIcon icon="l-times" className="text-lg" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <Loading />
          </div>
        ) : !medications?.results?.length ? (
          <EmptyState />
        ) : !filteredMedications?.length ? (
          <EmptyState searching />
        ) : (
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <Tabs defaultValue="active" className="w-full">
              <div className="border-b px-2">
                <TabsList className="h-9">
                  <TabsTrigger value="active" className="text-xs">
                    Active{" "}
                    <Badge variant="secondary" className="ml-2">
                      {activeMedications?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="discontinued" className="text-xs">
                    Discontinued{" "}
                    <Badge variant="secondary" className="ml-2">
                      {discontinuedMedications?.length || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-w-[800px]">
                <TabsContent value="active" className="p-2">
                  <MedicationsTable medications={activeMedications || []} />
                </TabsContent>
                <TabsContent value="discontinued" className="p-2">
                  <MedicationsTable
                    medications={discontinuedMedications || []}
                  />
                </TabsContent>
              </div>
              <ScrollBar orientation="horizontal" />
            </Tabs>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
