import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Code } from "@/types/base/code/code";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { Status as ServiceRequestStatus } from "@/types/emr/serviceRequest/serviceRequest";
import mutate from "@/Utils/request/mutate";

import { CreateDiagnosticReportForm } from "./CreateDiagnosticReportForm";
import { getDiagnosticReportCreationState } from "./diagnosticReportCreation";
import { DiagnosticReportFormProps } from "./diagnosticReportFormTypes";
import { DiagnosticReportItem } from "./DiagnosticReportItem";
import { ReportTypePicker } from "./ReportTypePicker";

export type { SavedReportSignal } from "./diagnosticReportFormTypes";

export function DiagnosticReportForm({
  patientId,
  serviceRequestId,
  observationDefinitions,
  diagnosticReports,
  activityDefinition,
  specimens,
  disableEdit,
  facilityId,
  serviceRequestStatus,
  onReportSaved,
}: DiagnosticReportFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showReportTypeSelect, setShowReportTypeSelect] = useState(false);

  const {
    hasCollectedSpecimens,
    isMultipleDiagnosticReport,
    availableReportCodes,
    activeDiagnosticReports,
    showCreateReportForm,
  } = getDiagnosticReportCreationState({
    diagnosticReports,
    activityDefinition,
    specimens,
    serviceRequestStatus,
  });

  // Creating a new diagnostic report
  const { mutate: createDiagnosticReport, isPending: isCreatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.createDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
        },
      }),
      onSuccess: async () => {
        toast.success(t("diagnostic_report_created_successfully"));
        await queryClient.invalidateQueries({
          queryKey: ["serviceRequest", facilityId, serviceRequestId],
        });
      },
    });

  function handleCreateReport(code?: Code) {
    if (
      disableEdit ||
      isCreatingReport ||
      serviceRequestStatus === ServiceRequestStatus.completed
    )
      return;
    if (!hasCollectedSpecimens) {
      toast.error(t("specimen_collection_required"));
      return;
    }

    const category: Code = {
      code: "LAB",
      display: "Laboratory",
      system: "http://terminology.hl7.org/CodeSystem/v2-0074",
    };

    createDiagnosticReport({
      status: DiagnosticReportStatus.preliminary,
      category,
      service_request: serviceRequestId,
      code: code || undefined,
    });
  }

  return (
    <>
      {activeDiagnosticReports.length > 0 && (
        <div className="relative">
          <div className="relative z-10 space-y-3">
            {activeDiagnosticReports.map((report) => (
              <DiagnosticReportItem
                key={report.id}
                report={report}
                patientId={patientId}
                serviceRequestId={serviceRequestId}
                observationDefinitions={observationDefinitions}
                disableEdit={disableEdit}
                isMultipleDiagnosticReport={isMultipleDiagnosticReport}
                facilityId={facilityId}
                onReportSaved={onReportSaved}
              />
            ))}
          </div>
          {isMultipleDiagnosticReport && availableReportCodes.length > 0 && (
            <div className="-mt-3 rounded-b-lg bg-gray-100 px-2 pb-2 pt-4">
              {showReportTypeSelect ? (
                <ReportTypePicker
                  availableReportCodes={availableReportCodes}
                  hasCollectedSpecimens={hasCollectedSpecimens}
                  disableEdit={disableEdit || isCreatingReport}
                  onCreateReport={(code) => {
                    handleCreateReport(code);
                    setShowReportTypeSelect(false);
                  }}
                  onDismiss={() => setShowReportTypeSelect(false)}
                />
              ) : (
                <Button
                  variant="ghost"
                  className="gap-1.5 px-2 font-medium text-gray-950 underline hover:bg-transparent hover:text-gray-950"
                  onClick={() => {
                    setShowReportTypeSelect(true);
                  }}
                  disabled={
                    disableEdit || isCreatingReport || !hasCollectedSpecimens
                  }
                >
                  <Plus className="size-4" />
                  {t("another_diagnostic_report")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {showCreateReportForm && (
        <CreateDiagnosticReportForm
          availableReportCodes={availableReportCodes}
          hasCollectedSpecimens={hasCollectedSpecimens}
          isMultipleDiagnosticReport={isMultipleDiagnosticReport}
          disableEdit={disableEdit || isCreatingReport}
          serviceRequestId={serviceRequestId}
          handleCreateReport={handleCreateReport}
        />
      )}
    </>
  );
}
