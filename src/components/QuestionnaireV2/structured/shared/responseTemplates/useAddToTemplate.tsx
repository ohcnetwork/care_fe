import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { AddToTemplateDialog } from "@/components/Questionnaire/AddToTemplateDialog";
import { filterStructuredQuestionnaireSlugs } from "@/components/Questionnaire/data/StructuredFormData";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import type { MedicationRequestTemplateSpec } from "@/types/emr/medicationRequest/medicationRequest";
import type {
  ActivityDefinitionTemplateSpec,
  QuestionnaireResponseTemplateReadSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";

/**
 * Shared "add one item to a response template" subsystem for service requests
 * and medication requests. Every `template_data` write derives its key from
 * `itemKey`; consumers provide row-to-template conversion, display copy, and
 * toast i18n keys.
 */
export type ResponseTemplateItemKey =
  "activity_definition" | "medication_request";

/** What a template stores per item — `TemplateData`'s two structured
 *  members' element types. */
export type ResponseTemplateSpec =
  ActivityDefinitionTemplateSpec | MedicationRequestTemplateSpec;

export interface UseAddToTemplateOptions<
  TItem,
  TSpec extends ResponseTemplateSpec = ResponseTemplateSpec,
> {
  questionnaireSlug?: string;
  facilityId?: string;
  /** Which `TemplateData` array this type reads/writes. */
  itemKey: ResponseTemplateItemKey;
  /** `AddToTemplateDialog`'s existing discriminant (styling/icon only). */
  itemType: "medication" | "service_request";
  /** Row → the plain-data shape stored in a template. */
  toTemplateSpec: (item: TItem) => TSpec;
  /** Row → the dialog's item-preview display name. */
  itemDisplayName: (item: TItem) => string;
  /** Pre-existing i18n KEYS (not translated strings) — each interpolated
   *  with `{ template: <name> }`. */
  messages: {
    addedToTemplate: string;
    createdWithItem: string;
  };
}

export interface UseAddToTemplateResult<TItem> {
  /** Mount ONCE, anywhere in the editor's tree. */
  dialog: ReactNode;
  /** The row/form-level "Add to template" trigger. */
  openAddToTemplate: (item: TItem) => void;
}

/**
 * Every cached template list a write here must refresh. The two spellings are
 * NOT redundant: the first is this hook's own list query, the second belongs
 * to the legacy `ManageResponseTemplatesSheet`, which the structured editors
 * still open — dropping it leaves that sheet showing pre-write data.
 */
const RESPONSE_TEMPLATE_LIST_KEYS = [
  "questionnaire_response_templates",
  "questionnaireResponseTemplates",
] as const;

/** `questionnaire` is a real filter only when the slug names an actual
 *  questionnaire. The fixed pseudo-slugs below mean the type is filled
 *  standalone, so created templates must stay reusable across questionnaires.
 *  This literal check is narrower than `filterStructuredQuestionnaireSlugs`. */
function isFixedPseudoQuestionnaireSlug(slug?: string): boolean {
  return slug === "service_request" || slug === "medication_request";
}

export function useAddToTemplate<
  TItem,
  TSpec extends ResponseTemplateSpec = ResponseTemplateSpec,
>({
  questionnaireSlug,
  facilityId,
  itemKey,
  itemType,
  toTemplateSpec,
  itemDisplayName,
  messages,
}: UseAddToTemplateOptions<TItem, TSpec>): UseAddToTemplateResult<TItem> {
  const { t } = useTranslation();
  const currentUser = useAuthUser();
  const queryClient = useQueryClient();

  const [item, setItem] = useState<TItem | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    string[] | null
  >(null);

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: [
      RESPONSE_TEMPLATE_LIST_KEYS[0],
      questionnaireSlug,
      templateSearchQuery,
    ],
    queryFn: query.debounced(questionnaireResponseTemplateApi.list, {
      queryParams: {
        questionnaire: filterStructuredQuestionnaireSlugs(questionnaireSlug),
        name: templateSearchQuery || undefined,
        facility: facilityId,
        limit: 20,
      },
    }),
    enabled: !!questionnaireSlug && !!item,
  });

  const reset = () => {
    setItem(null);
    setTemplateSearchQuery("");
    setIsCreatingNewTemplate(false);
    setNewTemplateName("");
    setSelectedOrganizations(null);
  };

  const invalidate = () => {
    for (const key of RESPONSE_TEMPLATE_LIST_KEYS) {
      queryClient.invalidateQueries({ queryKey: [key, questionnaireSlug] });
    }
  };

  const addToTemplateMutation = useMutation({
    mutationFn: (params: {
      template: QuestionnaireResponseTemplateReadSpec;
      item: TItem;
    }) => {
      const existing: readonly ResponseTemplateSpec[] =
        params.template.template_data?.[itemKey] ?? [];
      return mutate(questionnaireResponseTemplateApi.update, {
        pathParams: { id: params.template.id! },
      })({
        name: params.template.name,
        description: params.template.description || "",
        template_data: {
          ...params.template.template_data,
          [itemKey]: [...existing, toTemplateSpec(params.item)],
        },
        users: [currentUser.username],
        facility_organizations: selectedOrganizations || [],
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        t(messages.addedToTemplate, { template: variables.template.name }),
      );
      invalidate();
      reset();
    },
    onError: () => toast.error(t("failed_to_add_to_template")),
  });

  // Both default arrays are always present, and the computed `[itemKey]`
  // entry — always LAST, so it wins duplicate-key resolution — is the only
  // one ever filled in. Neither consumer ever writes a literal key, so
  // neither can misname the other type's key.
  const createTemplateMutation = useMutation({
    mutationFn: (params: { name: string; item: TItem }) =>
      mutate(questionnaireResponseTemplateApi.create)({
        name: params.name,
        description: "",
        ...(questionnaireSlug &&
        !isFixedPseudoQuestionnaireSlug(questionnaireSlug)
          ? { questionnaire: questionnaireSlug }
          : {}),
        facility: facilityId,
        template_data: {
          medication_request: [],
          activity_definition: [],
          [itemKey]: [toTemplateSpec(params.item)],
        },
        users: [currentUser.username],
        facility_organizations: selectedOrganizations || [],
      }),
    onSuccess: (_, variables) => {
      toast.success(t(messages.createdWithItem, { template: variables.name }));
      invalidate();
      reset();
    },
    onError: () => toast.error(t("failed_to_create_template")),
  });

  const openAddToTemplate = (nextItem: TItem) => {
    setItem(nextItem);
    setIsCreatingNewTemplate(false);
    setNewTemplateName("");
  };

  const dialog = (
    <AddToTemplateDialog<TItem>
      open={!!item}
      onOpenChange={(open) => {
        if (!open) reset();
      }}
      item={item}
      itemDisplayName={itemDisplayName}
      itemType={itemType}
      isCreatingNewTemplate={isCreatingNewTemplate}
      setIsCreatingNewTemplate={setIsCreatingNewTemplate}
      newTemplateName={newTemplateName}
      setNewTemplateName={setNewTemplateName}
      templateSearchQuery={templateSearchQuery}
      setTemplateSearchQuery={setTemplateSearchQuery}
      templatesData={templatesData}
      isLoadingTemplates={isLoadingTemplates}
      onCreateNewTemplate={() => {
        if (!item || !newTemplateName.trim()) return;
        createTemplateMutation.mutate({ name: newTemplateName.trim(), item });
      }}
      onSelectTemplate={(template) => {
        if (!item) return;
        addToTemplateMutation.mutate({ template, item });
      }}
      isCreating={createTemplateMutation.isPending}
      isAdding={addToTemplateMutation.isPending}
      facilityId={facilityId}
      selectedOrganizations={selectedOrganizations}
      onSelectedOrganizationsChange={setSelectedOrganizations}
    />
  );

  return { dialog, openAddToTemplate };
}
