import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Download, Eye } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

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

import { LabeledActionButton } from "@/components/QuestionnaireV2/shared/LabeledActionButton";

import {
  QUESTIONNAIRE_STATUS_COLORS,
  QuestionStatus,
  QuestionnaireRead,
  QuestionnaireScope,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { swapElements } from "@/Utils/request/utils";

import { BasicInformationCard } from "./BasicInformationCard";
import { buildUpdateBody } from "./buildUpdateBody";
import { CloneQuestionnaireDialog } from "./CloneQuestionnaireDialog";
import { FormPropertiesSidebar } from "./FormPropertiesSidebar";
import { OrganizationsField } from "./OrganizationsField";
import { QuestionOverviewList } from "./QuestionOverviewList";
import { VersionsTab } from "./VersionsTab";

/**
 * Serializes the fetched questionnaire exactly like the v1 editor's export
 * (data-URI + a programmatic `<a download>` click) so downloaded files stay
 * compatible with the import flow on either version.
 */
function downloadQuestionnaireJson(questionnaire: QuestionnaireRead) {
  const dataStr = JSON.stringify(questionnaire, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", `${questionnaire.slug}.json`);
  linkElement.click();
}

export interface DetailFormValues {
  title: string;
  slug: string;
  description: string;
  status: QuestionStatus;
}

export function QuestionnaireDetailPage({
  scope,
  id,
}: {
  scope: QuestionnaireScope;
  id: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [cloneOpen, setCloneOpen] = useState(false);

  const {
    data: questionnaire,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["questionnairesV2", "detail", id],
    queryFn: query(questionnaireApi.get, { pathParams: { id } }),
  });

  const detailSchema = z.object({
    title: z.string().min(1, t("field_required")),
    slug: z
      .string()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 }))
      .regex(/^[-\w]+$/, t("slug_format_message")),
    description: z.string(),
    status: z.enum(["active", "draft", "retired"]),
  });

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
    // ["questionnairesV2"], which refetches this detail query. Without
    // `keepDirtyValues`, the `values` binding above would reset every field
    // (including any unsaved, dirty title/slug/description/status edits) the
    // moment that refetch resolves.
    resetOptions: { keepDirtyValues: true },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: mutate(questionnaireApi.update, { pathParams: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnairesV2"] });
      toast.success(t("questionnaire_updated_successfully"));
    },
  });

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

  if (isLoading) {
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

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => navigate(scope.basePath)}
              className="cursor-pointer"
            >
              {t("questionnaires")}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              {/* eslint-disable-next-line i18next/no-literal-string -- version notation ("v1"), not translatable prose */}
              <Badge variant="secondary">
                v{questionnaire.internal_revision ?? 1}
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

          <Tabs defaultValue="questions">
            <TabsList>
              <TabsTrigger value="questions">{t("questions")}</TabsTrigger>
              <TabsTrigger value="versions">{t("versions")}</TabsTrigger>
            </TabsList>
            <TabsContent value="questions" className="mt-4">
              <div className="grid gap-4 md:grid-cols-[1fr_280px] md:gap-6">
                <div className="space-y-4">
                  <BasicInformationCard form={form} />
                  <OrganizationsField scope={scope} questionnaireId={id} />
                  <QuestionOverviewList
                    questions={questionnaire.questions}
                    isSaving={isPending}
                    onReorder={(from, to) =>
                      save(
                        buildUpdateBody(questionnaire, {
                          questions: swapElements(
                            [...questionnaire.questions],
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
                  scope={scope}
                  questionnaire={questionnaire}
                  form={form}
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
                  <LabeledActionButton
                    label={t("create_copy_of_form")}
                    onClick={() => setCloneOpen(true)}
                  >
                    <Copy className="size-4" />
                    {t("clone_form")}
                  </LabeledActionButton>
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
