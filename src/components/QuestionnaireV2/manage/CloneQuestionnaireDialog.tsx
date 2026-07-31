import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { regenerateQuestionIds } from "@/components/QuestionnaireV2/builder/builderReducer";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import {
  QuestionnaireRead,
  QuestionnaireScope,
  scopeCreateFields,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";

import {
  SLUG_MAX_LENGTH,
  questionnaireBasicSchema,
} from "./questionnaireFormSchema";

const COPY_SUFFIX = "-copy";

/**
 * `{slug}-copy`, clamped so it still respects the shared slug length rule
 * even when the source slug is already near the SLUG_MAX_LENGTH ceiling —
 * truncates the base rather than the suffix so the result still reads as a
 * copy.
 */
function defaultCloneSlug(slug: string): string {
  const base = slug
    .slice(0, SLUG_MAX_LENGTH - COPY_SUFFIX.length)
    .replace(/-+$/, "");
  return `${base}${COPY_SUFFIX}`;
}

function defaultCloneTitle(title: string): string {
  return `${title} (Copy)`;
}

interface CloneFormValues {
  title: string;
  slug: string;
}

interface CloneQuestionnaireDialogProps {
  scope: QuestionnaireScope;
  questionnaire: QuestionnaireRead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloneQuestionnaireDialog({
  scope,
  questionnaire,
  open,
  onOpenChange,
}: CloneQuestionnaireDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const cloneSchema = questionnaireBasicSchema(t).pick({
    title: true,
    slug: true,
  });

  const form = useForm<CloneFormValues>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      title: defaultCloneTitle(questionnaire.title),
      slug: defaultCloneSlug(questionnaire.slug),
    },
  });

  // Re-seed the defaults every time the dialog opens — the form stays
  // mounted between opens, and the underlying questionnaire's title/slug
  // may have changed (e.g. the detail form was edited) since the last time.
  useEffect(() => {
    if (open) {
      form.reset({
        title: defaultCloneTitle(questionnaire.title),
        slug: defaultCloneSlug(questionnaire.slug),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, questionnaire.title, questionnaire.slug]);

  const { mutate: clone, isPending } = useMutation({
    mutationFn: mutate(questionnaireApi.createV2),
    onSuccess: (created: QuestionnaireRead) => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all });
      toast.success(t("questionnaire_cloned_successfully"));
      onOpenChange(false);
      navigate(`${scope.basePath}/${created.id}`);
    },
  });

  const onSubmit = (values: CloneFormValues) => {
    clone({
      title: values.title,
      slug: values.slug,
      description: questionnaire.description,
      version: questionnaire.version ? String(questionnaire.version) : "1.0",
      code: questionnaire.code,
      status: "draft",
      subject_type: questionnaire.subject_type,
      questions: regenerateQuestionIds(
        structuredClone(questionnaire.questions),
      ),
      ...scopeCreateFields(scope),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("clone_questionnaire")}</DialogTitle>
          <DialogDescription>
            {t("clone_questionnaire_draft_description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {t("clone_form")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
