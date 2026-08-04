import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { AddToTemplateDialog } from "@/components/Questionnaire/AddToTemplateDialog";
import { filterStructuredQuestionnaireSlugs } from "@/components/Questionnaire/data/StructuredFormData";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import type { QuestionnaireResponseTemplateReadSpec } from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";

/**
 * The `ResponseTemplates` module — `service_request` and
 * `medication_request` (`ServiceRequestQuestion.tsx`/
 * `MedicationRequestQuestion.tsx`) each carried a ~250-line forked copy of
 * this exact subsystem: the "add one item to a template" dialog's state,
 * its templates-search query, its two mutations, AND (see
 * `./applyTemplateItems.ts`) the "apply a whole template" fetch loop. They
 * had already drifted — `MedicationRequestQuestion.tsx`'s create-template
 * mutation wrote a `service_request` key into `template_data` (not a valid
 * `TemplateData` member — the real key is `activity_definition`) where
 * `ServiceRequestQuestion.tsx`'s own copy correctly wrote
 * `activity_definition`. This hook is the fix: EVERY `template_data` write
 * goes through the single `itemKey`-driven object builder below, so there
 * is exactly one place either consumer's key could ever drift again.
 *
 * CONTRACT for a second consumer (written for `medication_request` to adopt
 * without reading this file): call `useAddToTemplate` with `itemKey:
 * "medication_request"`, `itemType: "medication"`, a `toTemplateSpec` that
 * turns a `MedicationRequestCreate` into a `MedicationRequestTemplateSpec`
 * (the existing `buildMedicationForTemplate`), an `itemDisplayName`, and the
 * two i18n KEYS `medication_added_to_template`/
 * `template_created_with_medication`. Mount the returned `dialog` once;
 * call `openAddToTemplate(medication)` from wherever the row/form's own
 * "Add to template" affordance lives.
 */
export type ResponseTemplateItemKey =
  "activity_definition" | "medication_request";

export interface UseAddToTemplateOptions<TItem> {
  questionnaireSlug?: string;
  facilityId?: string;
  /** Which `TemplateData` array this type reads/writes. */
  itemKey: ResponseTemplateItemKey;
  /** `AddToTemplateDialog`'s existing discriminant (styling/icon only). */
  itemType: "medication" | "service_request";
  /** Row → the plain-data shape stored in a template
   *  (`ActivityDefinitionTemplateSpec` | `MedicationRequestTemplateSpec`). */
  toTemplateSpec: (item: TItem) => unknown;
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

/** `questionnaire` is a real filter only when the slug names an actual
 *  questionnaire — `"service_request"`/`"medication_request"` are the
 *  fixed pseudo-slugs used when either type is filled standalone, outside
 *  any real questionnaire, and a template created there must stay
 *  reusable across every questionnaire, not scoped to a slug that isn't
 *  one. Literal, not `filterStructuredQuestionnaireSlugs` (a different,
 *  broader check the TEMPLATES QUERY below uses instead) — both legacy
 *  create-template mutations already used exactly this literal pair. */
function isFixedPseudoQuestionnaireSlug(slug?: string): boolean {
  return slug === "service_request" || slug === "medication_request";
}

export function useAddToTemplate<TItem>({
  questionnaireSlug,
  facilityId,
  itemKey,
  itemType,
  toTemplateSpec,
  itemDisplayName,
  messages,
}: UseAddToTemplateOptions<TItem>): UseAddToTemplateResult<TItem> {
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
      "questionnaire_response_templates",
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
    queryClient.invalidateQueries({
      queryKey: ["questionnaire_response_templates", questionnaireSlug],
    });
    queryClient.invalidateQueries({
      queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
    });
  };

  const addToTemplateMutation = useMutation({
    mutationFn: (params: {
      template: QuestionnaireResponseTemplateReadSpec;
      item: TItem;
    }) => {
      const existing =
        (params.template.template_data?.[itemKey] as unknown[] | undefined) ??
        [];
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

  // THE FIX for the drift this module's own header doc names: BOTH default
  // arrays are always present, and the computed `[itemKey]` entry — which
  // always comes LAST, so it always wins the duplicate-key resolution —
  // is the only one ever filled in. A `medication_request` consumer
  // passing `itemKey: "medication_request"` gets
  // `{ activity_definition: [], medication_request: [theSpec] }`; this
  // type (`itemKey: "activity_definition"`) gets the mirror image. Neither
  // consumer can misname the OTHER type's key again, because neither ever
  // writes a literal key at all.
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
