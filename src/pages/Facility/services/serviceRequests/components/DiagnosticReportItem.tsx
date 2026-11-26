import { useQuery } from "@tanstack/react-query";
import { Check, NotepadText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { RichTextEditor } from "@/components/Common/RichTextEditor";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PLUGIN_Component } from "@/PluginEngine";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import query from "@/Utils/request/query";

import { DiagnosticReportTimestamps } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportTimestamps";
import { DiagnosticReportAttachments } from "./DiagnosticReportAttachments";
import { DiagnosticReportItemProps } from "./diagnosticReportFormTypes";
import { DiagnosticReportHeader } from "./DiagnosticReportHeader";
import { DiagnosticReportObservations } from "./DiagnosticReportObservations";
import { useDiagnosticReportAttachments } from "./useDiagnosticReportAttachments";
import { useDiagnosticReportDraft } from "./useDiagnosticReportDraft";
import { useDiagnosticReportSave } from "./useDiagnosticReportSave";

export function DiagnosticReportItem(props: DiagnosticReportItemProps) {
  const {
    report,
    patientId,
    serviceRequestId,
    observationDefinitions,
    disableEdit,
    facilityId,
    isMultipleDiagnosticReport,
  } = props;
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: fullReport } = useQuery({
    queryKey: ["diagnosticReport", report.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: { patient_external_id: patientId, external_id: report.id },
    }),
    enabled: !!report.id && isExpanded,
  });
  const attachments = useDiagnosticReportAttachments(
    report.id,
    isExpanded,
    disableEdit,
  );
  const draft = useDiagnosticReportDraft(fullReport, observationDefinitions);
  const { isReadOnly, handleSubmit } = useDiagnosticReportSave({
    ...props,
    fullReport,
    draft,
    onSaved: () => setIsExpanded(false),
  });
  const showEditor = report.status !== DiagnosticReportStatus.final;
  const isPreliminary =
    fullReport?.status === DiagnosticReportStatus.preliminary;

  return (
    <div className={cn(isExpanded && "bg-muted")}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <DiagnosticReportHeader
          report={report}
          title={
            isMultipleDiagnosticReport
              ? report.code?.display
              : report.service_request?.title
          }
          updatedBy={fullReport?.updated_by}
          icon={NotepadText}
          isExpanded={isExpanded}
          patientId={patientId}
          hasObservationHistory={
            draft.reportDefinitions.length > 0 ||
            !!fullReport?.observations?.length
          }
        />
        <CollapsibleContent>
          <div className="px-4 pb-4 sm:px-5">
            <PLUGIN_Component
              __name="ServiceRequestAction"
              serviceRequestId={serviceRequestId}
            />
            <div className="space-y-2">
              {showEditor && (
                <>
                  <PLUGIN_Component
                    __name="DiagnosticReportOverride"
                    observationDefinitions={draft.reportDefinitions}
                    handleComponentValueChange={
                      draft.handleComponentValueChange
                    }
                    handleValueChange={draft.handleValueChange}
                    handleUnitChange={draft.handleUnitChange}
                    disabled={isReadOnly}
                  />
                  <DiagnosticReportObservations
                    reportId={report.id}
                    facilityId={facilityId}
                    observationDefinitions={observationDefinitions}
                    draft={draft}
                    isReadOnly={isReadOnly}
                  />
                  <div className="space-y-1.5 rounded-lg border border-border bg-background px-3 py-2.5">
                    <h6 className="text-sm font-medium text-foreground">
                      {t("conclusion")}
                    </h6>
                    <RichTextEditor
                      label={t("conclusion")}
                      placeholder={t("enter_conclusion_of_diagnostic_report")}
                      value={draft.conclusion}
                      onChange={draft.setConclusion}
                      disabled={isReadOnly}
                    />
                  </div>
                </>
              )}
              <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row sm:items-center">
                <DiagnosticReportTimestamps report={fullReport ?? report} />
                {isPreliminary && (
                  <div className="flex items-center justify-end">
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={isReadOnly}
                    >
                      <Check className="size-4" />
                      {t("save_results")}
                    </Button>
                  </div>
                )}
              </div>
              <DiagnosticReportAttachments
                reportId={report.id}
                attachments={attachments}
                isPreliminary={isPreliminary}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      {attachments.fileUpload.Dialogues}
      <FileUploadDialog
        open={attachments.openUploadDialog}
        onOpenChange={(open) => {
          if (!open) attachments.fileUpload.clearFiles();
        }}
        fileUpload={attachments.fileUpload}
        associatingId={report.id}
        type="diagnostic_report"
        instanceId={report.id}
      />
    </div>
  );
}
