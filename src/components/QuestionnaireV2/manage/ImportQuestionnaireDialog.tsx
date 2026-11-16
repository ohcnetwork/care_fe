import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
import { remapActionLinkIds } from "@/components/QuestionnaireV2/shared/actionExpression";
import {
  ImportedQuestionnaire,
  parseQuestionnaireImport,
} from "@/components/QuestionnaireV2/shared/questionnaireImport";
import { regenerateQuestionIdsWithMap } from "@/components/QuestionnaireV2/shared/questionTree";

import {
  QuestionnaireRead,
  QuestionnaireScope,
  SUBJECT_TYPES_FOR_CONTEXT,
  scopeCreateFields,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";

import { questionnaireBasicSchema } from "./questionnaireFormSchema";

interface ImportQuestionnaireDialogProps {
  scope: QuestionnaireScope;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportIdentityValues {
  title: string;
  slug: string;
}

/** Imports a complete definition as a new draft in the current scope. */
export function ImportQuestionnaireDialog({
  scope,
  open,
  onOpenChange,
}: ImportQuestionnaireDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<ImportedQuestionnaire | null>(null);
  const [fileError, setFileError] = useState<string>();
  const schema = useMemo(
    () => questionnaireBasicSchema(t).pick({ title: true, slug: true }),
    [t],
  );
  const form = useForm<ImportIdentityValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", slug: "" },
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: mutate(questionnaireApi.createV2),
    onSuccess: (created: QuestionnaireRead) => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all });
      toast.success(t("questionnaire_imported_successfully"));
      onOpenChange(false);
      navigate(`${scope.basePath}/${created.id}`);
    },
  });

  const readFile = async (file: File) => {
    setFileError(undefined);
    try {
      if (file.size > 5_000_000) {
        setFileError(t("import_questionnaire_file_too_large"));
        return;
      }
      const imported = parseQuestionnaireImport(JSON.parse(await file.text()));
      if (!imported) {
        setFileError(t("invalid_json"));
        return;
      }
      if (
        !SUBJECT_TYPES_FOR_CONTEXT[scope.authContext].includes(
          imported.subject_type,
        )
      ) {
        setFileError(
          t("import_questionnaire_subject_unavailable", {
            subject: t(imported.subject_type),
          }),
        );
        return;
      }
      setPending(imported);
      form.reset({ title: imported.title, slug: imported.slug });
    } catch {
      setFileError(t("invalid_json"));
    }
  };

  const onSubmit = (values: ImportIdentityValues) => {
    if (!pending) return;
    let regenerated: ReturnType<typeof regenerateQuestionIdsWithMap>;
    try {
      regenerated = regenerateQuestionIdsWithMap(pending.questions);
    } catch {
      setFileError(t("invalid_json"));
      setPending(null);
      return;
    }
    const { questions, linkIdMap } = regenerated;
    create({
      ...values,
      description: pending.description ?? "",
      version: pending.version == null ? "1.0" : String(pending.version),
      code: pending.code ?? undefined,
      status: "draft",
      subject_type: pending.subject_type,
      questions,
      actions: remapActionLinkIds(pending.actions ?? [], linkIdMap),
      ...scopeCreateFields(scope),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("import_questionnaire")}</DialogTitle>
          <DialogDescription>
            {t("import_questionnaire_draft_description")}
          </DialogDescription>
        </DialogHeader>
        {pending ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("title")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("slug")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormDescription>
                      {t("slug_format_message")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>
                  {t("subject_type")}: {t(pending.subject_type)}
                </span>
                <Badge variant="yellow">{t("draft")}</Badge>
              </div>
              <p className="text-sm text-gray-500">
                {t("questions_count")}: {pending.questions.length}
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setPending(null)}
                >
                  {t("back")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t("importing") : t("import")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionnaire-import-file">
                {t("json_files_only")}
              </Label>
              <Input
                id="questionnaire-import-file"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readFile(file);
                  event.target.value = "";
                }}
              />
              {fileError && (
                <p role="alert" className="text-sm text-destructive">
                  {fileError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
