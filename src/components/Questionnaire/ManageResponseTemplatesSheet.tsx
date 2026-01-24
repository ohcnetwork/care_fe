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

import { MedicationRequestCreate } from "@/types/emr/medicationRequest/medicationRequest";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  QuestionnaireResponseTemplateCreateSpec,
  QuestionnaireResponseTemplateReadSpec,
  ServiceRequestTemplateSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

// Check if a string looks like a product slug (starts with 'f-' prefix)
function isProductSlug(value: string | undefined): boolean {
  if (!value) return false;
  return value.startsWith("f-") && value.includes("-");
}

// Extract readable name from a product slug
// Slug format: f-{uuid}-{readable-part} -> extract last part and format
function extractNameFromSlug(slug: string | undefined): string | null {
  if (!slug || !isProductSlug(slug)) return null;
  // Match pattern: f-{uuid}-{name} where uuid is 36 chars
  const match = slug.match(/^f-[a-f0-9-]{36}-(.+)$/i);
  if (match) {
    // Convert slug part to readable: d5-09500-09ml -> D5 09500 09ML
    return match[1].replace(/-/g, " ").toUpperCase();
  }
  return null;
}

// Component to display medication name, fetching from product knowledge if needed
function MedicationName({
  medication,
  fallbackName,
}: {
  medication: MedicationRequestCreate & {
    display_name?: string;
    requested_product_internal?: { name?: string; slug?: string };
  };
  fallbackName: string;
}) {
  // Get name from internal object first (this is set when applying templates)
  const internalName = medication.requested_product_internal?.name;
  const internalSlug = medication.requested_product_internal?.slug;

  // Only fetch if we have a slug (not a UUID) and no other name source
  const canFetch =
    !!medication.requested_product &&
    isProductSlug(medication.requested_product) &&
    !medication.display_name &&
    !internalName &&
    !medication.medication?.display;

  const { data: productKnowledge, isLoading } = useQuery({
    queryKey: ["productKnowledge", medication.requested_product],
    queryFn: query(productKnowledgeApi.retrieveProductKnowledge, {
      pathParams: { slug: medication.requested_product! },
    }),
    enabled: canFetch,
    staleTime: Infinity, // Cache indefinitely since product names don't change
  });

  // Priority: display_name > internal name > product knowledge > medication.display > extract from slug > fallback
  const name =
    medication.display_name ||
    internalName ||
    productKnowledge?.name ||
    medication.medication?.display ||
    extractNameFromSlug(internalSlug) ||
    extractNameFromSlug(medication.requested_product) ||
    fallbackName;

  if (isLoading && canFetch) {
    return <span className="text-gray-400 animate-pulse">Loading...</span>;
  }

  return <>{name}</>;
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
  onServiceRequestSelect?: (serviceRequest: ServiceRequestTemplateSpec) => void;
  disabled?: boolean;
  /** Current medications to allow saving as template */
  currentMedications?: MedicationRequestCreate[];
  /** Current service requests to allow saving as template */
  currentServiceRequests?: ServiceRequestTemplateSpec[];
  key_filter: string;
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
  onServiceRequestSelect,
  disabled,
  currentMedications = [],
  currentServiceRequests = [],
  key_filter = "medication_request",
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

    // Prepare medications for template (use product ID, handle medication field properly)
    const medicationsForTemplate =
      isSavingCurrent && currentMedications.length > 0
        ? currentMedications.map((med) => {
            const medWithInternal = med as MedicationRequestCreate & {
              requested_product_internal?: {
                id?: string;
                slug?: string;
                name?: string;
                code?: { system: string; code: string; display: string };
              };
            };

            // Use product ID (UUID) for the template, not the slug
            // Fall back to med.requested_product which might already be a UUID
            const productId =
              medWithInternal.requested_product_internal?.id ||
              med.requested_product;

            // Get the slug for display name extraction if needed
            const productSlug =
              medWithInternal.requested_product_internal?.slug ||
              (isProductSlug(med.requested_product)
                ? med.requested_product
                : undefined);

            // If requested_product is present, don't include medication field
            // If no requested_product, we need medication with a valid code
            let medicationCode: typeof med.medication | undefined = undefined;
            if (!productId) {
              // No product ID - need medication code
              medicationCode = med.medication?.code
                ? med.medication
                : undefined;
            }

            // Get display name for the medication - ensure we always have a name
            const displayName =
              medWithInternal.requested_product_internal?.name ||
              med.medication?.display ||
              extractNameFromSlug(productSlug) ||
              "Medication";

            // Build template medication with display_name for UI rendering
            const templateMed = {
              ...med,
              requested_product: productId,
              // Set medication only if we don't have requested_product
              medication: productId ? undefined : medicationCode,
              // Store display name for template preview
              display_name: displayName,
            };

            // Remove internal objects that shouldn't be stored in templates
            delete (
              templateMed as MedicationRequestCreate & {
                requested_product_internal?: unknown;
              }
            ).requested_product_internal;
            delete (templateMed as MedicationRequestCreate & { id?: unknown })
              .id;

            return templateMed;
          })
        : [];

    // Prepare service requests for template
    const serviceRequestsForTemplate =
      isSavingCurrent && currentServiceRequests.length > 0
        ? currentServiceRequests
        : [];

    const createData: QuestionnaireResponseTemplateCreateSpec = {
      name: data.name,
      description: data.description || "",
      questionnaire: questionnaireSlug,
      facility: facilityId,
      template_data: {
        medication_request: medicationsForTemplate,
        service_request: serviceRequestsForTemplate,
      },
      users: [currentUser.username],
      facility_organizations: [],
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
    currentMedications.length > 0 || currentServiceRequests.length > 0;
  const totalItemsToSave =
    currentMedications.length + currentServiceRequests.length;

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
                template.template_data?.service_request ?? [];
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
                    <div className="flex items-center gap-1 shrink-0">
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
                          variant="ghost"
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
                            className="text-gray-400 hover:text-destructive size-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <div className="px-2 pb-2 ml-6 space-y-1.5 border-t border-gray-100 pt-2 animate-in slide-in-from-top-2 duration-200">
                      {/* Medications preview */}
                      {medicationCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                            <PillIcon className="size-3" />
                            {t("medications")}
                          </div>
                          <div className="space-y-0.5 pl-4">
                            {medications.slice(0, 5).map((med, idx) => {
                              const medWithExtra = med as typeof med & {
                                display_name?: string;
                              };

                              // Get dosage info - compact format
                              const dosage = med.dosage_instruction?.[0];
                              const doseQty =
                                dosage?.dose_and_rate?.dose_quantity;
                              const timing = dosage?.timing?.code?.display;
                              const duration =
                                dosage?.timing?.repeat?.bounds_duration;

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
                                  className="group/item flex items-center gap-1 text-sm py-0.5"
                                >
                                  <span className="size-1 rounded-full bg-blue-400 shrink-0" />
                                  <span className="text-gray-800 truncate flex-1">
                                    <MedicationName
                                      medication={medWithExtra}
                                      fallbackName={t("unknown_medication")}
                                    />
                                  </span>
                                  {dosageParts.length > 0 && (
                                    <span className="text-xs text-gray-400 shrink-0">
                                      ({dosageParts.join(" • ")})
                                    </span>
                                  )}
                                  {onMedicationSelect && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onMedicationSelect(
                                              med as MedicationRequestCreate,
                                            );
                                            toast.success(
                                              t("medication_added"),
                                            );
                                          }}
                                          className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded hover:bg-blue-100 text-blue-600"
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
                            {medicationCount > 5 && (
                              <p className="text-xs text-blue-500">
                                +{medicationCount - 5} {t("more")}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Service requests preview */}
                      {serviceRequestCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700">
                            <ClipboardListIcon className="size-3" />
                            {t("service_requests")}
                          </div>
                          <div className="space-y-0.5 pl-4">
                            {serviceRequests.slice(0, 5).map((sr, idx) => (
                              <div
                                key={idx}
                                className="group/item flex items-center gap-1 text-sm py-0.5"
                              >
                                <span className="size-1 rounded-full bg-purple-400 shrink-0" />
                                <span className="text-gray-800 truncate flex-1">
                                  {sr.service_request?.title ||
                                    sr.slug ||
                                    t("unknown_service_request")}
                                </span>
                                {onServiceRequestSelect && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onServiceRequestSelect(sr);
                                          toast.success(
                                            t("service_request_added"),
                                          );
                                        }}
                                        className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded hover:bg-purple-100 text-purple-600"
                                      >
                                        <PlusCircleIcon className="size-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      {t("add_this_service_request")}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            ))}
                            {serviceRequestCount > 5 && (
                              <p className="text-xs text-purple-500">
                                +{serviceRequestCount - 5} {t("more")}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
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

        {/* Preview of what will be saved - Medications */}
        {isSavingCurrent && currentMedications.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
              <PillIcon className="size-4" />
              {t("medications_to_include")}
            </div>
            <div className="space-y-2">
              {currentMedications.slice(0, 5).map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-blue-700 bg-white/60 rounded-md px-3 py-2"
                >
                  <CheckCircle2Icon className="size-3.5 text-blue-500" />
                  <span className="truncate">
                    {(
                      med as MedicationRequestCreate & {
                        requested_product_internal?: { name?: string };
                      }
                    ).requested_product_internal?.name ||
                      med.medication?.display ||
                      t("unknown_medication")}
                  </span>
                </div>
              ))}
              {currentMedications.length > 5 && (
                <p className="text-xs text-blue-600 pl-6">
                  {t("and_more_medications", {
                    count: currentMedications.length - 5,
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Preview of what will be saved - Service Requests */}
        {isSavingCurrent && currentServiceRequests.length > 0 && (
          <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
              <ClipboardListIcon className="size-4" />
              {t("service_requests_to_include")}
            </div>
            <div className="space-y-2">
              {currentServiceRequests.slice(0, 5).map((sr, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-purple-700 bg-white/60 rounded-md px-3 py-2"
                >
                  <CheckCircle2Icon className="size-3.5 text-purple-500" />
                  <span className="truncate">
                    {sr.service_request?.title || t("unknown_service_request")}
                  </span>
                </div>
              ))}
              {currentServiceRequests.length > 5 && (
                <p className="text-xs text-purple-600 pl-6">
                  {t("and_more_service_requests", {
                    count: currentServiceRequests.length - 5,
                  })}
                </p>
              )}
            </div>
          </div>
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
        <SheetContent className="sm:max-w-lg flex flex-col">
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
