import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";

interface ObservationHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  diagnosticReportId: string;
}

export function ObservationHistorySheet({
  open,
  onOpenChange,
  patientId,
  diagnosticReportId,
}: ObservationHistorySheetProps) {
  const { t } = useTranslation();

  // Fetch the full diagnostic report to get all observations
  const { data: fullReport, isLoading } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: diagnosticReportId,
      },
    }),
    enabled: open && !!diagnosticReportId,
  });

  // Filter deleted observations (entered_in_error)
  const deletedObservations =
    fullReport?.observations?.filter(
      (obs) => obs.status === ObservationStatus.ENTERED_IN_ERROR,
    ) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="md" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{t("observation_history")}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-4">
            {isLoading ? (
              <CardListSkeleton count={2} />
            ) : deletedObservations.length === 0 ? (
              <EmptyState
                icon={
                  <CareIcon icon="l-history" className="text-primary size-6" />
                }
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
                          {observation.interpretation?.display || "-"}
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
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
