import { useMutation } from "@tanstack/react-query";
import { TriangleAlert, Upload } from "lucide-react";
import { useRef, useState } from "react";
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

import { regenerateQuestionIds } from "@/components/QuestionnaireV2/builder/builderReducer";

import { cn } from "@/lib/utils";

import { Question } from "@/types/questionnaire/question";

import useDragAndDrop from "@/hooks/useDragAndDrop";

type ImportMode = "file" | "url";
type ImportStep = "select" | "confirm";

interface ImportQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (questions: Question[]) => void;
}

/** Max accepted size for a fetched questionnaire JSON (bytes/characters). */
const MAX_IMPORT_SIZE = 5_000_000;

/**
 * Recursively narrows an unknown question-ish object down to the fields the
 * importer needs. Validation must recurse: nested `questions` reach the
 * builder tree and the PUT body unmodified, so a malformed child (missing
 * `text`, or `questions` that isn't an array) would otherwise surface as a
 * crash in the confirm step or a save that silently does nothing.
 */
function isQuestionLike(value: unknown): value is Question {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as {
    text?: unknown;
    type?: unknown;
    link_id?: unknown;
    questions?: unknown;
  };
  if (typeof candidate.text !== "string") return false;
  if (typeof candidate.type !== "string") return false;
  // link_id is optional (regenerateQuestionIds synthesizes fresh ones), but
  // when present it must be a string.
  if (
    candidate.link_id !== undefined &&
    typeof candidate.link_id !== "string"
  ) {
    return false;
  }
  if (candidate.questions !== undefined) {
    if (!Array.isArray(candidate.questions)) return false;
    return candidate.questions.every(isQuestionLike);
  }
  return true;
}

/**
 * Accepts either a bare `{ questions: [...] }` payload or a full
 * questionnaire export (which has a `questions` array alongside its other
 * fields) — both shapes are read the same way, through `.questions`.
 */
function extractQuestions(data: unknown): Question[] | null {
  if (typeof data !== "object" || data === null || !("questions" in data)) {
    return null;
  }
  const questions = (data as { questions: unknown }).questions;
  if (!Array.isArray(questions) || questions.length === 0) return null;
  return questions.every(isQuestionLike) ? (questions as Question[]) : null;
}

export function ImportQuestionsDialog({
  open,
  onOpenChange,
  onImport,
}: ImportQuestionsDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("select");
  const [mode, setMode] = useState<ImportMode>("file");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string>();
  const [pendingQuestions, setPendingQuestions] = useState<Question[] | null>(
    null,
  );

  const { dragOver, onDragOver, onDragLeave, fileDropError, setFileDropError } =
    useDragAndDrop();

  // http(s) only — z.url() alone admits javascript:, file:, data: etc.
  const urlSchema = z
    .url(t("invalid_url"))
    .refine(
      (value) => ["http:", "https:"].includes(new URL(value).protocol),
      t("invalid_url"),
    );

  const { mutate: fetchFromUrl, isPending: isFetching } = useMutation({
    mutationFn: async (importUrl: string): Promise<unknown> => {
      // Bounded fetch: timeout + content-type/size sanity checks so a slow
      // or oversized endpoint can't wedge the tab.
      const response = await fetch(importUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error("Failed to fetch questionnaire");
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType && !/json|text/i.test(contentType)) {
        throw new Error("Unexpected content type");
      }
      const declaredLength = Number(response.headers.get("content-length"));
      if (declaredLength > MAX_IMPORT_SIZE) {
        throw new Error("Questionnaire file too large");
      }
      const text = await response.text();
      if (text.length > MAX_IMPORT_SIZE) {
        throw new Error("Questionnaire file too large");
      }
      return JSON.parse(text) as unknown;
    },
    onSuccess: (data: unknown) => {
      const questions = extractQuestions(data);
      if (!questions) {
        toast.error(t("invalid_json"));
        return;
      }
      setPendingQuestions(questions);
      setStep("confirm");
    },
    onError: () => {
      toast.error(t("failed_to_import_questionnaire"));
    },
  });

  const reset = () => {
    setStep("select");
    setMode("file");
    setUrl("");
    setUrlError(undefined);
    setFileDropError("");
    setPendingQuestions(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleFile = async (file: File) => {
    setFileDropError("");
    try {
      const data: unknown = JSON.parse(await file.text());
      const questions = extractQuestions(data);
      if (!questions) {
        setFileDropError(t("invalid_json"));
        return;
      }
      setPendingQuestions(questions);
      setStep("confirm");
    } catch {
      setFileDropError(t("invalid_json"));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragLeave();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  };

  const handleImportFromUrl = () => {
    const result = urlSchema.safeParse(url);
    if (!result.success) {
      setUrlError(result.error.issues[0]?.message ?? t("invalid_url"));
      return;
    }
    setUrlError(undefined);
    fetchFromUrl(url);
  };

  const handleConfirm = () => {
    if (!pendingQuestions) return;
    try {
      onImport(regenerateQuestionIds(pendingQuestions));
    } catch {
      // Insurance against shapes the validators didn't anticipate — a toast
      // beats an uncaught throw in an onClick (which the page ErrorBoundary
      // can't catch and just leaves a dead button).
      toast.error(t("invalid_json"));
      return;
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("import_questionnaire")}</DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-4">
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as ImportMode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file">
                  {t("import_from_json_file")}
                </SelectItem>
                <SelectItem value="url">{t("import_from_url")}</SelectItem>
              </SelectContent>
            </Select>

            {mode === "file" ? (
              <div className="space-y-2">
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                    dragOver
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  // role="button" divs get no automatic Enter/Space
                  // activation — wire it up for keyboard users.
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="size-10 text-gray-400" />
                    <p className="text-sm text-gray-500 select-none">
                      {dragOver
                        ? t("drop_file_here")
                        : t("drag_and_drop_or_click_to_select")}
                    </p>
                    <p className="text-xs text-gray-400 select-none">
                      {t("json_files_only")}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
                {fileDropError && (
                  <p className="text-sm text-destructive">{fileDropError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="import-questions-url">
                  {t("paste_questionnaire_json_url")}
                </Label>
                <Input
                  id="import-questions-url"
                  value={url}
                  onChange={(e) => {
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
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
      </DialogContent>
    </Dialog>
  );
}
