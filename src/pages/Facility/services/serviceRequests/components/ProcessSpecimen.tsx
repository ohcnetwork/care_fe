import { t } from "i18next";
import { CircleCheck, Pencil } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

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

import { useShortcutSubContext } from "@/context/ShortcutContext";
import { Code } from "@/types/base/code/code";
import {
  ProcessingReadSpec,
  ProcessingSpec,
} from "@/types/emr/specimen/specimen";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { formatDateTime, formatName } from "@/Utils/utils";

import { COMPACT_PICKER } from "./specimenCollection";

interface ProcessSpecimenProps {
  onAddProcessing: (processing: ProcessingSpec) => void;
  onUpdateProcessing: (index: number, processing: ProcessingSpec) => void;
  existingProcessing?: ProcessingReadSpec[];
  /** Steps can't be added once a report exists. */
  hasReport: boolean;
  disableEdit: boolean;
}

export function ProcessSpecimen({
  onAddProcessing,
  onUpdateProcessing,
  existingProcessing = [],
  hasReport,
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

  useShortcutSubContext(
    noteDialog.open ? "patient:search:-global" : undefined,
    {
      ignoreInputFields: noteDialog.open,
    },
  );

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

  return (
    <>
      {existingProcessing.length > 0 && (
        <ul aria-label={t("processing")} className="space-y-1">
          {existingProcessing.map((process, index) => {
            const display = process.method?.display;
            const name = display || process.method?.code || process.description;
            // The add dialog starts the description with the step's name; drop
            // it only as a whole word, so "Centrifuged at…" stays whole.
            const rest =
              display && process.description.startsWith(display)
                ? process.description.slice(display.length)
                : null;
            const detail = !process.method
              ? null
              : rest !== null && /^($|[\s,.:;·-])/.test(rest)
                ? rest.replace(/^[\s,.:;·-]+/, "") || null
                : process.description || null;
            const performed = [
              process.time_date_time &&
                formatDateTime(process.time_date_time, "hh:mm A, DD MMM YYYY"),
              process.performer_object && formatName(process.performer_object),
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={index} className="flex min-h-7 items-center gap-2">
                <CircleCheck
                  aria-hidden="true"
                  className="size-4 shrink-0 text-green-600"
                />
                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
                  <p
                    className="text-sm break-words text-foreground sm:truncate"
                    title={detail ? `${name} · ${detail}` : name}
                  >
                    <span className="font-medium">{name}</span>
                    {detail && (
                      <span className="text-soft-foreground"> · {detail}</span>
                    )}
                  </p>
                  {performed && (
                    <p className="shrink-0 text-sm text-soft-foreground sm:ml-auto">
                      {performed}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-soft-foreground hover:text-foreground"
                  onClick={(e) =>
                    handleOpenNote(
                      e,
                      index,
                      process.description,
                      process.method,
                    )
                  }
                  disabled={disableEdit}
                  aria-label={t("edit")}
                  title={t("edit")}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {!hasReport && (
        <div className={cn(COMPACT_PICKER, "w-full sm:w-72 [&>button]:w-full")}>
          <ValueSetSelect
            system="system-specimen-processing-method-code"
            placeholder={t("process_specimen__valueset_select_placeholder")}
            onSelect={handleSelectStep}
            value={null}
            disabled={disableEdit}
          />
        </div>
      )}

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
              <div className="rounded-md bg-soft-background p-3">
                <Label className="text-sm text-soft-foreground">
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
              <p className="text-sm text-soft-foreground">
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
              <ShortcutBadge actionId="submit-action" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
