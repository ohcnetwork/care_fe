import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ListChecks } from "lucide-react";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { SegmentedRadioGroup } from "@/components/QuestionnaireV2/shared/SegmentedRadioGroup";
import { useCanWriteQuestionnaire } from "@/components/QuestionnaireV2/useCanWriteQuestionnaire";

import {
  QuestionStatus,
  QuestionnaireRead,
  QuestionnaireScope,
  SUBJECT_TYPES_FOR_CONTEXT,
  SubjectType,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";
import { generateSlug } from "@/Utils/utils";

const STATUS_OPTIONS: QuestionStatus[] = ["active", "draft", "retired"];

interface CreateFormValues {
  title: string;
  slug: string;
  description: string;
  status: QuestionStatus;
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

  const createSchema = z.object({
    title: z.string().min(1, t("field_required")),
    slug: z
      .string()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 }))
      .regex(/^[-\w]+$/, t("slug_format_message")),
    description: z.string(),
    status: z.enum(["active", "draft", "retired"]),
    subject_type: z.enum([
      "patient",
      "encounter",
      "location",
      "device",
      "facility",
    ]),
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
        form.setValue("slug", generateSlug(value.title || "", 25), {
          shouldValidate: true,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const { mutate: create, isPending } = useMutation({
    mutationFn: mutate(questionnaireApi.createV2),
    onSuccess: (created: QuestionnaireRead) => {
      queryClient.invalidateQueries({ queryKey: ["questionnairesV2"] });
      toast.success(t("questionnaire_created_successfully"));
      navigate(`${scope.basePath}/${created.id}`);
    },
  });

  const onSubmit = (values: CreateFormValues) => {
    create({
      title: values.title,
      slug: values.slug,
      description: values.description,
      status: values.status,
      subject_type: values.subject_type,
      version: "1.0",
      questions: [],
      auth_context: scope.authContext,
      facility:
        scope.authContext === "facility" || scope.authContext === "user"
          ? scope.facilityId
          : undefined,
      facility_organization:
        scope.authContext === "facility_organization"
          ? scope.facilityOrganizationId
          : undefined,
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
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle>{t("basic_information")}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{t("title")}</Badge>
                    <Badge variant="secondary">{t("slug")}</Badge>
                    <Badge variant="secondary">{t("description")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        <FormDescription className="italic">
                          {t("slug_format_message")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("description")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[80px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("questions")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                      <ListChecks className="size-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {t("no_questions_added_yet")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("add_your_first_question_hint")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-4">
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
                  options={STATUS_OPTIONS.map((value) => ({
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
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
