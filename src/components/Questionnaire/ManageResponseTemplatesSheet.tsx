import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookmarkIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  Loader2,
  PillIcon,
  PlusCircleIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Loading from "@/components/Common/Loading";

import useAuthUser from "@/hooks/useAuthUser";

import {
  MedicationRequestCreate,
  MedicationRequestTemplateSpec,
} from "@/types/emr/medicationRequest/medicationRequest";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  ActivityDefinitionTemplateSpec,
  QuestionnaireResponseTemplateCreateSpec,
  QuestionnaireResponseTemplateReadSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { t } from "i18next";
import { buildMedicationForTemplate } from "./QuestionTypes/MedicationRequestQuestion";

// Component to display medication name, fetching from product knowledge if needed
function MedicationName({
  medication,
}: {
  medication: MedicationRequestTemplateSpec;
}) {
  const { data: productKnowledge, isLoading } = useQuery({
    queryKey: ["productKnowledge", medication.requested_product],
    queryFn: query(productKnowledgeApi.retrieveProductKnowledge, {
      pathParams: { slug: medication.requested_product! },
    }),
    enabled: !!medication.requested_product,
    meta: {
      persist: true,
    },
  });

  if (isLoading) {
    return <span className="text-gray-400 animate-pulse">Loading...</span>;
  }

  return (
    <>
      {medication.requested_product
        ? productKnowledge?.name
        : medication.medication?.display || t("unknown_medication")}
    </>
  );
}

/**
 * Reusable component for displaying a list of medications in previews
 */
