import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { regenerateQuestionIdsWithMap } from "@/components/QuestionnaireV2/shared/questionTree";

import { Question } from "@/types/questionnaire/question";

import { ImportQuestionsFilePicker } from "./ImportQuestionsFilePicker";
import { useQuestionImport } from "./useQuestionImport";

type ImportMode = "file" | "url";
type ImportStep = "select" | "confirm";

interface ImportQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (questions: Question[], linkIdMap: Map<string, string>) => void;
}

export function ImportQuestionsDialog({
  open,
  onOpenChange,
  onImport,
}: ImportQuestionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Each opening owns a fresh import session. Closing from the parent
            also clears pending data and aborts its work when it unmounts. */}
        {open && (
          <ImportQuestionsContent
            onClose={() => onOpenChange(false)}
            onImport={onImport}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ImportQuestionsContentProps {
  onClose: () => void;
  onImport: ImportQuestionsDialogProps["onImport"];
}

function ImportQuestionsContent({
  onClose,
  onImport,
}: ImportQuestionsContentProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<ImportStep>("select");
  const [mode, setMode] = useState<ImportMode>("file");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string>();
  const {
    pendingQuestions,
    isFetching,
    fileError,
    importFile,
    importUrl,
    cancelImport,
  } = useQuestionImport(() => setStep("confirm"));

  // http(s) only — z.url() alone admits javascript:, file:, data: etc.
  const urlSchema = z.url({
    protocol: /^https?$/,
    error: t("invalid_url"),
  });

  const handleImportFromUrl = () => {
    const result = urlSchema.safeParse(url);
    if (!result.success) {
      setUrlError(result.error.issues[0]?.message ?? t("invalid_url"));
      return;
    }
    setUrlError(undefined);
    void importUrl(url);
  };

  const handleConfirm = () => {
    if (!pendingQuestions) return;
    try {
      const { questions, linkIdMap } =
        regenerateQuestionIdsWithMap(pendingQuestions);
      onImport(questions, linkIdMap);
    } catch {
      // Insurance against shapes the validators didn't anticipate — a toast
      // beats an uncaught throw in an onClick (which the page ErrorBoundary
      // can't catch and just leaves a dead button).
      toast.error(t("invalid_json"));
      return;
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("import_questionnaire")}</DialogTitle>
      </DialogHeader>

      {step === "select" ? (
        <div className="space-y-4">
          <Select
            value={mode}
            onValueChange={(value) => {
              cancelImport();
              setMode(value as ImportMode);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="file">{t("import_from_json_file")}</SelectItem>
              <SelectItem value="url">{t("import_from_url")}</SelectItem>
            </SelectContent>
          </Select>

          {mode === "file" ? (
            <ImportQuestionsFilePicker
              error={fileError}
              onFile={(file) => void importFile(file)}
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="import-questions-url">
                {t("paste_questionnaire_json_url")}
              </Label>
              <Input
                id="import-questions-url"
                value={url}
                onChange={(e) => {
                  cancelImport();
                  setUrl(e.target.value);
                  setUrlError(undefined);
                }}
                // eslint-disable-next-line i18next/no-literal-string -- example URL, not translatable prose
                placeholder="https://example.com/questionnaire.json"
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {t("questions_count")}: {pendingQuestions?.length ?? 0}
          </p>
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>{t("warning")}</AlertTitle>
            <AlertDescription>
              {t("all_existing_data_will_be_replaced")}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <DialogFooter>
        {step === "select" ? (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            {/* Always render the primary action so the footer keeps the
                  Cancel/primary rhythm in both modes; in file mode the
                  dropzone drives the flow, so it stays disabled. */}
            <Button
              type="button"
              onClick={handleImportFromUrl}
              disabled={mode === "file" || isFetching || !url}
            >
              {isFetching ? t("importing") : t("import")}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("select")}
            >
              {t("back")}
            </Button>
            <Button type="button" onClick={handleConfirm}>
              {t("import")}
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}
