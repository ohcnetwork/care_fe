import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Download, Eye } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
import { LabeledActionButton } from "@/components/QuestionnaireV2/shared/LabeledActionButton";
import { useCanWriteQuestionnaire } from "@/components/QuestionnaireV2/useCanWriteQuestionnaire";

import {
  QUESTIONNAIRE_STATUS_COLORS,
  QuestionnaireScope,
  formatRevision,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";

import { buildUpdateBody } from "@/components/QuestionnaireV2/shared/buildUpdateBody";
import { downloadQuestionnaireJson } from "@/components/QuestionnaireV2/shared/downloadQuestionnaireJson";
import { BasicInformationCard } from "./BasicInformationCard";
import { CloneQuestionnaireDialog } from "./CloneQuestionnaireDialog";
import { FormPropertiesSidebar } from "./FormPropertiesSidebar";
import { OrganizationsField } from "./OrganizationsField";
import {
  DetailFormValues,
  questionnaireBasicSchema,
} from "./questionnaireFormSchema";
import { QuestionOverviewList } from "./QuestionOverviewList";
import { useUpdateQuestionnaire } from "./useUpdateQuestionnaire";
import { VersionsTab } from "./VersionsTab";

/** Move (not swap): removes the element at `from` and reinserts it at `to`,
 *  so drag-and-drop across several rows shifts the in-between rows instead
 *  of exchanging the two endpoints. */
function moveElement<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function QuestionnaireDetailPage({
  scope,
  id,
}: {
  scope: QuestionnaireScope;
  id: string;
}) {
  const { t } = useTranslation();
  const [cloneOpen, setCloneOpen] = useState(false);
  // `?tab=versions` deep-links straight to the Versions tab — it's how the
  // revision page's Back button returns to the tab it was opened from.
  const [{ tab }] = useQueryParams();
  const { canWrite, isLoading: isPermissionLoading } =
    useCanWriteQuestionnaire(scope);

  const {
    data: questionnaire,
    isLoading,
    isError,
  } = useQuery({
    queryKey: questionnaireKeys.detail(id),
    queryFn: query(questionnaireApi.get, { pathParams: { id } }),
  });

  const detailSchema = useMemo(() => questionnaireBasicSchema(t), [t]);

  const form = useForm<DetailFormValues>({
    resolver: zodResolver(detailSchema),
    values: questionnaire
      ? {
          title: questionnaire.title,
          slug: questionnaire.slug,
          description: questionnaire.description ?? "",
          status: questionnaire.status,
        }
      : undefined,
    // Reordering questions saves through the same mutation and invalidates
    // questionnaireKeys.all, which refetches this detail query. Without
    // `keepDirtyValues`, the `values` binding above would reset every field
    // (including any unsaved, dirty title/slug/description/status edits) the
    // moment that refetch resolves.
    resetOptions: { keepDirtyValues: true },
  });

  // Owns the setQueryData-before-invalidate cache sequence and the success
  // toast (see the hook's doc comment).
  const { mutate: save, isPending } = useUpdateQuestionnaire(id);

  const onSubmit = (values: DetailFormValues) => {
    if (!questionnaire) return;
    save(
      buildUpdateBody(questionnaire, {
        title: values.title,
        slug: values.slug,
        description: values.description,
        status: values.status,
      }),
    );
  };

  // isPermissionLoading folds in so write affordances (Save Form, Edit
  // Questions, Clone…) don't pop in after the facility query resolves.
  if (isLoading || isPermissionLoading) {
    return <FormSkeleton rows={10} />;
  }

  if (isError || !questionnaire) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("no_data_found")}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(scope.basePath)}>
          <ArrowLeft className="mr-2 size-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  const tabTriggerClasses =
    "-mb-px h-auto rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-2 pt-0 text-gray-500 shadow-none data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none";

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue={tab === "versions" ? "versions" : "questions"}>
            {/* Sticky header band: back + breadcrumb, title row and the tab
                strip stay pinned while the body scrolls beneath, keeping the
                primary Save Form action reachable on long questionnaires. */}
            <div className="sticky top-0 z-20 -mx-4 space-y-3 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => navigate(scope.basePath)}
                >
                  <ArrowLeft className="size-4" />
                  {t("back")}
                </Button>
                <span aria-hidden className="h-6 w-px bg-gray-200" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => navigate(scope.basePath)}
                        className="cursor-pointer"
                      >
                        {t("questionnaire_other")}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{t(scope.authContext)}</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-gray-900">
                        {questionnaire.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {questionnaire.title}
                  </h1>
                  <Badge variant="outline" className="uppercase">
                    {t(scope.authContext)}
                  </Badge>
                  <Badge
                    variant={QUESTIONNAIRE_STATUS_COLORS[questionnaire.status]}
                  >
                    {t(questionnaire.status)}
                  </Badge>
                  <Badge variant="secondary">
                    {formatRevision(questionnaire.internal_revision)}
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
                  {canWrite && (
                    <Button type="submit" disabled={isPending}>
                      <Check className="mr-2 size-4" />
                      {t("save_form")}
                    </Button>
                  )}
                </div>
              </div>

              <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-gray-200 bg-transparent p-0">
                <TabsTrigger value="questions" className={tabTriggerClasses}>
                  {t("questions")}
                </TabsTrigger>
                <TabsTrigger value="versions" className={tabTriggerClasses}>
                  {t("versions")}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="questions" className="mt-4">
              <div className="grid gap-4 md:grid-cols-[1fr_280px] md:gap-6">
                <div className="space-y-4">
                  <BasicInformationCard form={form} canWrite={canWrite}>
                    <OrganizationsField
                      scope={scope}
                      questionnaireId={id}
                      canWrite={canWrite}
                    />
                  </BasicInformationCard>
                  <QuestionOverviewList
                    questions={questionnaire.questions}
                    isSaving={isPending}
                    canWrite={canWrite}
                    onReorder={(from, to) =>
                      save(
                        buildUpdateBody(questionnaire, {
                          questions: moveElement(
                            questionnaire.questions,
                            from,
                            to,
                          ),
                        }),
                      )
                    }
                    onEditQuestions={() =>
                      navigate(`${scope.basePath}/${id}/edit`)
                    }
                    onImportQuestions={() =>
                      navigate(`${scope.basePath}/${id}/edit?import=1`)
                    }
                  />
                </div>
                <FormPropertiesSidebar
                  questionnaire={questionnaire}
                  form={form}
                  canWrite={canWrite}
                >
                  <LabeledActionButton
                    label={t("check_how_form_looks")}
                    onClick={() =>
                      navigate(`${scope.basePath}/${id}/edit?mode=preview`)
                    }
                  >
                    <Eye className="size-4" />
                    {t("preview_form")}
                  </LabeledActionButton>
                  {canWrite && (
                    <LabeledActionButton
                      label={t("create_copy_of_form")}
                      onClick={() => setCloneOpen(true)}
                    >
                      <Copy className="size-4" />
                      {t("clone_form")}
                    </LabeledActionButton>
                  )}
                  <LabeledActionButton
                    label={t("download_the_form")}
                    onClick={() => downloadQuestionnaireJson(questionnaire)}
                  >
                    <Download className="size-4" />
                    {t("download_json")}
                  </LabeledActionButton>
                </FormPropertiesSidebar>
              </div>
            </TabsContent>
            <TabsContent value="versions" className="mt-4">
              <VersionsTab scope={scope} questionnaire={questionnaire} />
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      <CloneQuestionnaireDialog
        scope={scope}
        questionnaire={questionnaire}
        open={cloneOpen}
        onOpenChange={setCloneOpen}
      />
    </div>
  );
}