function MedicationsPreview({
  medications,
  variant = "compact",
  onMedicationSelect,
  t,
}: {
  medications: MedicationRequestTemplateSpec[];
  variant?: "compact" | "form";
  onMedicationSelect?: (medication: MedicationRequestCreate) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const [showAll, setShowAll] = useState(false);

  if (medications.length === 0) return null;

  const isFormVariant = variant === "form";
  const displayLimit = 5;
  const displayedMeds = showAll
    ? medications
    : medications.slice(0, displayLimit);
  const remainingCount = medications.length - displayLimit;

  return (
    <div
      className={cn(
        "space-y-1",
        isFormVariant &&
          "rounded-lg border border-primary-200 bg-primary-50/50 p-4 space-y-3",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium text-primary-700",
          isFormVariant && "text-sm text-primary-800 gap-2",
        )}
      >
        <PillIcon className={isFormVariant ? "size-4" : "size-3"} />
        {isFormVariant ? t("medications_to_include") : t("medications")}
      </div>
      <div className={cn("space-y-0.5", isFormVariant ? "space-y-2" : "pl-4")}>
        {displayedMeds.map((med, idx) => {
          const medWithExtra = med as typeof med & { display_name?: string };

          if (isFormVariant) {
            return (
              <div
                key={idx}
                className="flex items-start gap-2 text-sm text-primary-700 bg-white/60 rounded-md px-3 py-2"
              >
                <CheckCircle2Icon className="size-3.5 text-primary-500 shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0">
                  {(
                    med as MedicationRequestTemplateSpec & {
                      requested_product_internal?: { name?: string };
                    }
                  ).requested_product_internal?.name ||
                    med.medication?.display ||
                    t("unknown_medication")}
                </span>
              </div>
            );
          }

          // Compact variant (for expanded template view)
          const dosage = med.dosage_instruction?.[0];
          const doseQty = dosage?.dose_and_rate?.dose_quantity;
          const timing = dosage?.timing?.code?.code;
          const duration = dosage?.timing?.repeat?.bounds_duration;

          const dosageParts = [
            doseQty?.value
              ? `${doseQty.value}${doseQty?.unit?.display ? ` ${doseQty.unit.display}` : ""}`
              : null,
            timing,
            duration?.value
              ? `${duration.value}${duration?.unit ? ` ${duration.unit}` : ""}`
              : null,
          ].filter(Boolean);

          return (
            <div
              key={idx}
              className="group/item flex items-start gap-1.5 text-sm py-0.5"
            >
              <span className="size-1 rounded-full bg-primary-400 shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <span className="text-gray-800">
                  <MedicationName medication={medWithExtra} />
                </span>
                {dosageParts.length > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({dosageParts.join(" • ")})
                  </span>
                )}
              </div>
              {onMedicationSelect && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMedicationSelect(med as MedicationRequestCreate);
                        toast.success(t("medication_added"));
                      }}
                      className="p-0.5 rounded hover:bg-primary-100 text-primary-600 shrink-0 mt-0.5"
                    >
                      <PlusCircleIcon className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {t("add_this_medication")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        })}
        {remainingCount > 0 && !showAll && (
          <Button
            variant="ghost"
            onClick={() => setShowAll(true)}
            className={cn(
              "text-xs text-primary-500 hover:text-primary-700 hover:underline cursor-pointer",
              isFormVariant && "pl-6",
            )}
          >
            {isFormVariant
              ? t("and_more_medications", { count: remainingCount })
              : `+${remainingCount} ${t("more")}`}
          </Button>
        )}
        {showAll && medications.length > displayLimit && (
          <Button
            variant="ghost"
            onClick={() => setShowAll(false)}
            className={cn(
              "text-xs text-primary-500 hover:text-primary-700 hover:underline cursor-pointer",
              isFormVariant && "pl-6",
            )}
          >
            {t("show_less")}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable component for displaying a list of activity definitions in previews
 */
function ActivityDefinitionsPreview({
  activityDefinitions,
  variant = "compact",
  onActivityDefinitionSelect,
  t,
}: {
  activityDefinitions: ActivityDefinitionTemplateSpec[];
  variant?: "compact" | "form";
  onActivityDefinitionSelect?: (
    activityDefinition: ActivityDefinitionTemplateSpec,
  ) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const [showAll, setShowAll] = useState(false);

  if (activityDefinitions.length === 0) return null;

  const isFormVariant = variant === "form";
  const displayLimit = 5;
  const displayedItems = showAll
    ? activityDefinitions
    : activityDefinitions.slice(0, displayLimit);
  const remainingCount = activityDefinitions.length - displayLimit;

  return (
    <div
      className={cn(
        "space-y-1",
        isFormVariant &&
          "rounded-lg border border-primary-200 bg-primary-50/50 p-4 space-y-3",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium text-primary-700",
          isFormVariant && "text-sm text-primary-800 gap-2",
        )}
      >
        <ClipboardListIcon className={isFormVariant ? "size-4" : "size-3"} />
        {isFormVariant
          ? t("activity_definitions_to_include")
          : t("activity_definitions")}
      </div>
      <div className={cn("space-y-0.5", isFormVariant ? "space-y-2" : "pl-4")}>
        {displayedItems.map((ad, idx) => {
          if (isFormVariant) {
            return (
              <div
                key={idx}
                className="flex items-start gap-2 text-sm text-primary-700 bg-white/60 rounded-md px-3 py-2"
              >
                <CheckCircle2Icon className="size-3.5 text-primary-500 shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0">
                  {ad.service_request?.title ||
                    t("unknown_activity_definition")}
                </span>
              </div>
            );
          }

          // Compact variant
          return (
            <div
              key={idx}
              className="group/item flex items-start gap-1.5 text-sm py-0.5"
            >
              <span className="size-1 rounded-full bg-primary-400 shrink-0 mt-1.5" />
              <span className="text-gray-800 flex-1 min-w-0">
                {ad.service_request?.title ||
                  ad.slug ||
                  t("unknown_activity_definition")}
              </span>
              {onActivityDefinitionSelect && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivityDefinitionSelect(ad);
                        toast.success(t("activity_definition_added"));
                      }}
                      className="p-0.5 rounded hover:bg-primary-100 text-primary-600 shrink-0 mt-0.5"
                    >
                      <PlusCircleIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {t("add_this_activity_definition")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        })}
        {remainingCount > 0 && !showAll && (
          <Button
            variant="ghost"
            onClick={() => setShowAll(true)}
            className={cn(
              "text-xs text-primary-500 hover:text-primary-700 hover:underline cursor-pointer",
              isFormVariant && "pl-6",
            )}
          >
            {isFormVariant
              ? t("and_more_activity_definitions", { count: remainingCount })
              : `+${remainingCount} ${t("more")}`}
          </Button>
        )}
        {showAll && activityDefinitions.length > displayLimit && (
          <Button
            variant="ghost"
            onClick={() => setShowAll(false)}
            className={cn(
              "text-xs text-primary-500 hover:text-primary-700 hover:underline cursor-pointer",
              isFormVariant && "pl-6",
            )}
          >
            {t("show_less")}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ManageResponseTemplatesSheetProps {
  questionnaireSlug: string;
  facilityId?: string;
  trigger?: React.ReactNode;
  /** Callback when a template is selected. Can be async - sheet will show loading state until resolved. */
  onTemplateSelect?: (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => void | Promise<void>;
  /** Callback when a single medication is selected from a template */
  onMedicationSelect?: (medication: MedicationRequestCreate) => void;
  /** Callback when a single service request is selected from a template */
  onActivityDefinitionSelect?: (
    activityDefinition: ActivityDefinitionTemplateSpec,
  ) => void;
  disabled?: boolean;
  /** Current medications to allow saving as template */
  currentMedications?: MedicationRequestCreate[];
  /** Current service requests to allow saving as template */
  currentActivityDefinitions?: ActivityDefinitionTemplateSpec[];
  key_filter: string;
  facilityOrganizations?: string[];
}

type ViewState = "list" | "create" | "save-current";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ManageResponseTemplatesSheet({
  questionnaireSlug,
  facilityId,
  trigger,
  onTemplateSelect,
  onMedicationSelect,
  onActivityDefinitionSelect,
  disabled,
  currentMedications = [],
  currentActivityDefinitions = [],
  key_filter = "medication_request",
  facilityOrganizations = [],
}: ManageResponseTemplatesSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthUser();
  const [open, setOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [templateToDelete, setTemplateToDelete] =
    useState<QuestionnaireResponseTemplateReadSpec | null>(null);
  const [recentlyApplied, setRecentlyApplied] = useState<string | null>(null);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(
    null,
  );
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    string[] | null
  >(facilityOrganizations.length > 0 ? facilityOrganizations : null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch templates list
  const { data: templatesResponse, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
    queryFn: query(questionnaireResponseTemplateApi.list, {
      queryParams: {
        ...(questionnaireSlug &&
        questionnaireSlug !== "medication_request" &&
        questionnaireSlug !== "service_request"
          ? { questionnaire: questionnaireSlug }
          : {}),
        limit: 50,
        facility: facilityId,
        key_filter: key_filter,
      },
    }),
    enabled: open && !!questionnaireSlug,
  });

  // Create mutation
  const { mutate: createTemplate, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireResponseTemplateApi.create),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      toast.success(t("template_created_successfully"));
      form.reset();
      setViewState("list");
    },
    onError: () => {
      toast.error(t("failed_to_create_template"));
    },
  });

  // Delete mutation
  const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) =>
      mutate(questionnaireResponseTemplateApi.delete, {
        pathParams: { id },
      })({}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      toast.success(t("template_deleted_successfully"));
      setTemplateToDelete(null);
    },
    onError: () => {
      toast.error(t("failed_to_delete_template"));
    },
  });

  const onSubmit = (data: FormData) => {
    const isSavingCurrent = viewState === "save-current";

    // Prepare medications for template using shared utility
    const medicationsForTemplate =
      isSavingCurrent && currentMedications.length > 0
        ? currentMedications.map(
            (med) =>
              buildMedicationForTemplate(med) as MedicationRequestTemplateSpec,
          )
        : [];

    // Prepare service requests for template
    const serviceRequestsForTemplate =
      isSavingCurrent && currentActivityDefinitions.length > 0
        ? currentActivityDefinitions
        : [];

    const createData: QuestionnaireResponseTemplateCreateSpec = {
      name: data.name,
      description: data.description || "",
      ...(questionnaireSlug &&
      questionnaireSlug !== "service_request" &&
      questionnaireSlug !== "medication_request"
        ? { questionnaire: questionnaireSlug }
        : {}),
      facility: facilityId,
      template_data: {
        medication_request: medicationsForTemplate,
        activity_definition: serviceRequestsForTemplate,
      },
      users: [currentUser.username],
      facility_organizations: selectedOrganizations ?? [],
    };
    createTemplate(createData);
  };

  const handleApplyTemplate = async (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    if (onTemplateSelect) {
      const templateId = template.id ?? null;
      setApplyingTemplateId(templateId);

      try {
        // Wait for the template to be applied (may be async)
        await onTemplateSelect(template);
        setRecentlyApplied(templateId);
        setApplyingTemplateId(null);
        // Clear the applied indicator after a moment, then close
        setTimeout(() => {
          setRecentlyApplied(null);
          setOpen(false);
        }, 800);
      } catch {
        // Error handling is done in the parent component
        setApplyingTemplateId(null);
      }
    }
  };

  const handleDeleteTemplate = (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    setTemplateToDelete(template);
  };

  const confirmDelete = () => {
    if (templateToDelete?.id) {
      deleteTemplate(templateToDelete.id);
    }
  };

  const templates = templatesResponse?.results ?? [];
  const hasItemsToSave =
    currentMedications.length > 0 || currentActivityDefinitions.length > 0;
  const totalItemsToSave =
    currentMedications.length + currentActivityDefinitions.length;

  const renderList = () => (
    <div className="space-y-3">
      {/* Compact Quick Actions - Side by Side */}
      <div className="flex gap-2">
        {hasItemsToSave && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 h-8 border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-100/50 text-xs"
            onClick={() => setViewState("save-current")}
          >
            <SaveIcon className="size-3.5 text-primary-600" />
            <span className="text-primary-700">{t("save_current")}</span>
            <Badge variant="primary" className="text-[10px] px-1 py-0 ml-1">
              {totalItemsToSave}
            </Badge>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 h-8 border-dashed text-xs",
            hasItemsToSave ? "flex-1" : "w-full",
          )}
          onClick={() => setViewState("create")}
        >
          <PlusIcon className="size-3.5" />
          {t("new_template")}
        </Button>
      </div>

      {/* Templates List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <BookmarkIcon className="size-3" />
            {t("saved_templates")}
          </h3>
          <span className="text-[10px] text-gray-400">
            {templates.length} {t("templates").toLowerCase()}
          </span>
        </div>

        {isLoadingTemplates ? (
          <Loading />
        ) : templates.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed rounded-lg bg-gray-50/50">
            <SparklesIcon className="size-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t("no_templates_yet")}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {templates.map((template) => {
              const medications =
                template.template_data?.medication_request ?? [];
              const serviceRequests =
                template.template_data?.activity_definition ?? [];
              const medicationCount = medications.length;
              const serviceRequestCount = serviceRequests.length;
              const isApplied = recentlyApplied === template.id;
              const isApplying = applyingTemplateId === template.id;
              const isExpanded = expandedTemplateId === template.id;
              const hasContent = medicationCount > 0 || serviceRequestCount > 0;

              return (
                <div
                  key={template.id}
                  className={cn(
                    "group relative border rounded-lg bg-white transition-all duration-200 overflow-hidden",
                    isApplied
                      ? "border-green-300 bg-green-50 ring-1 ring-green-200"
                      : isApplying
                        ? "border-primary-300 bg-primary-50/50 ring-1 ring-primary-200"
                        : isExpanded
                          ? "border-primary-200 shadow-sm"
                          : "hover:border-gray-300 hover:shadow-sm",
                  )}
                >
                  {/* Compact template header - clickable to expand */}
                  <div className="flex items-center gap-2 p-2">
                    {/* Expand toggle */}
                    {hasContent && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTemplateId(
                            isExpanded ? null : template.id!,
                          )
                        }
                        className="shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
                        aria-expanded={isExpanded}
                        aria-label={t("view_template_contents", {
                          name: template.name,
                        })}
                      >
                        <ChevronRightIcon
                          className={cn(
                            "size-4 text-gray-400 transition-transform duration-200",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </button>
                    )}
                    {!hasContent && <div className="w-6" />}

                    {/* Template info - click to expand */}
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() =>
                        hasContent &&
                        setExpandedTemplateId(isExpanded ? null : template.id!)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {template.name}
                        </h4>
                        {medicationCount > 0 && (
                          <Badge
                            variant="blue"
                            className="text-[10px] gap-0.5 px-1 py-0 shrink-0"
                          >
                            <PillIcon className="size-2.5" />
                            {medicationCount}
                          </Badge>
                        )}
                        {serviceRequestCount > 0 && (
                          <Badge
                            variant="purple"
                            className="text-[10px] gap-0.5 px-1 py-0 shrink-0"
                          >
                            <ClipboardListIcon className="size-2.5" />
                            {serviceRequestCount}
                          </Badge>
                        )}
                      </div>
                    </button>

                    {/* Action buttons - inline */}
                    <div className="flex items-center gap-4 shrink-0">
                      {isApplying && (
                        <span className="text-xs text-primary-600 flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" />
                        </span>
                      )}
                      {isApplied && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2Icon className="size-4" />
                        </span>
                      )}
                      {onTemplateSelect && !isApplied && !isApplying && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTemplate(template);
                          }}
                          className="h-7 px-2 text-xs hover:bg-primary-50 hover:text-primary-700"
                          disabled={!!applyingTemplateId || !hasContent}
                        >
                          {t("apply")}
                        </Button>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template);
                            }}
                            disabled={!!applyingTemplateId}
                            aria-label={t("delete_template")}
                          >
                            <Trash2Icon className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("delete")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Expanded content - shows template items */}
                  {isExpanded && hasContent && (
                    <div className="px-2 pb-2 ml-6 space-y-1.5 border-t border-gray-100 pt-2">
                      <MedicationsPreview
                        medications={medications}
                        variant="compact"
                        onMedicationSelect={onMedicationSelect}
                        t={t}
                      />
                      <ActivityDefinitionsPreview
                        activityDefinitions={serviceRequests}
                        variant="compact"
                        onActivityDefinitionSelect={onActivityDefinitionSelect}
                        t={t}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderForm = () => {
    const isSavingCurrent = viewState === "save-current";

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              form.reset();
              setViewState("list");
            }}
            className="size-8"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isSavingCurrent ? t("save_as_template") : t("create_template")}
            </h3>
            <p className="text-sm text-gray-500">
              {isSavingCurrent
                ? t("save_current_items_as_template")
                : t("create_empty_template_description")}
            </p>
          </div>
        </div>

        {/* Preview of what will be saved */}
        {isSavingCurrent && (
          <>
            <MedicationsPreview
              medications={
                currentMedications as unknown as MedicationRequestTemplateSpec[]
              }
              variant="form"
              t={t}
            />
            <ActivityDefinitionsPreview
              activityDefinitions={currentActivityDefinitions}
              variant="form"
              t={t}
            />
          </>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("template_name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enter_template_name_placeholder")}
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormDescription>{t("template_name_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("description")} ({t("optional")})
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("enter_template_description")}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("template_description_help")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {facilityId && (
              <div className="space-y-2">
                <FacilityOrganizationSelector
                  facilityId={facilityId}
                  value={selectedOrganizations}
                  onChange={setSelectedOrganizations}
                  optional
                />
                <p className="text-xs text-muted-foreground">
                  {t("select_departments_to_share_template")}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setViewState("list");
                }}
                disabled={isCreating}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  <>
                    {isSavingCurrent ? (
                      <SaveIcon className="size-4 mr-2" />
                    ) : (
                      <PlusIcon className="size-4 mr-2" />
                    )}
                    {isSavingCurrent
                      ? t("save_template")
                      : t("create_template")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
      <BookmarkIcon className="size-4" />
      {t("templates")}
      {hasItemsToSave && (
        <Badge variant="primary" className="text-xs px-1.5 py-0">
          {totalItemsToSave}
        </Badge>
      )}
    </Button>
  );

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            // Reset state when closing
            setViewState("list");
            setRecentlyApplied(null);
            form.reset();
          }
        }}
      >
        <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
        <SheetContent className="sm:max-w-lg flex flex-col overflow-y-auto">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-primary-100 p-1.5">
                <BookmarkIcon className="size-4 text-primary-700" />
              </div>
              {viewState === "list"
                ? onTemplateSelect
                  ? t("prescription_templates")
                  : t("manage_templates")
                : viewState === "save-current"
                  ? t("save_as_template")
                  : t("create_template")}
            </SheetTitle>
            {viewState === "list" && (
              <SheetDescription>
                {onTemplateSelect
                  ? t("templates_quick_fill_description")
                  : t("manage_templates_description")}
              </SheetDescription>
            )}
          </SheetHeader>
          <ScrollArea className="flex-1 mt-6 -mx-6 px-6">
            {viewState === "list" ? renderList() : renderForm()}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_template")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_template_confirmation", {
                name: templateToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
