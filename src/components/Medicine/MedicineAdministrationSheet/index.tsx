import { t } from "i18next";
import { Link } from "raviger";
import { useState } from "react";

import SubHeading from "@/CAREUI/display/SubHeading";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import { useEncounter } from "@/components/Facility/ConsultationDetails/EncounterContext";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { classNames } from "@/Utils/utils";
import { MedicationRequest } from "@/types/emr/medicationRequest";

interface Props {
  readonly?: boolean;
  facilityId: string;
}

const FREQUENCY_DISPLAY: Record<string, { code: string; meaning: string }> = {
  "1-1-d": { code: "OD", meaning: "Once daily" },
  "2-1-d": { code: "BD", meaning: "Twice daily" },
  "1-1-wk": { code: "QWK", meaning: "Once a week" },
  "4-1-h": { code: "Q4H", meaning: "Every 4 hours" },
  "6-1-h": { code: "QID", meaning: "Four times a day" },
  "8-1-h": { code: "TID", meaning: "Three times a day" },
  "1-1-s": { code: "STAT", meaning: "Immediately" },
  "1-1-d-night": { code: "HS", meaning: "At bedtime" },
  "2-1-d-alt": { code: "QOD", meaning: "Every other day" },
};

function getFrequencyDisplay(
  timing?: MedicationRequest["dosage_instruction"][0]["timing"],
) {
  if (!timing?.repeat) return undefined;
  const key = `${timing.repeat.frequency}-${timing.repeat.period}-${timing.repeat.period_unit}`;
  return FREQUENCY_DISPLAY[key];
}

const MedicineAdministrationSheet = ({ facilityId }: Props) => {
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredMedications = medications?.results?.filter(
    (med: MedicationRequest) => {
      if (!searchQuery.trim()) return true;
      const searchTerm = searchQuery.toLowerCase().trim();
      const medicationName = med.medication?.display?.toLowerCase() || "";
      return medicationName.includes(searchTerm);
    },
  );

  const activeMedications = filteredMedications?.filter(
    (med: MedicationRequest) =>
      ["active", "on_hold"].includes(med.status || ""),
  );
  const discontinuedMedications = filteredMedications?.filter(
    (med: MedicationRequest) =>
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

              <TabsContent value="active" className="p-0">
                <div className="divide-y">
                  {activeMedications?.map((med) => (
                    <PrescriptionEntry key={med.id} medication={med} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="discontinued" className="p-0">
                <div className="divide-y">
                  {discontinuedMedications?.map((med) => (
                    <PrescriptionEntry key={med.id} medication={med} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

const PrescriptionEntry = ({
  medication,
}: {
  medication: MedicationRequest;
}) => {
  const instruction = medication.dosage_instruction[0];
  if (!instruction) return null;

  const frequency = getFrequencyDisplay(instruction.timing);
  const additionalInstructions = instruction.additional_instruction;
  const isPrn = instruction.as_needed_boolean;

  // Get status variant
  const getStatusVariant = (
    status: string = "",
  ): "default" | "destructive" | "secondary" | "outline" | "primary" => {
    switch (status) {
      case "active":
        return "default";
      case "on-hold":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "primary";
      default:
        return "secondary";
    }
  };

  // Get priority variant
  const getPriorityVariant = (
    priority: string = "",
  ): "default" | "destructive" | "secondary" | "outline" | "primary" => {
    switch (priority) {
      case "stat":
        return "destructive";
      case "urgent":
      case "asap":
        return "primary";
      default:
        return "outline";
    }
  };

  return (
    <div
      className={classNames(
        "p-2 text-sm transition-colors",
        isPrn ? "bg-secondary/5 hover:bg-secondary/10" : "hover:bg-secondary/5",
      )}
    >
      {/* Medicine Name and Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">
                {medication.medication?.display}
              </span>
              {isPrn && (
                <Badge
                  variant="secondary"
                  className="h-5 rounded px-1.5 text-[10px] font-medium uppercase tracking-wider"
                >
                  <span className="mr-1 text-[8px]">●</span>
                  PRN
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {medication.priority && (
                <Badge
                  variant={getPriorityVariant(medication.priority)}
                  className="h-5 rounded px-1.5 text-[10px] font-medium uppercase tracking-wider"
                >
                  {medication.priority}
                </Badge>
              )}
              <Badge
                variant={getStatusVariant(medication.status)}
                className="h-5 rounded px-1.5 text-[10px] font-medium uppercase tracking-wider"
              >
                {medication.status}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {medication.medication?.code}
          </p>
        </div>
      </div>

      {/* Dosage and Instructions */}
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        {instruction.dose_and_rate && (
          <span className="font-medium">
            {instruction.dose_and_rate.type === "calculated" ? (
              <span>
                {instruction.dose_and_rate.dose_range?.low.value}{" "}
                {instruction.dose_and_rate.dose_range?.low.unit} →{" "}
                {instruction.dose_and_rate.dose_range?.high.value}{" "}
                {instruction.dose_and_rate.dose_range?.high.unit}
              </span>
            ) : (
              <span>
                {instruction.dose_and_rate.dose_quantity?.value}{" "}
                {instruction.dose_and_rate.dose_quantity?.unit}
              </span>
            )}
          </span>
        )}
        {instruction.route && (
          <span>
            <span className="text-muted-foreground">Via:</span>{" "}
            {instruction.route.display}
          </span>
        )}
        {instruction.method && (
          <span>
            <span className="text-muted-foreground">Method:</span>{" "}
            {instruction.method.display}
          </span>
        )}
        {instruction.site && (
          <span>
            <span className="text-muted-foreground">Site:</span>{" "}
            {instruction.site.display}
          </span>
        )}
        {frequency && <span className="font-medium">{frequency.code}</span>}
        {isPrn && instruction.as_needed_for && (
          <span>
            <span className="text-muted-foreground">When:</span>{" "}
            {instruction.as_needed_for.display}
          </span>
        )}
      </div>
      {instruction.timing?.repeat?.bounds_duration && (
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="text-muted-foreground">{t("duration")}:</span>{" "}
          {instruction.timing.repeat.bounds_duration.value}{" "}
          {instruction.timing.repeat.bounds_duration.unit &&
            t(`${instruction.timing.repeat.bounds_duration.unit}`)}
        </div>
      )}

      {/* Additional Instructions */}
      {additionalInstructions && additionalInstructions.length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          {additionalInstructions.map((instr, idx) => (
            <span key={idx}>
              {idx > 0 && " • "}
              {instr.display}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineAdministrationSheet;
