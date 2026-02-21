import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookmarkIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeft,
  ClipboardListIcon,
  Edit,
  Loader2Icon,
  PillIcon,
  PlusIcon,
  SaveIcon,
  Search,
  Trash2Icon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import {
  formatDosage,
  formatDuration,
  formatFrequency,
} from "@/components/Medicine/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

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
  QuestionnaireResponseTemplateRetrieveSpec,
  QuestionnaireResponseTemplateUpdateSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";

import { t } from "i18next";
import { buildMedicationForTemplate } from "./QuestionTypes/MedicationRequestQuestion";

function MedicationName({
  medication,
}: {
  medication: MedicationRequestTemplateSpec;
}) {
  const { t } = useTranslation();
  const { data: productKnowledge, isLoading } = useQuery({
    queryKey: ["productKnowledge", medication.requested_product],
    queryFn: query(productKnowledgeApi.retrieveProductKnowledge, {
      pathParams: { slug: medication.requested_product! },
    }),
    enabled: !!medication.requested_product,
    meta: { persist: true },
  });

  if (isLoading) {
    return (
      <span className="animate-pulse text-gray-400">{t("loading")}...</span>
    );
  }

  return (
    <span>
      {medication.requested_product
        ? productKnowledge?.name
        : medication.medication?.display || t("unknown_medication")}
    </span>
  );
}

interface MedicationsPreviewProps {
  medications: (
    | MedicationRequestTemplateSpec
    | (MedicationRequestCreate & {
        requested_product_internal?: { name?: string };
      })
  )[];
  onMedicationSelect?: (medication: MedicationRequestCreate) => void;
  onMedicationRemove?: (index: number) => void;
  showAddButton?: boolean;
  variant?: "compact" | "form";
}

