import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";

interface ObservationHistorySheetProps {
  children: React.ReactNode;
  patientId: string;
  diagnosticReportId: string;
}

export function ObservationHistorySheet({
  children,
  patientId,
  diagnosticReportId,
}: ObservationHistorySheetProps) {
  const { t } = useTranslation();

  // Fetch the full diagnostic report to get all observations
  const { data: fullReport } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: diagnosticReportId,
      },
    }),
    enabled: !!diagnosticReportId,
  });

  // Filter deleted observations (entered_in_error)
  const deletedObservations =
    fullReport?.observations?.filter(
      (obs) => obs.status === ObservationStatus.ENTERED_IN_ERROR,
    ) || [];

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl bg-gray-50">
        <SheetHeader>
          <SheetTitle>{t("observation_history")}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-3 pr-4">
          <div className="space-y-4">
            {deletedObservations.length === 0 ? (
              <EmptyState
                icon="l-history"
                title={t("no_deleted_observations")}
                description={t("no_deleted_observations_description")}
              />
            ) : (
              deletedObservations.map((observation) => (
                <Card key={observation.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        {observation.observation_definition?.title ||
                          observation.observation_definition?.code?.display ||
                          t("observation")}
                      </h3>
                      <Badge variant="destructive" className="capitalize">
                        {t(observation.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {observation.value?.value ? (
                        <div>
                          <p className="text-gray-500">{t("value")}</p>
                          <p>{observation.value.value}</p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-gray-500">{t("modified_date")}</p>
                        <p>
                          {observation.effective_datetime
                            ? new Date(
                                observation.effective_datetime,
                              ).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t("interpretation")}</p>
                        <p className="capitalize">
                          {observation.interpretation || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t("recorded_by")}</p>
                        {observation.updated_by && (
                          <div className="flex items-center gap-2">
                            <span>{formatName(observation.updated_by)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show components if they exist */}
                    {observation.component &&
                      observation.component.length > 0 && (
                        <div>
                          <p className="text-gray-500 mb-2">
                            {t("components")}
                          </p>
                          <div className="space-y-2">
                            {observation.component.map((comp, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 p-2 rounded-md text-sm"
                              >
                                <p className="font-medium">
                                  {comp.code?.display || comp.code?.code}
                                </p>
                                <p>
                                  {comp.value?.value
                                    ? `${comp.value.value} ${
                                        comp.value.unit?.code || ""
                                      }`
                                    : "-"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {observation.note && (
                      <div>
                        <p className="text-gray-500">{t("notes")}</p>
                        <p className="text-sm">{observation.note}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
