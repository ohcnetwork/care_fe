import { MinusCircledIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import {
  AlertTriangle,
  ChevronsDownUp,
  ChevronsUpDown,
  FileTextIcon,
  Loader2,
  MoreVerticalIcon,
  PillIcon,
  PlusIcon,
  SlidersHorizontal,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ComboboxQuantityInput } from "@/components/Common/ComboboxQuantityInput";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import UserSelector from "@/components/Common/UserSelector";
import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import InstructionsPopover from "@/components/Medicine/InstructionsPopover";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { MedicationTimingSelect } from "@/components/Medicine/MedicationTimingSelect";
import { EntitySelectionDrawer } from "@/components/Questionnaire/EntitySelectionDrawer";
import ManageResponseTemplatesSheet from "@/components/Questionnaire/ManageResponseTemplatesSheet";
import MedicationValueSetSelect from "@/components/Questionnaire/MedicationValueSetSelect";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useAuthUser from "@/hooks/useAuthUser";
import useBreakpoints from "@/hooks/useBreakpoints";

import { Avatar } from "@/components/Common/Avatar";
import { formatDosage } from "@/components/Medicine/utils";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import {
  DoseRange,
  INACTIVE_MEDICATION_STATUSES,
  MEDICATION_REQUEST_INTENT,
  MEDICATION_REQUEST_TIMING_OPTIONS,
  MedicationRequestCreate,
  MedicationRequestDosageInstruction,
  MedicationRequestIntent,
  MedicationRequestRead,
  MedicationRequestTemplateSpec,
  UCUM_TIME_UNITS,
  displayMedicationName,
  parseMedicationStringToRequest,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { QuestionnaireResponseTemplateReadSpec } from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";
import {
  useFieldError,
  validateFields,
} from "@/types/questionnaire/validation";
import { UserReadMinimal } from "@/types/user/user";
import { isZero, round } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";

import { filterStructuredQuestionnaireSlugs } from "@/components/Questionnaire/data/StructuredFormData";

function formatDoseRange(range?: DoseRange): string {
  if (!range?.high?.value) return "";
  return `${round(range.low?.value)} → ${round(range.high?.value)} ${range.high?.unit?.display}`;
}

/**
 * Builds a medication object suitable for storing in a template.
 * Converts internal representations to template-friendly format.
 */
export function buildMedicationForTemplate(
  medication: MedicationRequestCreate,
): Record<string, unknown> {
  const medicationForTemplate: Record<string, unknown> = {
    ...medication,
    requested_product: medication.requested_product_internal?.slug || undefined,
  };

  // Handle medication field based on whether we have a product slug
  if (medication.requested_product) {
    delete medicationForTemplate.medication;
  } else if (medication.medication?.code) {
    medicationForTemplate.medication = medication.medication;
  } else {
    delete medicationForTemplate.medication;
  }

  // Remove internal objects that shouldn't be stored in templates
  delete medicationForTemplate.requested_product_internal;
  delete medicationForTemplate.id;

  return medicationForTemplate;
}

/**
 * Fetches product knowledge by slug and builds a medication request.
 * Accepts template medication specs and returns a full MedicationRequestCreate.
 */
async function fetchProductAndBuildMedication(
  med: MedicationRequestTemplateSpec,
  currentUser: UserReadMinimal,
): Promise<MedicationRequestCreate> {
  let productKnowledge: ProductKnowledgeBase | undefined;

  // Templates store SLUG in requested_product (not UUID)
  const requestedProduct =
    typeof med.requested_product === "string"
      ? med.requested_product
      : undefined;

  if (requestedProduct) {
    try {
      productKnowledge = await query(
        productKnowledgeApi.retrieveProductKnowledge,
        {
          pathParams: { slug: requestedProduct },
        },
      )({ signal: new AbortController().signal });
    } catch (error) {
      console.warn(
        `Failed to fetch product knowledge for slug: ${requestedProduct}`,
        error,
      );
    }
  }

  // Use product knowledge ID (UUID) for the actual medication request
  const productId = productKnowledge?.id;

  return {
    ...med,
    id: undefined,
    do_not_perform: med.do_not_perform ?? false,
    dosage_instruction: med.dosage_instruction ?? [
      { as_needed_boolean: false },
    ],
    authored_on: new Date().toISOString(),
    requester: currentUser,
    requested_product: productId,
    requested_product_internal: productKnowledge,
  };
}

interface MedicationRequestQuestionProps {
  patientId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  encounterId: string;
  errors?: QuestionValidationError[];
  questionnaireId?: string;
  questionnaireSlug?: string;
}

const MEDICATION_REQUEST_FIELDS = {
  DOSAGE: {
    key: "dosage_instruction.dose",
    required: true,
    validate: (value: unknown) => {
      const dosageInstruction =
        value as MedicationRequestCreate["dosage_instruction"][0];
      return !!(
        dosageInstruction?.dose_and_rate?.dose_quantity ||
        dosageInstruction?.dose_and_rate?.dose_range
      );
    },
  },
  FREQUENCY: {
    key: "dosage_instruction.frequency",
    required: true,
    validate: (value: unknown) => {
      const dosageInstruction =
        value as MedicationRequestCreate["dosage_instruction"][0];
      return !!(
        dosageInstruction?.timing || dosageInstruction?.as_needed_boolean
      );
    },
  },
  DURATION: {
    key: "dosage_instruction.duration",
    required: false,
    validate: (value: unknown) => {
      const dosageInstruction =
        value as MedicationRequestCreate["dosage_instruction"][0];
      if (dosageInstruction?.timing) {
        const duration = dosageInstruction.timing.repeat.bounds_duration;
        return !!(duration?.value && duration?.unit);
      }
      return true;
    },
  },
} as const;

export function validateMedicationRequestQuestion(
  values: MedicationRequestCreate[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    // Skip validation for medications marked as entered_in_error
    if (value.status === "entered_in_error") return errors;

    // Validate each dosage instruction
    const dosageInstruction = value.dosage_instruction[0];
    if (!dosageInstruction) {
      return [
        ...errors,
        {
          question_id: questionId,
          error: t("field_required"),
          type: "validation_error",
          field_key: "dosage_instruction",
          index,
        },
      ];
    }

    // Validate using the fields
    const fieldErrors = validateFields(
      {
        [MEDICATION_REQUEST_FIELDS.DOSAGE.key]: dosageInstruction,
        [MEDICATION_REQUEST_FIELDS.FREQUENCY.key]: dosageInstruction,
        [MEDICATION_REQUEST_FIELDS.DURATION.key]: dosageInstruction,
      },
      questionId,
      MEDICATION_REQUEST_FIELDS,
      index,
    );

    // Map error messages to be more specific
    return [
      ...errors,
      ...fieldErrors.map((error) => ({
        ...error,
        error: (["DOSAGE", "FREQUENCY", "DURATION"] as const).some(
          (attr) => MEDICATION_REQUEST_FIELDS[attr].key === error.field_key,
        )
          ? t("field_required")
          : error.error,
      })),
    ];
  }, []);
}

export function MedicationRequestQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  patientId,
  encounterId,
  errors,
  questionnaireId: _questionnaireId,
  questionnaireSlug,
}: MedicationRequestQuestionProps) {
  const authUser = useAuthUser();
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacilitySilently();
  const currentUser = useAuthUser() as UserReadMinimal;
  const isPreview = patientId === "preview";
  const medications =
    (questionnaireResponse.values?.[0]?.value as MedicationRequestCreate[]) ||
    [];

  const { data: patientMedications } = useQuery({
    queryKey: ["medication_requests", patientId, encounterId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        ordering: "-modified_date",
        limit: 100,
        facility: facilityId,
      },
    }),
    enabled: !isPreview,
  });

  useEffect(() => {
    if (patientMedications?.results) {
      updateQuestionnaireResponseCB(
        [
          {
            type: "medication_request",
            value: patientMedications.results.map((medication) => ({
              ...medication,
              requested_product_internal: medication.requested_product,
              requested_product: medication.requested_product?.id,
              requester: medication.requester || currentUser,
              dirty: false, // Existing medications are not dirty
            })),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  }, [patientMedications]);

  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState<
    number | null
  >(null);

  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(
    null,
  );
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const desktopLayout = useBreakpoints({ lg: true, default: false });

  const [newMedicationInSheet, setNewMedicationInSheet] =
    useState<MedicationRequestCreate | null>(null);

  // Add to template state
  const [medicationToAddToTemplate, setMedicationToAddToTemplate] =
    useState<MedicationRequestCreate | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const queryClient = useQueryClient();

  // Query for templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: [
      "questionnaire_response_templates",
      questionnaireSlug,
      templateSearchQuery,
    ],
    queryFn: query(questionnaireResponseTemplateApi.list, {
      queryParams: {
        questionnaire: filterStructuredQuestionnaireSlugs(questionnaireSlug),
        key_filter: "medication_request",
        name: templateSearchQuery || undefined,
        limit: 20,
      },
    }),
    enabled: !!questionnaireSlug && !!medicationToAddToTemplate,
  });

  // Mutation for adding medication to template
  const addToTemplateMutation = useMutation({
    mutationFn: (params: {
      template: QuestionnaireResponseTemplateReadSpec;
      medication: MedicationRequestCreate;
    }) => {
      const existingMedications =
        params.template.template_data?.medication_request || [];
      const medicationForTemplate = buildMedicationForTemplate(
        params.medication,
      );

      return mutate(questionnaireResponseTemplateApi.update, {
        pathParams: {
          id: params.template.id!,
        },
      })({
        name: params.template.name,
        description: params.template.description || "",
        template_data: {
          ...params.template.template_data,
          medication_request: [...existingMedications, medicationForTemplate],
        },
        users: [authUser.username],
        facility_organizations: [],
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        t("medication_added_to_template", {
          template: variables.template.name,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ["questionnaire_response_templates", questionnaireSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      setMedicationToAddToTemplate(null);
      setTemplateSearchQuery("");
    },
    onError: () => {
      toast.error(t("failed_to_add_to_template"));
    },
  });

  // Mutation for creating a new template with the medication
  const createTemplateWithMedicationMutation = useMutation({
    mutationFn: (params: {
      name: string;
      medication: MedicationRequestCreate;
    }) => {
      const medicationForTemplate = buildMedicationForTemplate(
        params.medication,
      );

      return mutate(questionnaireResponseTemplateApi.create)({
        name: params.name,
        description: "",
        ...(questionnaireSlug &&
        questionnaireSlug !== "service_request" &&
        questionnaireSlug !== "medication_request"
          ? { questionnaire: questionnaireSlug }
          : {}),
        facility: facilityId,
        template_data: {
          medication_request: [medicationForTemplate],
          service_request: [],
        },
        users: [authUser.username],
        facility_organizations: [],
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        t("template_created_with_medication", {
          template: variables.name,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ["questionnaire_response_templates", questionnaireSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      setMedicationToAddToTemplate(null);
      setTemplateSearchQuery("");
      setIsCreatingNewTemplate(false);
      setNewTemplateName("");
    },
    onError: () => {
      toast.error(t("failed_to_create_template"));
    },
  });

  const handleAddToTemplate = (medication: MedicationRequestCreate) => {
    setMedicationToAddToTemplate(medication);
    setIsCreatingNewTemplate(false);
    setNewTemplateName("");
  };

  const handleCreateNewTemplateWithMedication = () => {
    if (!medicationToAddToTemplate || !newTemplateName.trim()) return;
    createTemplateWithMedicationMutation.mutate({
      name: newTemplateName.trim(),
      medication: medicationToAddToTemplate,
    });
  };

  const handleSelectTemplate = (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    if (!medicationToAddToTemplate) return;
    addToTemplateMutation.mutate({
      template,
      medication: medicationToAddToTemplate,
    });
  };

  const handleAddMedication = (medication: Code) => {
    const initialDetails: MedicationRequestCreate = {
      ...parseMedicationStringToRequest(currentUser, medication),
      authored_on: new Date().toISOString(),
      requester: currentUser,
    };

    if (desktopLayout) {
      addNewMedication(initialDetails);
    } else {
      setNewMedicationInSheet(initialDetails);
    }
  };

  const handleAddProductMedication = (
    productKnowledge: ProductKnowledgeBase,
  ) => {
    const initialDetails = {
      ...parseMedicationStringToRequest(
        currentUser,
        undefined,
        productKnowledge,
      ),
      authored_on: new Date().toISOString(),
      requester: currentUser,
    };

    if (desktopLayout) {
      addNewMedication(initialDetails);
    } else {
      setNewMedicationInSheet(initialDetails);
    }
  };

  const addNewMedication = (medication: MedicationRequestCreate) => {
    const newMedications: MedicationRequestCreate[] = [
      ...medications,
      { ...medication, dirty: true }, // Mark new medication as dirty
    ];

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );

    setExpandedMedicationIndex(newMedications.length - 1);
    setNewMedicationInSheet(null);
  };

  const handleConfirmMedicationInSheet = () => {
    if (!newMedicationInSheet) return;
    addNewMedication(newMedicationInSheet);
  };

  const handleAddHistoricalMedications = (
    selected: (MedicationRequestRead | MedicationStatementRead)[],
  ) => {
    // Filter and convert MedicationStatement to MedicationRequest if needed
    const medicationRequests = selected.map((record) => {
      if ("dosage_instruction" in record) {
        const {
          id: _id,
          requested_product,
          ...request
        } = record as MedicationRequestRead;
        delete request.prescription;

        return {
          ...request,
          requested_product: requested_product?.id,
          requested_product_internal: requested_product,
          requester: currentUser,
          medication: requested_product?.id ? null : request.medication,
          dirty: true, // Mark as dirty since it's being added as new
        } as MedicationRequestCreate;
      } else {
        const statement = record as MedicationStatementRead;
        return {
          ...parseMedicationStringToRequest(currentUser, statement.medication),
          authored_on: new Date().toISOString(),
          note: statement.note,
          requester: currentUser,
          dirty: true, // Mark as dirty since it's being added as new
        } as MedicationRequestCreate;
      }
    });
    const newMedications: MedicationRequestCreate[] = [
      ...medications,
      ...medicationRequests,
    ];
    updateQuestionnaireResponseCB(
      [
        {
          type: "medication_request",
          value: newMedications,
        },
      ],
      questionnaireResponse.question_id,
    );
    setExpandedMedicationIndex(medications.length);
  };

  const handleRemoveMedication = (index: number) => {
    setMedicationToDelete(index);
  };

  const confirmRemoveMedication = () => {
    if (medicationToDelete === null) return;

    const medication = medications[medicationToDelete];
    if (medication.id) {
      // For existing records, update status to entered_in_error
      const newMedications = medications.map((med, i) =>
        i === medicationToDelete
          ? { ...med, status: "entered_in_error" as const, dirty: true }
          : med,
      );
      updateQuestionnaireResponseCB(
        [{ type: "medication_request", value: newMedications }],
        questionnaireResponse.question_id,
      );
    } else {
      // For new records, remove them completely
      const newMedications = medications.filter(
        (_, i) => i !== medicationToDelete,
      );
      updateQuestionnaireResponseCB(
        [{ type: "medication_request", value: newMedications }],
        questionnaireResponse.question_id,
      );
    }
    setMedicationToDelete(null);
  };

  const handleUpdateMedication = (
    index: number,
    updates: Partial<MedicationRequestCreate>,
  ) => {
    const newMedications = medications.map((medication, i) =>
      i === index ? { ...medication, ...updates, dirty: true } : medication,
    );

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );
  };

  // Handler for adding a single medication from a template
  const handleAddSingleMedication = async (med: MedicationRequestCreate) => {
    const medicationToAdd = await fetchProductAndBuildMedication(
      med,
      currentUser,
    );

    const newMedications: MedicationRequestCreate[] = [
      ...medications,
      medicationToAdd,
    ];

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );

    setExpandedMedicationIndex(medications.length);
  };

  const handleApplyTemplate = async (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    const templateMedications = template.template_data?.medication_request;
    if (!templateMedications?.length) {
      toast.info(t("template_has_no_medications"));
      throw new Error("Template has no medications");
    }

    try {
      // Fetch product knowledge for each medication using the stored slug
      const medicationsWithProductKnowledge = await Promise.all(
        templateMedications.map((med) =>
          fetchProductAndBuildMedication(med, currentUser),
        ),
      );

      const newMedications: MedicationRequestCreate[] = [
        ...medications,
        ...medicationsWithProductKnowledge,
      ];

      updateQuestionnaireResponseCB(
        [{ type: "medication_request", value: newMedications }],
        questionnaireResponse.question_id,
      );

      toast.success(
        t("template_applied_medications", {
          count: templateMedications.length,
          name: template.name,
        }),
      );

      setExpandedMedicationIndex(medications.length);
    } catch (error) {
      toast.error(t("failed_to_apply_template"));
      throw error;
    }
  };

  const newMedicationSheetContent = (
    <div className="space-y-3">
      {newMedicationInSheet && (
        <MedicationRequestGridRow
          medication={newMedicationInSheet}
          disabled={disabled}
          onUpdate={(updates) => {
            if (newMedicationInSheet) {
              setNewMedicationInSheet({
                ...newMedicationInSheet,
                ...updates,
              });
            }
          }}
          onRemove={() => {}}
          index={-1}
          questionId={questionnaireResponse.question_id}
          errors={errors}
          facilityId={facilityId}
          showAdvancedFields={true}
        />
      )}
    </div>
  );

  const addMedicationPlaceholder = t("add_medication", {
    count: medications.length + 1,
  });

  return (
    <div
      className={cn(
        "space-y-4",
        medications.length > 0 ? "md:max-w-fit" : "max-w-4xl",
      )}
    >
      <ConfirmActionDialog
        open={medicationToDelete !== null}
        onOpenChange={(open) => !open && setMedicationToDelete(null)}
        onConfirm={confirmRemoveMedication}
        title={t("remove_medication")}
        description={t("remove_medication_confirmation", {
          medication: displayMedicationName(medications[medicationToDelete!]),
        })}
        confirmText={t("remove")}
        variant="destructive"
      />

      {/* Add to Template Dialog */}
      <Dialog
        open={!!medicationToAddToTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setMedicationToAddToTemplate(null);
            setTemplateSearchQuery("");
            setIsCreatingNewTemplate(false);
            setNewTemplateName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-1.5">
                <PillIcon className="size-4 text-blue-600" />
              </div>
              {isCreatingNewTemplate
                ? t("create_new_template")
                : t("add_to_template")}
            </DialogTitle>
            <DialogDescription>
              {isCreatingNewTemplate
                ? t("create_template_with_item")
                : t("select_or_create_template")}
            </DialogDescription>
          </DialogHeader>

          {/* Medication preview */}
          {medicationToAddToTemplate && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="rounded-full bg-blue-100 p-2 shrink-0">
                <PillIcon className="size-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-blue-900">
                  {displayMedicationName(medicationToAddToTemplate)}
                </p>
                <p className="text-xs text-blue-600">
                  {isCreatingNewTemplate
                    ? t("will_be_added_to_new_template")
                    : t("will_be_added_to_selected_template")}
                </p>
              </div>
            </div>
          )}

          {isCreatingNewTemplate ? (
            /* Create New Template Form */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-template-name">{t("template_name")}</Label>
                <Input
                  id="new-template-name"
                  placeholder={t("enter_template_name_placeholder")}
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      newTemplateName.trim() &&
                      !createTemplateWithMedicationMutation.isPending
                    ) {
                      handleCreateNewTemplateWithMedication();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsCreatingNewTemplate(false);
                    setNewTemplateName("");
                  }}
                  disabled={createTemplateWithMedicationMutation.isPending}
                >
                  {t("back")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateNewTemplateWithMedication}
                  disabled={
                    !newTemplateName.trim() ||
                    createTemplateWithMedicationMutation.isPending
                  }
                >
                  {createTemplateWithMedicationMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="size-4 mr-2" />
                      {t("create_template")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Template Selection */
            <div className="space-y-3">
              {/* Create New Template Button */}
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/30 hover:bg-primary-50 transition-colors text-left"
                onClick={() => setIsCreatingNewTemplate(true)}
              >
                <div className="rounded-lg bg-primary-100 p-2">
                  <PlusIcon className="size-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-primary-900">
                    {t("create_new_template")}
                  </p>
                  <p className="text-xs text-primary-600">
                    {t("start_new_template_with_item")}
                  </p>
                </div>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">
                    {t("or_add_to_existing")}
                  </span>
                </div>
              </div>

              {/* Search and Template List */}
              <div className="relative">
                <Input
                  placeholder={t("search_templates")}
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="pr-8"
                />
                {templateSearchQuery && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setTemplateSearchQuery("")}
                  >
                    <MinusCircledIcon className="size-4" />
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 -mx-1 px-1">
                {isLoadingTemplates ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Loader2 className="size-5 animate-spin mb-2" />
                    <span className="text-sm">{t("loading_templates")}</span>
                  </div>
                ) : templatesData?.results?.length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <p className="text-sm text-gray-500">
                      {templateSearchQuery
                        ? t("no_templates_match_search")
                        : t("no_existing_templates")}
                    </p>
                  </div>
                ) : (
                  // Sort templates: medications first, then empty, then labs-only
                  [...(templatesData?.results || [])]
                    .sort((a, b) => {
                      const aMeds =
                        a.template_data?.medication_request?.length ?? 0;
                      const bMeds =
                        b.template_data?.medication_request?.length ?? 0;
                      // Templates with medications come first
                      if (aMeds > 0 && bMeds === 0) return -1;
                      if (bMeds > 0 && aMeds === 0) return 1;
                      // Then sort by medication count (more = better match)
                      return bMeds - aMeds;
                    })
                    .map((template) => {
                      const existingMedCount =
                        template.template_data?.medication_request?.length ?? 0;
                      const existingServiceCount =
                        template.template_data?.activity_definition?.length ??
                        0;
                      const hasMedications = existingMedCount > 0;

                      return (
                        <button
                          key={template.id}
                          type="button"
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                            addToTemplateMutation.isPending
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer",
                            hasMedications
                              ? "border-blue-200 bg-blue-50/30"
                              : "border-gray-200 bg-white",
                          )}
                          onClick={() => handleSelectTemplate(template)}
                          disabled={addToTemplateMutation.isPending}
                        >
                          <div
                            className={cn(
                              "rounded-lg p-2",
                              hasMedications ? "bg-blue-100" : "bg-gray-100",
                            )}
                          >
                            {hasMedications ? (
                              <PillIcon className="size-4 text-blue-600" />
                            ) : (
                              <FileTextIcon className="size-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {template.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {existingMedCount > 0 && (
                                <span className="text-blue-600">
                                  {t("medications_count", {
                                    count: existingMedCount,
                                  })}
                                </span>
                              )}
                              {existingMedCount > 0 &&
                                existingServiceCount > 0 && <span>•</span>}
                              {existingServiceCount > 0 && (
                                <span>
                                  {t("service_requests_count", {
                                    count: existingServiceCount,
                                  })}
                                </span>
                              )}
                              {existingMedCount === 0 &&
                                existingServiceCount === 0 && (
                                  <span className="italic">
                                    {t("empty_template")}
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="text-primary-600">
                            <PlusIcon className="size-5" />
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-2">
        <HistoricalRecordSelector<
          MedicationRequestRead | MedicationStatementRead
        >
          title={t("medication_history")}
          structuredTypes={[
            {
              type: t("past_prescriptions"),
              displayFields: [
                {
                  key: "",
                  label: t("medicine"),
                  render: (med) => displayMedicationName(med),
                },
                {
                  key: "dosage_instruction",
                  label: t("dosage"),
                  render: (instructions) => {
                    const dosage = formatDosage(instructions[0]) || "";
                    const frequency =
                      getFrequencyDisplay(instructions[0]?.timing)?.meaning ||
                      "-";
                    return `${dosage}\n${frequency}`;
                  },
                },
                {
                  key: "dosage_instruction",
                  label: t("duration"),
                  render: (instructions) => {
                    const duration =
                      instructions?.[0]?.timing?.repeat?.bounds_duration;
                    if (!duration?.value) return "-";
                    return `${duration.value} ${duration.unit}`;
                  },
                },
                {
                  key: "requester",
                  label: t("prescribed_by"),
                  render: (requester) => (
                    <div className="flex items-center gap-2">
                      <Avatar
                        imageUrl={requester?.profile_picture_url}
                        name={formatName(requester, true)}
                        className="size-6 rounded-full"
                      />
                      <span className="text-sm truncate">
                        {formatName(requester)}
                      </span>
                    </div>
                  ),
                },
              ],
              expandableFields: [
                {
                  key: "dosage_instruction",
                  label: t("instructions"),
                  render: (instructions) =>
                    instructions?.[0]?.additional_instruction?.[0]?.display,
                },
                {
                  key: "note",
                  label: t("notes"),
                  render: (note) => note,
                },
              ],
              queryKey: ["medication_requests", patientId],
              queryFn: async (
                limit: number,
                offset: number,
                signal: AbortSignal,
              ) => {
                const response = await query(medicationRequestApi.list, {
                  pathParams: { patientId },
                  queryParams: {
                    limit,
                    offset,
                    status:
                      "active,on_hold,draft,unknown,ended,completed,cancelled",
                  },
                })({ signal });
                return response;
              },
            },
            {
              type: t("medication_statements"),
              displayFields: [
                {
                  key: "medication",
                  label: t("medicine"),
                  render: (med) => med?.display,
                },
                {
                  key: "dosage_text",
                  label: t("dosage_instruction"),
                  render: (dosage) => dosage,
                },
                {
                  key: "status",
                  label: t("status"),
                  render: (status: string) => t(`medication_status__${status}`),
                },
                {
                  key: "created_by",
                  label: t("prescribed_by"),
                  render: (created_by) => (
                    <div className="flex items-center gap-2">
                      <Avatar
                        imageUrl={created_by?.profile_picture_url}
                        name={formatName(created_by, true)}
                        className="size-6 rounded-full"
                      />
                      <span className="text-sm truncate">
                        {formatName(created_by)}
                      </span>
                    </div>
                  ),
                },
              ],
              expandableFields: [
                {
                  key: "note",
                  label: t("notes"),
                  render: (note) => note,
                },
              ],
              queryKey: ["medication_statements", patientId],
              queryFn: async (
                limit: number,
                offset: number,
                signal: AbortSignal,
              ) => {
                const response = await query(medicationStatementApi.list, {
                  pathParams: { patientId },
                  queryParams: {
                    limit,
                    offset,
                    status:
                      "active,on_hold,completed,stopped,unknown,not_taken,intended",
                  },
                })({ signal });
                return response;
              },
            },
          ]}
          buttonLabel={t("medication_history")}
          onAddSelected={handleAddHistoricalMedications}
          disableAPI={isPreview}
        />
        {questionnaireSlug && (
          <ManageResponseTemplatesSheet
            questionnaireSlug={questionnaireSlug}
            facilityId={facilityId}
            onTemplateSelect={handleApplyTemplate}
            onMedicationSelect={handleAddSingleMedication}
            disabled={disabled || isPreview}
            currentMedications={medications}
            key_filter="medication_request"
          />
        )}
      </div>
      {!!patientMedications?.count && patientMedications.count > 100 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {t("medication_list_truncated_warning", {
              shown: 100,
              total: patientMedications.count,
            })}
          </AlertDescription>
        </Alert>
      )}
      {medications.length > 0 && (
        <div className="md:overflow-x-auto w-auto">
          <div className="min-w-fit">
            <div
              className={cn(
                "relative lg:border border-gray-200 rounded-md",
                showAdvancedFields ? "max-w-[2678px]" : "max-w-[1108px]",
                {
                  "bg-gray-50/50": !desktopLayout,
                },
              )}
            >
              {/* Header - Only show on desktop */}
              <div
                className={cn(
                  "hidden lg:grid bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500",
                  showAdvancedFields
                    ? "grid-cols-[280px_220px_180px_160px_40px_300px_180px_250px_180px_160px_220px_280px_180px_48px]"
                    : "grid-cols-[280px_220px_180px_160px_40px_180px_48px]",
                )}
              >
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("medicine")}
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("dosage")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("frequency")}
                  <span className="text-red-500 ml-0.5">*</span>
                </div>
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("duration")}
                </div>
                {/* Expand/Collapse bar for advanced fields */}
                <div
                  className={cn(
                    "flex items-center justify-center border-r border-gray-200 cursor-pointer transition-colors",
                    showAdvancedFields
                      ? "bg-primary-50 hover:bg-primary-100"
                      : "bg-gray-100 hover:bg-gray-200",
                  )}
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  title={
                    showAdvancedFields
                      ? t("hide_advanced_fields")
                      : t("show_advanced_fields")
                  }
                >
                  {showAdvancedFields ? (
                    <ChevronsDownUp className="h-4 w-4 text-primary-600 rotate-90" />
                  ) : (
                    <ChevronsUpDown className="h-4 w-4 text-gray-500 rotate-90" />
                  )}
                </div>
                {/* Advanced fields - inserted between bar and notes when expanded */}
                {showAdvancedFields && (
                  <>
                    <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                      {t("instructions")}
                    </div>
                    <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                      {t("route")}
                    </div>
                    <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                      {t("site")}
                    </div>
                    <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                      {t("method")}
                    </div>
                    <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                      {t("intent")}
                    </div>
                    <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                      {t("authored_on")}
                    </div>
                    <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                      {t("requester")}
                    </div>
                  </>
                )}
                {/* Notes - Always visible, at the end before remove button */}
                <div className="font-semibold text-gray-600 p-3 border-r border-gray-200">
                  {t("note")}
                </div>
                <div className="font-semibold text-gray-600 p-3 sticky right-0 bg-gray-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12" />
              </div>

              {/* Body */}
              <div
                className={cn("bg-white", {
                  "bg-transparent": !desktopLayout,
                })}
              >
                {medications.map((medication, index) => {
                  const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
                    medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
                  );
                  const dosageInstruction =
                    medication.dosage_instruction[0] || {};

                  return (
                    <React.Fragment key={medication.id || index}>
                      {!desktopLayout ? (
                        <Card
                          className={cn(
                            "mb-2 rounded-lg border-0 shadow-none",
                            expandedMedicationIndex === index &&
                              "border border-primary-500",
                          )}
                        >
                          <Collapsible
                            open={expandedMedicationIndex === index}
                            onOpenChange={() => {
                              setExpandedMedicationIndex(
                                expandedMedicationIndex === index
                                  ? null
                                  : index,
                              );
                            }}
                            className="w-full"
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader
                                className={cn(
                                  "p-2 rounded-lg shadow-none bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors",
                                  {
                                    "bg-gray-200 border border-gray-300":
                                      expandedMedicationIndex !== index,
                                  },
                                )}
                              >
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                      <CardTitle
                                        className={cn(
                                          "text-base text-gray-950 wrap-break-word",
                                          isInactive &&
                                            medication.status !== "ended" &&
                                            "line-through",
                                        )}
                                        title={
                                          medication.medication?.display ||
                                          medication.requested_product_internal
                                            ?.name
                                        }
                                      >
                                        {medication.medication?.display ||
                                          medication.requested_product_internal
                                            ?.name}
                                      </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {expandedMedicationIndex === index ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveMedication(index);
                                          }}
                                          disabled={isInactive || disabled}
                                          className="size-10 p-4 border border-gray-400 bg-white shadow text-destructive"
                                          aria-label="Remove medication"
                                        >
                                          <MinusCircledIcon className="size-5" />
                                        </Button>
                                      ) : null}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-10 border border-gray-400 bg-white shadow p-4 pointer-events-none"
                                        aria-label={
                                          expandedMedicationIndex === index
                                            ? "Collapse medication"
                                            : "Expand medication"
                                        }
                                      >
                                        {expandedMedicationIndex === index ? (
                                          <ChevronsDownUp className="size-5" />
                                        ) : (
                                          <ChevronsUpDown className="size-5" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {expandedMedicationIndex !== index && (
                                    <div className="text-sm mt-1 text-gray-600">
                                      {dosageInstruction?.dose_and_rate
                                        ?.dose_quantity &&
                                        `${round(dosageInstruction.dose_and_rate.dose_quantity.value)} ${dosageInstruction.dose_and_rate.dose_quantity.unit?.display || ""}`}

                                      {dosageInstruction?.dose_and_rate
                                        ?.dose_range &&
                                        formatDoseRange(
                                          dosageInstruction.dose_and_rate
                                            .dose_range,
                                        )}

                                      {dosageInstruction?.as_needed_boolean
                                        ? ` · ${t("as_needed_prn")}`
                                        : dosageInstruction?.timing?.code
                                            ?.code &&
                                          ` · ${MEDICATION_REQUEST_TIMING_OPTIONS[dosageInstruction.timing.code.code]?.display || ""}`}

                                      {dosageInstruction?.timing?.repeat
                                        ?.bounds_duration?.value &&
                                        ` · ${dosageInstruction.timing.repeat.bounds_duration.value} ${dosageInstruction.timing.repeat.bounds_duration.unit}`}
                                    </div>
                                  )}
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="p-2 pt-2 space-y-3 rounded-lg bg-gray-50">
                                <MedicationRequestGridRow
                                  medication={medication}
                                  disabled={disabled}
                                  onUpdate={(updates) =>
                                    handleUpdateMedication(index, updates)
                                  }
                                  onRemove={() => handleRemoveMedication(index)}
                                  onAddToTemplate={
                                    questionnaireSlug
                                      ? handleAddToTemplate
                                      : undefined
                                  }
                                  index={index}
                                  questionId={questionnaireResponse.question_id}
                                  errors={errors}
                                  facilityId={facilityId}
                                  showAdvancedFields={true}
                                />
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      ) : (
                        <MedicationRequestGridRow
                          medication={medication}
                          disabled={disabled || isInactive}
                          onUpdate={(updates) =>
                            handleUpdateMedication(index, updates)
                          }
                          onRemove={() => handleRemoveMedication(index)}
                          onAddToTemplate={
                            questionnaireSlug ? handleAddToTemplate : undefined
                          }
                          index={index}
                          questionId={questionnaireResponse.question_id}
                          errors={errors}
                          facilityId={facilityId}
                          showAdvancedFields={showAdvancedFields}
                          onToggleAdvanced={() =>
                            setShowAdvancedFields(!showAdvancedFields)
                          }
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {!desktopLayout ? (
        <EntitySelectionDrawer
          open={!!newMedicationInSheet}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setNewMedicationInSheet(null);
            }
          }}
          system="system-medication"
          entityType="medication"
          searchPostFix=" clinical drug"
          disabled={disabled}
          onEntitySelected={handleAddMedication}
          onConfirm={handleConfirmMedicationInSheet}
          placeholder={addMedicationPlaceholder}
          onProductEntitySelected={handleAddProductMedication}
          enableProduct
        >
          {newMedicationSheetContent}
        </EntitySelectionDrawer>
      ) : (
        <div className="max-w-4xl">
          <MedicationValueSetSelect
            placeholder={addMedicationPlaceholder}
            onSelect={handleAddMedication}
            onProductSelect={handleAddProductMedication}
            disabled={disabled}
            title={t("select_medication")}
          />
        </div>
      )}
    </div>
  );
}

interface MedicationRequestGridRowProps {
  medication: MedicationRequestCreate;
  disabled?: boolean;
  onUpdate?: (medication: Partial<MedicationRequestCreate>) => void;
  onRemove?: () => void;
  onAddToTemplate?: (medication: MedicationRequestCreate) => void;
  index: number;
  questionId: string;
  errors?: QuestionValidationError[];
  facilityId?: string;
  showAdvancedFields?: boolean;
  onToggleAdvanced?: () => void;
}

const MedicationRequestGridRow: React.FC<MedicationRequestGridRowProps> = ({
  medication,
  disabled,
  onUpdate,
  onRemove,
  onAddToTemplate,
  index,
  questionId,
  errors,
  facilityId,
  showAdvancedFields = false,
  onToggleAdvanced,
}) => {
  const { t } = useTranslation();
  const [showDosageDialog, setShowDosageDialog] = useState(false);
  const [showMobileAdvanced, setShowMobileAdvanced] = useState(false);
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const dosageInstruction = medication.dosage_instruction[0] || {};
  const isReadOnly = !!medication.id;
  const { hasError } = useFieldError(questionId, errors, index);

  const [currentInstructions, setCurrentInstructions] = useState<Code[]>(
    dosageInstruction?.additional_instruction || [],
  );

  const updateInstructions = (instructions: Code[]) => {
    setCurrentInstructions(instructions);
    handleUpdateDosageInstruction({
      additional_instruction:
        instructions.length > 0 ? instructions : undefined,
    });
  };

  const addInstruction = (instruction: Code) => {
    if (!currentInstructions.some((item) => item.code === instruction.code)) {
      updateInstructions([...currentInstructions, instruction]);
    } else {
      toast.warning(`${instruction.display} ${t("is_already_selected")}`);
    }
  };

  const removeInstruction = (instructionCode: string) => {
    updateInstructions(
      currentInstructions.filter((item) => item.code !== instructionCode),
    );
  };

  const handleUpdateDosageInstruction = (
    updates: Partial<MedicationRequestDosageInstruction>,
  ) => {
    onUpdate?.({
      dosage_instruction: [{ ...dosageInstruction, ...updates }],
    });
  };

  interface DosageDialogProps {
    dosageRange: DoseRange;
  }

  const DosageDialog: React.FC<DosageDialogProps> = ({ dosageRange }) => {
    const [localDoseRange, setLocalDoseRange] =
      useState<DoseRange>(dosageRange);

    return (
      <div className="flex flex-col gap-3">
        <div className="font-medium text-base">{t("taper_titrate_dosage")}</div>
        <div>
          <Label className="mb-1.5">{t("start_dose")}</Label>
          <ComboboxQuantityInput
            quantity={localDoseRange.low}
            onChange={(value) => {
              if (value) {
                setLocalDoseRange((prev) => ({
                  ...prev,
                  low: value,
                  high: {
                    ...prev.high,
                    unit: value.unit || prev.high.unit,
                  },
                }));
              }
            }}
            disabled={disabled || isReadOnly}
            className="lg:max-w-[200px]"
          />
        </div>
        <div>
          <Label className="mb-1.5">{t("end_dose")}</Label>
          <ComboboxQuantityInput
            quantity={localDoseRange.high}
            onChange={(value) => {
              if (value) {
                setLocalDoseRange((prev) => ({
                  ...prev,
                  high: value,
                  low: {
                    ...prev.low,
                    unit: value.unit || prev.low.unit,
                  },
                }));
              }
            }}
            disabled={disabled || !localDoseRange.low.value || isReadOnly}
            className="lg:max-w-[200px]"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              handleUpdateDosageInstruction({
                dose_and_rate: undefined,
              });
              setShowDosageDialog(false);
            }}
          >
            {t("clear")}
          </Button>
          <Button
            onClick={() => {
              handleUpdateDosageInstruction({
                dose_and_rate: {
                  type: "ordered",
                  dose_range: localDoseRange,
                },
              });
              setShowDosageDialog(false);
            }}
            disabled={
              !localDoseRange.low.value ||
              !localDoseRange.high.value ||
              !localDoseRange.low.unit ||
              !localDoseRange.high.unit ||
              isReadOnly
            }
          >
            {t("save")}
          </Button>
        </div>
      </div>
    );
  };

  const handleDoseRangeClick = () => {
    const dose_quantity = dosageInstruction?.dose_and_rate?.dose_quantity;

    if (dose_quantity) {
      handleUpdateDosageInstruction({
        dose_and_rate: {
          type: "ordered",
          dose_quantity: undefined,
          dose_range: {
            low: dose_quantity,
            high: dose_quantity,
          },
        },
      });
    }
    setShowDosageDialog(true);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 border-b border-gray-200 hover:bg-gray-50/50 space-y-3 lg:space-y-0",
        showAdvancedFields
          ? "lg:grid-cols-[280px_220px_180px_160px_40px_300px_180px_250px_180px_160px_220px_280px_180px_48px]"
          : "lg:grid-cols-[280px_220px_180px_160px_40px_180px_48px]",
        {
          "opacity-40 pointer-events-none": disabled,
        },
      )}
    >
      {/* Medicine Name */}
      {desktopLayout && (
        <div className="lg:p-4 lg:px-2 lg:py-1 flex items-center justify-between lg:justify-start lg:col-span-1 lg:border-r border-gray-200 font-medium overflow-hidden text-sm">
          <span
            className={cn(
              "wrap-break-word line-clamp-2 hidden lg:block",
              disabled &&
                medication.status !== "entered_in_error" &&
                "line-through",
            )}
          >
            {displayMedicationName(medication)}
          </span>
        </div>
      )}
      {/* Dosage */}
      <div className="p-1 lg:py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("dosage")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <div>
          {dosageInstruction?.dose_and_rate?.dose_range ? (
            <Input
              readOnly
              value={formatDoseRange(
                dosageInstruction.dose_and_rate.dose_range,
              )}
              onClick={() => setShowDosageDialog(true)}
              className={cn(
                "h-9 text-sm cursor-pointer mb-3",
                hasError(MEDICATION_REQUEST_FIELDS.DOSAGE.key) &&
                  "border-red-500",
              )}
            />
          ) : (
            <>
              <div
                className={cn(
                  hasError(MEDICATION_REQUEST_FIELDS.DOSAGE.key) &&
                    "border border-red-500 rounded-md",
                )}
              >
                <ComboboxQuantityInput
                  quantity={dosageInstruction?.dose_and_rate?.dose_quantity}
                  onChange={(value) => {
                    if (value) {
                      handleUpdateDosageInstruction({
                        dose_and_rate: {
                          type: "ordered",
                          dose_quantity: value,
                          dose_range: undefined,
                        },
                      });
                    } else {
                      handleUpdateDosageInstruction({
                        dose_and_rate: undefined,
                      });
                    }
                  }}
                  disabled={disabled || isReadOnly}
                  className="lg:max-w-[200px]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-3 rounded-full hover:bg-transparent"
                  onClick={handleDoseRangeClick}
                  disabled={disabled || isReadOnly}
                >
                  +
                </Button>
              </div>
            </>
          )}
          <FieldError
            fieldKey={MEDICATION_REQUEST_FIELDS.DOSAGE.key}
            questionId={questionId}
            errors={errors}
            index={index}
          />
        </div>

        {dosageInstruction?.dose_and_rate?.dose_range &&
          (desktopLayout ? (
            <Popover open={showDosageDialog} onOpenChange={setShowDosageDialog}>
              <PopoverTrigger asChild>
                <div className="w-full" />
              </PopoverTrigger>
              <PopoverContent className="w-55 p-4" align="start">
                <DosageDialog
                  dosageRange={dosageInstruction.dose_and_rate.dose_range}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Dialog open={showDosageDialog} onOpenChange={setShowDosageDialog}>
              <DialogContent>
                <DosageDialog
                  dosageRange={dosageInstruction.dose_and_rate.dose_range}
                />
              </DialogContent>
            </Dialog>
          ))}
      </div>
      {/* Frequency */}
      <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("frequency")}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <MedicationTimingSelect
          timing={dosageInstruction?.timing}
          asNeeded={dosageInstruction?.as_needed_boolean}
          onTimingChange={(timing, asNeeded) => {
            handleUpdateDosageInstruction({
              as_needed_boolean: asNeeded,
              timing,
            });
          }}
          disabled={disabled || isReadOnly}
          hasError={hasError(MEDICATION_REQUEST_FIELDS.FREQUENCY.key)}
        />
        <FieldError
          fieldKey={MEDICATION_REQUEST_FIELDS.FREQUENCY.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>
      {/* Duration */}
      <div className="lg:px-2 p-1 lg:py-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">
          {t("duration")}
        </Label>
        <div
          className={cn(
            "flex gap-2",
            hasError(MEDICATION_REQUEST_FIELDS.DURATION.key) &&
              "border border-red-500 rounded-md p-1",
            dosageInstruction?.as_needed_boolean &&
              "opacity-50 bg-gray-100 rounded-md",
          )}
        >
          {dosageInstruction?.timing && (
            <Input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              min={0}
              value={
                isZero(dosageInstruction.timing.repeat.bounds_duration.value)
                  ? ""
                  : dosageInstruction.timing.repeat.bounds_duration?.value
              }
              onChange={(e) => {
                const value = e.target.value;
                if (!dosageInstruction.timing) return;
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: {
                        value: value,
                        unit: dosageInstruction.timing.repeat.bounds_duration
                          .unit,
                      },
                    },
                  },
                });
              }}
              disabled={
                disabled ||
                !dosageInstruction?.timing?.repeat ||
                dosageInstruction?.as_needed_boolean ||
                isReadOnly
              }
              className="h-9 text-base sm:text-sm"
            />
          )}
          <Select
            value={
              dosageInstruction?.timing?.repeat?.bounds_duration?.unit ??
              UCUM_TIME_UNITS[0]
            }
            onValueChange={(unit: (typeof UCUM_TIME_UNITS)[number]) => {
              if (dosageInstruction?.timing?.repeat) {
                const value =
                  dosageInstruction?.timing?.repeat?.bounds_duration?.value ??
                  0;
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: { value, unit },
                    },
                  },
                });
              }
            }}
            disabled={
              disabled ||
              !dosageInstruction?.timing?.repeat ||
              dosageInstruction?.as_needed_boolean ||
              isReadOnly
            }
          >
            <SelectTrigger
              className={cn(
                "h-9 text-sm w-full",
                dosageInstruction?.as_needed_boolean &&
                  "cursor-not-allowed bg-gray-50",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UCUM_TIME_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FieldError
          fieldKey={MEDICATION_REQUEST_FIELDS.DURATION.key}
          questionId={questionId}
          errors={errors}
          index={index}
        />
      </div>
      {/* Clickable expand/collapse bar column - Desktop only */}
      {desktopLayout && (
        <div
          className={cn(
            "lg:border-r border-gray-200 cursor-pointer transition-colors flex items-center justify-center",
            showAdvancedFields
              ? "bg-primary-50 hover:bg-primary-100"
              : "bg-gray-100 hover:bg-gray-200",
          )}
          onClick={onToggleAdvanced}
          title={
            showAdvancedFields
              ? t("hide_advanced_fields")
              : t("show_advanced_fields")
          }
        >
          {showAdvancedFields ? (
            <ChevronsDownUp className="h-4 w-4 text-primary-600 rotate-90" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 text-gray-500 rotate-90" />
          )}
        </div>
      )}
      {/* Advanced Fields - Desktop: inserted between bar and notes when expanded */}
      {showAdvancedFields && desktopLayout && (
        <>
          {/* Instructions */}
          <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
            {dosageInstruction?.as_needed_boolean ? (
              <div className="space-y-2">
                <ValueSetSelect
                  system="system-as-needed-reason"
                  value={dosageInstruction?.as_needed_for || null}
                  placeholder={t("select_prn_reason")}
                  onSelect={(value) => {
                    handleUpdateDosageInstruction({
                      as_needed_for: value || undefined,
                    });
                  }}
                  disabled={disabled || isReadOnly}
                />
                <InstructionsPopover
                  currentInstructions={currentInstructions}
                  removeInstruction={removeInstruction}
                  addInstruction={addInstruction}
                  isReadOnly={isReadOnly}
                  disabled={disabled}
                />
              </div>
            ) : (
              <InstructionsPopover
                currentInstructions={currentInstructions}
                removeInstruction={removeInstruction}
                addInstruction={addInstruction}
                isReadOnly={isReadOnly}
                disabled={disabled}
              />
            )}
          </div>
          {/* Route */}
          <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
            <ValueSetSelect
              system="system-route"
              value={dosageInstruction?.route}
              onSelect={(route) => handleUpdateDosageInstruction({ route })}
              placeholder={t("select_route")}
              disabled={disabled || isReadOnly}
            />
          </div>
          {/* Site */}
          <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
            <ValueSetSelect
              system="system-body-site"
              value={dosageInstruction?.site}
              onSelect={(site) => handleUpdateDosageInstruction({ site })}
              placeholder={t("select_site")}
              disabled={disabled || isReadOnly}
            />
          </div>
          {/* Method */}
          <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
            <ValueSetSelect
              system="system-administration-method"
              value={dosageInstruction?.method}
              onSelect={(method) => handleUpdateDosageInstruction({ method })}
              placeholder={t("select_method")}
              disabled={disabled || isReadOnly}
              count={20}
            />
          </div>
          {/* Intent */}
          <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
            <Select
              value={medication.intent}
              onValueChange={(value: MedicationRequestIntent) =>
                onUpdate?.({ intent: value })
              }
              disabled={disabled || isReadOnly}
            >
              <SelectTrigger className="h-9 text-sm capitalize">
                <SelectValue
                  className="capitalize"
                  placeholder={t("select_intent")}
                />
              </SelectTrigger>
              <SelectContent>
                {MEDICATION_REQUEST_INTENT.map((intent) => (
                  <SelectItem
                    key={intent}
                    value={intent}
                    className="capitalize"
                  >
                    {intent.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Authored On */}
          <div className="lg:px-1 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
            <CombinedDatePicker
              value={
                medication.authored_on
                  ? new Date(medication.authored_on)
                  : undefined
              }
              onChange={(date) =>
                onUpdate?.({ authored_on: date?.toISOString() })
              }
              disabled={disabled || isReadOnly}
              blockDate={(date) => date > new Date()}
            />
          </div>
          {/* Requester */}
          <div className="lg:px-1 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
            <UserSelector
              selected={medication.requester}
              onChange={(user) => {
                onUpdate?.({ requester: user });
              }}
              placeholder={t("select_requester")}
              facilityId={facilityId}
              disabled={disabled || isReadOnly}
            />
          </div>
        </>
      )}
      {/* Notes - Always visible on desktop, at the end before remove button */}
      <div className="lg:px-2 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden">
        <Label className="mb-1.5 block text-sm lg:hidden">{t("note")}</Label>
        <Input
          value={medication.note || ""}
          onChange={(e) => onUpdate?.({ note: e.target.value })}
          placeholder={t("additional_notes")}
          disabled={disabled}
          className="h-9 text-base sm:text-sm"
        />
      </div>

      {/* Mobile Advanced Fields - Collapsible section */}
      {!desktopLayout && (
        <div className="col-span-1 mt-2">
          <Collapsible
            open={showMobileAdvanced}
            onOpenChange={setShowMobileAdvanced}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("advanced_fields")}
                </span>
                {showMobileAdvanced ? (
                  <ChevronsDownUp className="h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Instructions */}
              <div className="p-1">
                <Label className="mb-1.5 block text-sm">
                  {t("instructions")}
                </Label>
                {dosageInstruction?.as_needed_boolean ? (
                  <div className="space-y-2">
                    <ValueSetSelect
                      system="system-as-needed-reason"
                      value={dosageInstruction?.as_needed_for || null}
                      placeholder={t("select_prn_reason")}
                      onSelect={(value) => {
                        handleUpdateDosageInstruction({
                          as_needed_for: value || undefined,
                        });
                      }}
                      disabled={disabled || isReadOnly}
                    />
                    <InstructionsPopover
                      currentInstructions={currentInstructions}
                      removeInstruction={removeInstruction}
                      addInstruction={addInstruction}
                      isReadOnly={isReadOnly}
                      disabled={disabled}
                    />
                  </div>
                ) : (
                  <InstructionsPopover
                    currentInstructions={currentInstructions}
                    removeInstruction={removeInstruction}
                    addInstruction={addInstruction}
                    isReadOnly={isReadOnly}
                    disabled={disabled}
                  />
                )}
              </div>
              {/* Route */}
              <div className="p-1">
                <Label className="mb-1.5 block text-sm">{t("route")}</Label>
                <ValueSetSelect
                  system="system-route"
                  value={dosageInstruction?.route}
                  onSelect={(route) => handleUpdateDosageInstruction({ route })}
                  placeholder={t("select_route")}
                  disabled={disabled || isReadOnly}
                />
              </div>
              {/* Site */}
              <div className="p-1">
                <Label className="mb-1.5 block text-sm">{t("site")}</Label>
                <ValueSetSelect
                  system="system-body-site"
                  value={dosageInstruction?.site}
                  onSelect={(site) => handleUpdateDosageInstruction({ site })}
                  placeholder={t("select_site")}
                  disabled={disabled || isReadOnly}
                />
              </div>
              {/* Method */}
              <div className="p-1">
                <Label className="mb-1.5 block text-sm">{t("method")}</Label>
                <ValueSetSelect
                  system="system-administration-method"
                  value={dosageInstruction?.method}
                  onSelect={(method) =>
                    handleUpdateDosageInstruction({ method })
                  }
                  placeholder={t("select_method")}
                  disabled={disabled || isReadOnly}
                  count={20}
                />
              </div>
              {/* Intent */}
              <div className="p-1">
                <Label className="mb-1.5 block text-sm">{t("intent")}</Label>
                <Select
                  value={medication.intent}
                  onValueChange={(value: MedicationRequestIntent) =>
                    onUpdate?.({ intent: value })
                  }
                  disabled={disabled || isReadOnly}
                >
                  <SelectTrigger className="h-9 text-sm capitalize">
                    <SelectValue
                      className="capitalize"
                      placeholder={t("select_intent")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICATION_REQUEST_INTENT.map((intent) => (
                      <SelectItem
                        key={intent}
                        value={intent}
                        className="capitalize"
                      >
                        {intent.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Authored On */}
              <div className="p-1">
                <Label className="mb-1.5 block text-sm">
                  {t("authored_on")}
                </Label>
                <CombinedDatePicker
                  value={
                    medication.authored_on
                      ? new Date(medication.authored_on)
                      : undefined
                  }
                  onChange={(date) =>
                    onUpdate?.({ authored_on: date?.toISOString() })
                  }
                  disabled={disabled || isReadOnly}
                  blockDate={(date) => date > new Date()}
                />
              </div>
              {/* Requester */}
              <div className="p-1">
                <Label className="mb-1.5 block text-sm">{t("requester")}</Label>
                <UserSelector
                  selected={medication.requester}
                  onChange={(user) => {
                    onUpdate?.({ requester: user });
                  }}
                  placeholder={t("select_requester")}
                  facilityId={facilityId}
                  disabled={disabled || isReadOnly}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Actions Dropdown */}
      <div className="hidden lg:flex lg:px-2 lg:py-1 items-center justify-center sticky right-0 bg-white shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.15)] w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="size-8"
              aria-label={t("medication_actions")}
            >
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onAddToTemplate && (
              <>
                <DropdownMenuItem onClick={() => onAddToTemplate(medication)}>
                  {t("add_to_template")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              {t("remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// Re-export reverseFrequencyOption from MedicationTimingSelect for backwards compatibility
export { reverseFrequencyOption } from "@/components/Medicine/MedicationTimingSelect";
