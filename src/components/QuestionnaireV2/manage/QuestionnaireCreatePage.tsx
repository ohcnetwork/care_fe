import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { navigate, useNavigationPrompt } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
import { QuestionsEmptyState } from "@/components/QuestionnaireV2/shared/QuestionsEmptyState";
import { SegmentedRadioGroup } from "@/components/QuestionnaireV2/shared/SegmentedRadioGroup";
import { useCanWriteQuestionnaire } from "@/components/QuestionnaireV2/useCanWriteQuestionnaire";

import {
  QUESTIONNAIRE_STATUSES,
  QuestionnaireRead,
  QuestionnaireScope,
  SUBJECT_TYPES,
  SUBJECT_TYPES_FOR_CONTEXT,
  SubjectType,
  formatRevision,
  scopeCreateFields,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";
import { generateSlug } from "@/Utils/utils";

import { BasicInformationCard } from "./BasicInformationCard";
import {
  DetailFormValues,
  SLUG_MAX_LENGTH,
  questionnaireBasicSchema,
} from "./questionnaireFormSchema";

interface CreateFormValues extends DetailFormValues {
  subject_type: SubjectType;
}

export function QuestionnaireCreatePage({
  scope,
}: {
  scope: QuestionnaireScope;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { canWrite, isLoading: isPermissionLoading } =
    useCanWriteQuestionnaire(scope);

  const subjectTypeOptions = SUBJECT_TYPES_FOR_CONTEXT[scope.authContext];

  const createSchema = questionnaireBasicSchema(t).extend({
    subject_type: z.enum(SUBJECT_TYPES),
  });

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      status: "active",
      subject_type: subjectTypeOptions[0],
    },
  });

  const status = form.watch("status");
  const subjectType = form.watch("subject_type");

  // Auto-generate the slug from the title as the user types. This page only
  // ever creates a new questionnaire, so the effect can run unconditionally
  // (contrast with ObservationDefinitionForm, which guards this with
  // `isEditMode` since it also handles editing).
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "title") {
        form.setValue(
          "slug",
          generateSlug(value.title || "", SLUG_MAX_LENGTH),
          { shouldValidate: true },
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const { mutate: create, isPending } = useMutation({
    mutationFn: mutate(questionnaireApi.createV2),
    onSuccess: (created: QuestionnaireRead) => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.all });
      toast.success(t("questionnaire_created_successfully"));
      navigate(`${scope.basePath}/${created.id}`);
    },
  });

  // The sibling builder page guards unsaved edits the same way; `!isPending`
  // keeps the post-create navigate() in onSuccess from tripping the prompt.
  useNavigationPrompt(
    form.formState.isDirty && !isPending,
    t("unsaved_changes_warning"),
  );

  const onSubmit = (values: CreateFormValues) => {
    create({
      title: values.title,
      slug: values.slug,
      description: values.description,
      status: values.status,
      subject_type: values.subject_type,
      version: "1.0",
      questions: [],
      ...scopeCreateFields(scope),
    });
  };

  if (isPermissionLoading) {
    return <FormSkeleton rows={10} />;
  }

  // The whole page is a mutation surface — deep links without write access
  // get a denied state instead of a form whose submit can only 403.
  if (!canWrite) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("permission_denied")}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(scope.basePath)}>
          <ArrowLeft className="size-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="xs"
        onClick={() => navigate(scope.basePath)}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {t("create_questionnaire")}
              </h1>
              <Badge variant="outline" className="uppercase">
                {t(scope.authContext)}
              </Badge>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(scope.basePath)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                <Check className="mr-2 size-4" />
                {t("save_form")}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_280px] md:gap-6">
            <div className="space-y-4">
              <BasicInformationCard form={form} canWrite />

              {/* Matches the detail page's Questions container (plain
                  bordered section, not a nested Card-in-Card). */}
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("questions")}
                </h3>
                <QuestionsEmptyState
                  hint={t("add_your_first_question_hint")}
                  className="py-6"
                />
              </div>
            </div>

            <div className="h-fit space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("form_properties")}
              </h3>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">
                  {t("status")}
                </p>
                <SegmentedRadioGroup
                  value={status}
                  onChange={(value) =>
                    form.setValue("status", value, { shouldDirty: true })
                  }
                  options={QUESTIONNAIRE_STATUSES.map((value) => ({
                    value,
                    label: t(value),
                  }))}
                  aria-label={t("status")}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">
                  {t("subject_type")}
                </p>
                <SegmentedRadioGroup
                  value={subjectType}
                  onChange={(value) =>
                    form.setValue("subject_type", value, {
                      shouldDirty: true,
                    })
                  }
                  options={subjectTypeOptions.map((value) => ({
                    value,
                    label: t(value),
                  }))}
                  aria-label={t("subject_type")}
                />
              </div>

              <hr className="border-dashed" />

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">
                  {t("version")}
                </p>
                <Badge variant="secondary">{formatRevision()}</Badge>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
