import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { RichTextEditor } from "@/components/Common/RichTextEditor";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PLUGIN_Component } from "@/PluginEngine";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import query from "@/Utils/request/query";

import { DiagnosticReportAttachments } from "./DiagnosticReportAttachments";
import { DiagnosticReportItemProps } from "./diagnosticReportFormTypes";
import { DiagnosticReportItemHeader } from "./DiagnosticReportItemHeader";
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
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <DiagnosticReportItemHeader
          report={report}
          fullReport={fullReport}
          patientId={patientId}
          isExpanded={isExpanded}
          isMultipleDiagnosticReport={isMultipleDiagnosticReport}
          hasObservationHistory={
            draft.reportDefinitions.length > 0 ||
            !!fullReport?.observations?.length
          }
        />
        <CollapsibleContent>
          <CardContent className="px-2">
            <PLUGIN_Component
              __name="ServiceRequestAction"
              serviceRequestId={serviceRequestId}
            />
            <div className="space-y-6">
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
                </>
              )}
              <div className="space-y-4">
                {showEditor && (
                  <Card className="mb-4 shadow-none rounded-lg border-gray-200 bg-white">
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-base font-semibold text-gray-950">
                        {t("conclusion")}
                      </h3>
                      <RichTextEditor
                        label={t("conclusion")}
                        placeholder={t("enter_conclusion")}
                        value={draft.conclusion}
                        onChange={draft.setConclusion}
                        disabled={isReadOnly}
                      />
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-4">
                  {isPreliminary && (
                    <div className="flex justify-end space-x-4">
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isReadOnly}
                      >
                        <Save className="size-4 mr-2" />
                        {t("save_results")}
                      </Button>
                    </div>
                  )}
                  <DiagnosticReportAttachments
                    reportId={report.id}
                    attachments={attachments}
                    isPreliminary={isPreliminary}
                    isReadOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </CardContent>
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
    </Card>
  );
}