function MedicationsPreview({
  medications,
  onMedicationSelect,
  onMedicationRemove,
  showAddButton = false,
  variant = "compact",
}: MedicationsPreviewProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (medications.length === 0) return null;

  const isFormVariant = variant === "form";
  const displayLimit = 5;
  const displayedMeds = expanded
    ? medications
    : medications.slice(0, displayLimit);
  const remainingCount = medications.length - displayLimit;

  return (
    <div
      className={cn(
        "border rounded-md bg-primary-50/30 overflow-hidden",
        isFormVariant
          ? "border-primary-200"
          : "border-primary-200 rounded-t-none",
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-primary-100/50 border-b border-primary-200">
        <PillIcon className="size-3 text-primary-700" />
        <span className="text-xs font-semibold text-primary-900">
          {isFormVariant ? t("medications_to_include") : t("medications")}
        </span>
        <Badge variant="secondary" className="ml-auto text-xs px-1 py-0 h-4">
          {medications.length}
        </Badge>
      </div>
      <div className="p-1 space-y-0.5">
        {displayedMeds.map((med, idx) => {
          if (isFormVariant) {
            const medWithInternal = med as MedicationRequestCreate & {
              requested_product_internal?: { name?: string };
            };
            const hasInternalName =
              medWithInternal.requested_product_internal?.name ||
              med.medication?.display;

            return (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-primary-700 bg-white/60 rounded px-2 py-1.5"
              >
                <span className="size-1 rounded-full bg-primary-500 shrink-0" />
                <span className="flex-1 min-w-0">
                  {hasInternalName ? (
                    medWithInternal.requested_product_internal?.name ||
                    med.medication?.display
                  ) : (
                    <MedicationName medication={med} />
                  )}
                </span>
                {onMedicationRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onMedicationRemove(idx)}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            );
          }

          const instruction = med.dosage_instruction?.[0];

          const dosageInfo = [
            formatDosage(instruction),
            formatFrequency(instruction),
            formatDuration(instruction),
          ]
            .filter(Boolean)
            .join(" • ");

          return (
            <Button
              key={idx}
              variant="ghost"
              onClick={() => {
                if (showAddButton && onMedicationSelect) {
                  onMedicationSelect(med as MedicationRequestCreate);
                  toast.success(t("medication_added"));
                }
              }}
              disabled={!showAddButton || !onMedicationSelect}
              className={cn(
                "w-full h-auto justify-between items-start gap-2 rounded px-2 py-1.5 font-normal transition-colors whitespace-pre-wrap",
                showAddButton && onMedicationSelect
                  ? "cursor-pointer hover:bg-primary-100/50 active:bg-primary-50"
                  : "cursor-default bg-white/50",
              )}
            >
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-gray-900 text-xs leading-tight">
                  <MedicationName medication={med} />
                </div>
                {dosageInfo && (
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                    {dosageInfo}
                  </div>
                )}
              </div>
              {showAddButton && onMedicationSelect && (
                <PlusIcon className="size-3.5 shrink-0 text-primary-600 mt-0.5" />
              )}
            </Button>
          );
        })}
        {remainingCount > 0 && (
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full h-auto py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-transparent"
          >
            {expanded ? t("show_less") : `+${remainingCount} ${t("more")}`}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ActivityDefinitionsPreviewProps {
  activityDefinitions: ActivityDefinitionTemplateSpec[];
  onActivityDefinitionSelect?: (
    activityDefinition: ActivityDefinitionTemplateSpec,
  ) => void;
  onActivityDefinitionRemove?: (index: number) => void;
  showAddButton?: boolean;
  variant?: "compact" | "form";
}

function ActivityDefinitionsPreview({
  activityDefinitions,
  onActivityDefinitionSelect,
  onActivityDefinitionRemove,
  showAddButton = false,
  variant = "compact",
}: ActivityDefinitionsPreviewProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (activityDefinitions.length === 0) return null;

  const isFormVariant = variant === "form";
  const displayLimit = 5;
  const displayedItems = expanded
    ? activityDefinitions
    : activityDefinitions.slice(0, displayLimit);
  const remainingCount = activityDefinitions.length - displayLimit;

  return (
    <div
      className={cn(
        "border rounded-md bg-purple-50/30 overflow-hidden",
        isFormVariant
          ? "border-purple-200"
          : "border-purple-200 rounded-t-none",
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-purple-100/50 border-b border-purple-200">
        <ClipboardListIcon className="size-3 text-purple-700" />
        <span className="text-xs font-semibold text-purple-900">
          {isFormVariant
            ? t("activity_definitions_to_include")
            : t("activity_definitions")}
        </span>
        <Badge variant="secondary" className="ml-auto text-xs px-1 py-0 h-4">
          {activityDefinitions.length}
        </Badge>
      </div>
      <div className="p-1 space-y-0.5">
        {displayedItems.map((ad, idx) => {
          if (isFormVariant) {
            return (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-purple-700 bg-white/60 rounded px-2 py-1.5"
              >
                <span className="size-1 rounded-full bg-purple-500 shrink-0" />
                <span className="flex-1 min-w-0 font-medium text-gray-900">
                  {ad.service_request?.title ||
                    ad.slug ||
                    t("unknown_activity_definition")}
                </span>
                {onActivityDefinitionRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onActivityDefinitionRemove(idx)}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            );
          }

          return (
            <Button
              key={idx}
              variant="ghost"
              onClick={() => {
                if (showAddButton && onActivityDefinitionSelect) {
                  onActivityDefinitionSelect(ad);
                  toast.success(t("activity_definition_added"));
                }
              }}
              disabled={!showAddButton || !onActivityDefinitionSelect}
              className={cn(
                "w-full h-auto justify-between items-start gap-2 rounded px-2 py-1.5 font-normal transition-colors",
                showAddButton && onActivityDefinitionSelect
                  ? "cursor-pointer hover:bg-purple-100/50 active:bg-purple-50"
                  : "cursor-default bg-white/50",
              )}
            >
              <div className="flex-1 min-w-0 text-left font-medium text-gray-900 text-xs leading-tight">
                {ad.service_request?.title ||
                  ad.slug ||
                  t("unknown_activity_definition")}
              </div>
              {showAddButton && onActivityDefinitionSelect && (
                <PlusIcon className="size-3.5 shrink-0 text-purple-600 mt-0.5" />
              )}
            </Button>
          );
        })}
        {remainingCount > 0 && (
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full h-auto py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-transparent"
          >
            {expanded ? t("show_less") : `+${remainingCount} ${t("more")}`}
          </Button>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template:
    | QuestionnaireResponseTemplateReadSpec
    | QuestionnaireResponseTemplateRetrieveSpec;
  onApply?: (template: QuestionnaireResponseTemplateReadSpec) => void;
  onEdit: (template: QuestionnaireResponseTemplateReadSpec) => void;
  onDelete: (template: QuestionnaireResponseTemplateReadSpec) => void;
  onMedicationSelect?: (medication: MedicationRequestCreate) => void;
  onActivityDefinitionSelect?: (
    activityDefinition: ActivityDefinitionTemplateSpec,
  ) => void;
  isApplying?: boolean;
  isApplied?: boolean;
  disabled?: boolean;
}

function TemplateCard({
  template,
  onApply,
  onEdit,
  onDelete,
  onMedicationSelect,
  onActivityDefinitionSelect,
  isApplying,
  isApplied,
  disabled,
}: TemplateCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const medications = template.template_data?.medication_request ?? [];
  const activityDefinitions = template.template_data?.activity_definition ?? [];
  const medicationCount = medications.length;
  const activityDefinitionCount = activityDefinitions.length;
  const hasContent = medicationCount > 0 || activityDefinitionCount > 0;

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      disabled={!hasContent}
      className={cn(
        "border rounded-lg transition-all overflow-hidden",
        isApplied && "border-green-500 bg-green-50/50",
        isApplying && "border-primary-500 bg-primary-50/50",
        !isApplied && !isApplying && "border-gray-200 hover:border-gray-300",
        expanded && "shadow-sm",
      )}
    >
      {/* Header - clickable to expand */}
      <CollapsibleTrigger
        className={cn(
          "w-full flex items-start gap-2 p-2 transition-colors select-none",
          hasContent && "hover:bg-gray-50/50 cursor-pointer",
        )}
        asChild
      >
        <div>
          {hasContent && (
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 text-gray-400 transition-transform mt-0.5",
                expanded && "rotate-180",
              )}
            />
          )}
          {!hasContent && <div className="w-4" />}

          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
              {template.name}
            </h4>
            {template.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {template.description}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              {medicationCount > 0 && (
                <Badge variant="green" className="gap-1 text-xs px-1 py-0 h-4">
                  <PillIcon className="size-2.5" />
                  {medicationCount}
                </Badge>
              )}
              {activityDefinitionCount > 0 && (
                <Badge
                  variant="purple"
                  className="gap-0.5 text-xs px-1 py-0 h-4"
                >
                  <ClipboardListIcon className="size-2.5" />
                  {activityDefinitionCount}
                </Badge>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isApplying && (
              <Loader2Icon className="size-4 animate-spin text-primary-600" />
            )}
            {isApplied && (
              <CheckCircle2Icon className="size-4 text-green-600" />
            )}
            {onApply && !isApplied && !isApplying && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApply(template)}
                disabled={disabled || !hasContent}
                className="h-7 hover:text-gray-950"
              >
                {t("apply")}
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(template);
              }}
              disabled={disabled}
            >
              <Edit className="size-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(template);
              }}
              disabled={disabled}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <Trash2Icon className="size-3" />
            </Button>
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Expanded content */}
      <CollapsibleContent>
        <div className="space-y-2 bg-gray-50/30">
          <MedicationsPreview
            medications={medications}
            onMedicationSelect={onMedicationSelect}
            showAddButton={!!onMedicationSelect}
          />
          <ActivityDefinitionsPreview
            activityDefinitions={activityDefinitions}
            onActivityDefinitionSelect={onActivityDefinitionSelect}
            showAddButton={!!onActivityDefinitionSelect}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const templateFormSchema = z.object({
  name: z.string().min(1, t("name_is_required")),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface ManageResponseTemplatesSheetProps {
  questionnaireSlug: string;
  facilityId?: string;
  trigger?: React.ReactNode;
  onTemplateSelect?: (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => void | Promise<void>;
  onMedicationSelect?: (medication: MedicationRequestCreate) => void;
  onActivityDefinitionSelect?: (
    activityDefinition: ActivityDefinitionTemplateSpec,
  ) => void;
  disabled?: boolean;
  currentMedications?: MedicationRequestCreate[];
  currentActivityDefinitions?: ActivityDefinitionTemplateSpec[];
  key_filter: string;
  facilityOrganizations?: string[];
}

type ViewMode = "list" | "create";

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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [savingCurrent, setSavingCurrent] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<QuestionnaireResponseTemplateReadSpec | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<QuestionnaireResponseTemplateReadSpec | null>(null);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(
    null,
  );
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    string[] | null
  >(facilityOrganizations.length > 0 ? facilityOrganizations : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editableMedications, setEditableMedications] = useState<
    MedicationRequestTemplateSpec[]
  >([]);
  const [editableActivityDefinitions, setEditableActivityDefinitions] =
    useState<ActivityDefinitionTemplateSpec[]>([]);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch templates
  const { data: templatesResponse, isLoading: isLoadingTemplates } = useQuery({
    queryKey: [
      "questionnaireResponseTemplates",
      questionnaireSlug,
      searchQuery,
    ],
    queryFn: query.debounced(questionnaireResponseTemplateApi.list, {
      queryParams: {
        ...(questionnaireSlug &&
        questionnaireSlug !== "medication_request" &&
        questionnaireSlug !== "service_request"
          ? { questionnaire: questionnaireSlug }
          : {}),
        limit: 50,
        facility: facilityId,
        key_filter: key_filter,
        name: searchQuery || undefined,
      },
    }),
    enabled: open && !!questionnaireSlug,
  });

  // Fetch template details when editing
  const { data: templateDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["questionnaireResponseTemplate", editingTemplate?.id],
    queryFn: query(questionnaireResponseTemplateApi.retrieve, {
      pathParams: { id: editingTemplate?.id || "" },
    }),
    enabled: !!editingTemplate?.id,
  });

  // Create template mutation
  const { mutate: createTemplate, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireResponseTemplateApi.create),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      toast.success(t("template_created_successfully"));
      handleResetForm();
    },
    onError: () => {
      toast.error(t("failed_to_create_template"));
    },
  });

  // Update template mutation
  const { mutate: updateTemplate, isPending: isUpdating } = useMutation({
    mutationFn: (data: {
      id: string;
      body: QuestionnaireResponseTemplateUpdateSpec;
    }) =>
      mutate(questionnaireResponseTemplateApi.update, {
        pathParams: { id: data.id },
      })(data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      toast.success(t("template_updated_successfully"));
      handleResetForm();
    },
    onError: () => {
      toast.error(t("failed_to_update_template"));
    },
  });

  // Delete template mutation
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
  });

  const templates = templatesResponse?.results ?? [];
  const hasItemsToSave =
    currentMedications.length > 0 || currentActivityDefinitions.length > 0;
  const totalItemsCount =
    currentMedications.length + currentActivityDefinitions.length;

  // Populate form when template details are loaded for editing
  useEffect(() => {
    if (templateDetails && editingTemplate && viewMode === "create") {
      form.reset({
        name: templateDetails.name,
        description: templateDetails.description || "",
      });
      const orgIds = templateDetails.facility_organizations.map(
        (org) => org.id,
      );
      setSelectedOrganizations(orgIds.length > 0 ? orgIds : null);
      setEditableMedications(
        templateDetails.template_data?.medication_request ?? [],
      );
      setEditableActivityDefinitions(
        templateDetails.template_data?.activity_definition ?? [],
      );
    }
  }, [templateDetails, editingTemplate, viewMode]);

  const handleResetForm = () => {
    form.reset();
    setViewMode("list");
    setSavingCurrent(false);
    setEditingTemplate(null);
    setSelectedOrganizations(
      facilityOrganizations.length > 0 ? facilityOrganizations : null,
    );
    setEditableMedications([]);
    setEditableActivityDefinitions([]);
  };

  const handleEditTemplate = (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    setEditingTemplate(template);
    setViewMode("create");
    setSavingCurrent(false);
  };

  const handleSubmit = (data: TemplateFormData) => {
    if (editingTemplate && templateDetails) {
      // Update existing template with editable lists
      updateTemplate({
        id: editingTemplate.id || "",
        body: {
          name: data.name,
          description: data.description || "",
          template_data: {
            medication_request: editableMedications,
            activity_definition: editableActivityDefinitions,
          },
          users: templateDetails.users.map((u) => u.username),
          facility_organizations: selectedOrganizations ?? [],
        },
      });
    } else {
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
          medication_request: editableMedications,
          activity_definition: editableActivityDefinitions,
        },
        users: [currentUser.username],
        facility_organizations: selectedOrganizations ?? [],
      };

      createTemplate(createData);
    }
  };

  const handleApplyTemplate = async (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    if (!onTemplateSelect) return;

    const templateId = template.id ?? null;
    setApplyingTemplateId(templateId);

    try {
      await onTemplateSelect(template);
      setAppliedTemplateId(templateId);
      setApplyingTemplateId(null);
      setTimeout(() => {
        setAppliedTemplateId(null);
        setOpen(false);
      }, 800);
    } catch {
      setApplyingTemplateId(null);
    }
  };

  const renderTemplateList = () => (
    <div className="space-y-3">
      {/* Action Buttons */}
      {hasItemsToSave && (
        <Button
          variant="outline"
          className="flex-1 gap-2 h-9"
          onClick={() => {
            setSavingCurrent(true);
            setViewMode("create");
            setEditableMedications(
              currentMedications.map(
                (med) =>
                  buildMedicationForTemplate(
                    med,
                  ) as MedicationRequestTemplateSpec,
              ),
            );
            setEditableActivityDefinitions([...currentActivityDefinitions]);
          }}
        >
          <SaveIcon className="size-3.5" />
          <span className="text-xs">{t("save_current")}</span>
          <Badge variant="secondary" className="ml-auto text-xs px-1.5">
            {totalItemsCount}
          </Badge>
        </Button>
      )}

      <div className="relative mt-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder={t("search_templates")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 text-sm px-9"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery("")}
          >
            <X className="size-4" />
            <span className="sr-only">{t("clear_search")}</span>
          </Button>
        )}
      </div>

      <Separator className="my-2" />

      {isLoadingTemplates ? (
        <CardListSkeleton count={3} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="size-6 text-primary" />}
          title={
            searchQuery ? t("no_templates_match_search") : t("no_templates_yet")
          }
          description={
            searchQuery
              ? t("try_different_search_terms")
              : t("create_your_first_template")
          }
        />
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onApply={onTemplateSelect ? handleApplyTemplate : undefined}
              onEdit={handleEditTemplate}
              onDelete={setTemplateToDelete}
              onMedicationSelect={onMedicationSelect}
              onActivityDefinitionSelect={onActivityDefinitionSelect}
              isApplying={applyingTemplateId === template.id}
              isApplied={appliedTemplateId === template.id}
              disabled={!!applyingTemplateId}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateForm = () => (
    <div className="space-y-4">
      {editingTemplate && isLoadingDetails && <CardListSkeleton count={4} />}

      {/* Preview of items being saved (for saving current medications/activities) */}
      {savingCurrent && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-700">{t("preview")}</h3>
          {editableMedications.length > 0 && (
            <MedicationsPreview
              medications={editableMedications}
              variant="form"
              onMedicationRemove={(index) => {
                setEditableMedications((prev) =>
                  prev.filter((_, i) => i !== index),
                );
              }}
            />
          )}
          {editableActivityDefinitions.length > 0 && (
            <ActivityDefinitionsPreview
              activityDefinitions={editableActivityDefinitions}
              variant="form"
              onActivityDefinitionRemove={(index) => {
                setEditableActivityDefinitions((prev) =>
                  prev.filter((_, i) => i !== index),
                );
              }}
            />
          )}
          {editableMedications.length === 0 &&
            editableActivityDefinitions.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                {t("no_items_to_save")}
              </p>
            )}
          <Separator className="my-2" />
        </div>
      )}

      {editingTemplate && !isLoadingDetails && (
        <div className="space-y-2">
          {editableMedications.length > 0 && (
            <MedicationsPreview
              medications={editableMedications}
              variant="form"
              onMedicationRemove={(index) => {
                setEditableMedications((prev) =>
                  prev.filter((_, i) => i !== index),
                );
              }}
            />
          )}
          {editableActivityDefinitions.length > 0 && (
            <ActivityDefinitionsPreview
              activityDefinitions={editableActivityDefinitions}
              variant="form"
              onActivityDefinitionRemove={(index) => {
                setEditableActivityDefinitions((prev) =>
                  prev.filter((_, i) => i !== index),
                );
              }}
            />
          )}
          {editableMedications.length === 0 &&
            editableActivityDefinitions.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                {t("no_items_in_template")}
              </p>
            )}
          <Separator className="my-2" />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("template_name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("enter_template_name")}
                    {...field}
                    autoFocus
                    className="h-9 text-sm"
                  />
                </FormControl>
                <FormDescription className="text-xs -mt-1.5">
                  {t("template_name_help")}
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
                <FormLabel>
                  {t("description")} ({t("optional")})
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("enter_template_description")}
                    rows={2}
                    className="resize-none text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs -mt-1.5">
                  {t("template_description_help")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {facilityId &&
            (!editingTemplate || (editingTemplate && templateDetails)) && (
              <div className="space-y-1.5">
                <FacilityOrganizationSelector
                  key={editingTemplate?.id || "new"}
                  facilityId={facilityId}
                  value={selectedOrganizations}
                  onChange={setSelectedOrganizations}
                  currentOrganizations={
                    editingTemplate && templateDetails
                      ? templateDetails.facility_organizations
                      : undefined
                  }
                  optional
                />
                <FormDescription className="text-xs">
                  {t("select_departments_to_share_template")}
                </FormDescription>
              </div>
            )}

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={handleResetForm}
              disabled={isCreating || isUpdating}
              size="sm"
              className="h-9"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUpdating || isLoadingDetails}
              size="sm"
              className="h-9"
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
                  <span className="text-xs">
                    {editingTemplate ? t("updating") : t("creating")}
                  </span>
                </>
              ) : (
                <>
                  {savingCurrent || editingTemplate ? (
                    <SaveIcon className="size-3.5 mr-1.5" />
                  ) : (
                    <PlusIcon className="size-3.5 mr-1.5" />
                  )}
                  <span className="text-xs">
                    {editingTemplate ? t("save_changes") : t("create_template")}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  const defaultTrigger = (
    <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
      <BookmarkIcon className="size-4" />
      <span className="text-xs">{t("templates")}</span>
      {hasItemsToSave && (
        <Badge variant="primary" className="py-0 text-xs px-1.5">
          {totalItemsCount}
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
            handleResetForm();
            setAppliedTemplateId(null);
          }
        }}
      >
        <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
        <SheetContent className="flex flex-col sm:max-w-lg p-0 overflow-y-auto">
          <SheetHeader className="p-4 space-y-2 bg-gray-100 border border-b-gray-200">
            <div className="flex items-center gap-2">
              {viewMode === "create" && (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={handleResetForm}
                >
                  <ChevronLeft className="size-4" />
                </Button>
              )}
              <div className="flex-1 min-w-0">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <BookmarkIcon className="size-4" />
                  {viewMode === "list"
                    ? t("response_templates")
                    : editingTemplate
                      ? t("edit_template")
                      : savingCurrent
                        ? t("save_as_template")
                        : t("create_template")}
                </SheetTitle>
                {viewMode === "list" && (
                  <SheetDescription className="text-xs mt-1">
                    {onTemplateSelect
                      ? key_filter === "medication_request"
                        ? t("medication_templates_quick_fill_description")
                        : t("service_request_templates_quick_fill_description")
                      : key_filter === "medication_request"
                        ? t("manage_medication_templates_description")
                        : t("manage_service_request_templates_description")}
                  </SheetDescription>
                )}
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 pb-4">
            <div className="px-4">
              {viewMode === "list" ? renderTemplateList() : renderCreateForm()}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
        title={t("delete_template")}
        description={t("delete_template_confirmation", {
          name: templateToDelete?.name,
        })}
        onConfirm={() => {
          if (templateToDelete?.id) {
            deleteTemplate(templateToDelete.id);
          }
        }}
        confirmText={isDeleting ? t("deleting") : t("delete")}
        variant="destructive"
        disabled={isDeleting}
      />
    </>
  );
}
