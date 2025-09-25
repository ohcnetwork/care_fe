import { t } from "i18next";
import { CircleCheckBig, Edit, Settings2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { formatName } from "@/Utils/utils";
import { Code } from "@/types/base/code/code";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  ProcessingReadSpec,
  ProcessingSpec,
} from "@/types/emr/specimen/specimen";

interface ProcessSpecimenProps {
  onAddProcessing: (processing: ProcessingSpec) => void;
  onUpdateProcessing: (index: number, processing: ProcessingSpec) => void;
  existingProcessing?: ProcessingReadSpec[];
  diagnosticReports?: DiagnosticReportRead[];
  disableEdit: boolean;
}

export function ProcessSpecimen({
  onAddProcessing,
  onUpdateProcessing,
  existingProcessing = [],
  diagnosticReports = [],
  disableEdit,
}: ProcessSpecimenProps) {
  const [noteDialog, setNoteDialog] = useState<{
    open: boolean;
    index: number;
    description: string;
    method: Code | null;
  }>({
    open: false,
    index: -1,
    description: "",
    method: null,
  });

  const handleSelectStep = (code: Code | null) => {
    if (!code) return;

    // Open the description dialog immediately when a step is selected
    setNoteDialog({
      open: true,
      index: -1,
      description: code.display,
      method: code,
    });
  };

  const handleOpenNote = (
    e: React.MouseEvent,
    index: number,
    description: string,
    method: Code | null,
  ) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    setNoteDialog({
      open: true,
      index,
      description,
      method,
    });
  };

  const handleUpdateNote = () => {
    if (noteDialog.index === -1) {
      // This is a new processing step
      onAddProcessing({
        description: noteDialog.description,
        method: noteDialog.method,
        performer: null,
        time_date_time: new Date().toISOString(),
      });
    } else {
      // This is updating an existing step
      const process = existingProcessing[noteDialog.index];
      onUpdateProcessing(noteDialog.index, {
        ...process,
        description: noteDialog.description,
      });
    }
    setNoteDialog({ open: false, index: -1, description: "", method: null });
  };

  // If there are diagnostic reports, don't show the processing steps selection
  const hasReport = diagnosticReports.length > 0;

  return (
    <>
      <div>
        <div className="flex-row items-center justify-between space-y-0 pb-2">
          <div className="text-sm font-medium flex items-center gap-1">
            <Settings2 className="h-4 w-4" />
            {t("process_specimen")}
            <Badge variant="primary">{existingProcessing.length}</Badge>
          </div>
        </div>
        <div className="space-y-4">
          {existingProcessing.map((process, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-primary-100 border border-primary-300 px-3 py-2"
            >
              <CircleCheckBig className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-sm text-primary-950">
                  {process.method?.display || process.description}
                </div>
                {process.method &&
                  process.description !== process.method.display && (
                    <div className="text-sm text-gray-600 mt-0.5">
                      {process.description}
                    </div>
                  )}
              </div>
              <div>
                {process.performer_object && (
                  <div className="text-sm text-gray-600 mt-0.5">
                    {t("performed_by")}: {formatName(process.performer_object)}
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-0.5">
                  {t("performed_on")}:{" "}
                  {process.time_date_time
                    ? new Date(process.time_date_time).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "N/A"}
                </div>
              </div>
              <Button
                type="button" // Explicitly set type to button
                variant="ghost"
                size="sm"
                className="ml-auto h-auto p-1.5"
                onClick={(e) =>
                  handleOpenNote(e, index, process.description, process.method)
                }
                disabled={disableEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {!hasReport && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("process_specimen__step_heading")}
              </label>
              <ValueSetSelect
                system="system-specimen-processing-method-code"
                placeholder={t("process_specimen__valusetselect_placeholder")}
                onSelect={handleSelectStep}
                value={null}
                disabled={disableEdit}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={noteDialog.open}
        onOpenChange={(open) =>
          !open && setNoteDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteDialog.index === -1
                ? t("process_specimen__dialog_action_title", {
                    action: t("add"),
                  })
                : t("process_specimen__dialog_action_title", {
                    action: t("edit"),
                  })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {noteDialog.method && (
              <div className="rounded-md bg-gray-50 p-3">
                <Label className="text-sm text-gray-600">
                  {t("processing_method")}
                </Label>
                <div className="font-medium mt-1">
                  {noteDialog.method.display}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("description")}</Label>
              <Textarea
                value={noteDialog.description}
                onChange={(e) =>
                  setNoteDialog((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t("process_specimen__textarea_placeholder")}
                className="min-h-[100px]"
              />
              <p className="text-sm text-gray-500">
                {t("process_specimen__dialog_text_area_description")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setNoteDialog({
                  open: false,
                  index: -1,
                  description: "",
                  method: null,
                })
              }
            >
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleUpdateNote}>
              {noteDialog.index === -1 ? t("add") : t("update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
