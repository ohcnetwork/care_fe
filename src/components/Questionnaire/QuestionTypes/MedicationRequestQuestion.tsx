import { MinusCircledIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import {
  AlertTriangle,
  ChevronsDownUp,
  ChevronsUpDown,
  CopyPlus,
  MoreVerticalIcon,
  SlidersHorizontal,
} from "lucide-react";
import { useQueryParams } from "raviger";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";

import { ComboboxQuantityInput } from "@/components/Common/ComboboxQuantityInput";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import UserSelector from "@/components/Common/UserSelector";
import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import { DosageFrequencyInput } from "@/components/Medicine/DosageFrequencyInput";
import { DurationInput } from "@/components/Medicine/DurationInput";
import InstructionsPopover from "@/components/Medicine/InstructionsPopover";
import { formatFrequency } from "@/components/Medicine/utils";
import { AddToTemplateDialog } from "@/components/Questionnaire/AddToTemplateDialog";
import { EntitySelectionDrawer } from "@/components/Questionnaire/EntitySelectionDrawer";
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
  buildTimingForTextDosage,
  displayMedicationName,
  DoseRange,
  formatDurationLabel,
  INACTIVE_MEDICATION_STATUSES,
  MEDICATION_REQUEST_INTENT,
  MedicationRequestCreate,
  MedicationRequestDosageInstruction,
  MedicationRequestIntent,
  MedicationRequestRead,
  MedicationRequestTemplateSpec,
  parseMedicationStringToRequest,
  sumManSlots,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
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
import { round } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";

import { filterStructuredQuestionnaireSlugs } from "@/components/Questionnaire/data/StructuredFormData";
import ManageResponseTemplatesSheet from "@/components/Questionnaire/ManageResponseTemplatesSheet";
import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Question } from "@/types/questionnaire/question";

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
    dirty: true, // Mark as dirty so it gets sent to the API
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
  question: Question;
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
        dosageInstruction?.timing ||
        dosageInstruction?.as_needed_boolean ||
        dosageInstruction?.text
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
  question,
}: MedicationRequestQuestionProps) {
  const authUser = useAuthUser();
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacilitySilently();
  const currentUser = useAuthUser() as UserReadMinimal;
  const isPreview = patientId === "preview";
  const [{ prescription: prescriptionId }] = useQueryParams<{
    prescription?: string;
  }>();
  const medications =
    (questionnaireResponse.values?.[0]?.value as MedicationRequestCreate[]) ||
    [];

  const { data: patientMedications } = useQuery({
    queryKey: ["medication_requests", patientId, encounterId, prescriptionId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        prescription: prescriptionId,
        ordering: "-modified_date",
        limit: 100,
        facility: facilityId,
      },
    }),
    enabled: !isPreview && !!prescriptionId,
  });

  const { data: prescription } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
    }),
    enabled: !isPreview && !!prescriptionId,
  });

  useEffect(() => {
    if (prescriptionId && patientMedications?.results) {
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
  }, [patientMedications, prescriptionId]);

  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState<
    number | null
  >(null);

  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(
    null,
  );
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const desktopLayout = useBreakpoints({ lg: true, default: false });

  // Derive prescription note from new medications (those without an ID)
  const prescriptionNote =
    medications.find((m) => !m.id)?.create_prescription?.note || "";

  // Update prescription note on all new medications
  const updatePrescriptionNote = (note: string) => {
    const updatedMedications = medications.map((medication) =>
      !medication.id && medication.create_prescription
        ? {
            ...medication,
            create_prescription: {
              ...medication.create_prescription,
              note: note || undefined,
            },
          }
        : medication,
    );

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: updatedMedications }],
      questionnaireResponse.question_id,
    );
  };

  const [newMedicationInSheet, setNewMedicationInSheet] =
    useState<MedicationRequestCreate | null>(null);

  // Add to template state
  const [medicationToAddToTemplate, setMedicationToAddToTemplate] =
    useState<MedicationRequestCreate | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    string[] | null
  >(null);

  const queryClient = useQueryClient();

  // Query for templates
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
        facility_organizations: selectedOrganizations || [],
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
        facility_organizations: selectedOrganizations || [],
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

    if (productKnowledge.product_type === "consumable") {
      initialDetails.dosage_instruction = [
        {
          ...initialDetails.dosage_instruction[0],
          as_needed_boolean: true,
          timing: undefined,
        },
      ];
    }

    if (desktopLayout) {
      addNewMedication(initialDetails);
    } else {
      setNewMedicationInSheet(initialDetails);
    }
  };

  const addNewMedication = (medication: MedicationRequestCreate) => {
    const newMedications: MedicationRequestCreate[] = [
      ...medications,
      {
        ...medication,
        dirty: true, // Mark new medication as dirty
        create_prescription: {
          status: PrescriptionStatus.active,
          alternate_identifier: "", // Will be set by handler
          note: prescriptionNote || undefined,
        },
      },
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
          create_prescription: {
            status: PrescriptionStatus.active,
            alternate_identifier: "",
            note: prescriptionNote || undefined,
          },
        } as MedicationRequestCreate;
      } else {
        const statement = record as MedicationStatementRead;
        return {
          ...parseMedicationStringToRequest(currentUser, statement.medication),
          authored_on: new Date().toISOString(),
          note: statement.note,
          requester: currentUser,
          dirty: true, // Mark as dirty since it's being added as new
          create_prescription: {
            status: PrescriptionStatus.active,
            alternate_identifier: "",
            note: prescriptionNote || undefined,
          },
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

  const handleApplyRequesterToAll = (user: UserReadMinimal | undefined) => {
    const newMedications = medications.map((medication) => ({
      ...medication,
      requester: user || currentUser,
      dirty: true,
    }));

    updateQuestionnaireResponseCB(
      [{ type: "medication_request", value: newMedications }],
      questionnaireResponse.question_id,
    );
    toast.success(t("requester_applied_to_all"));
  };

  // Handler for adding a single medication from a template
  const handleAddSingleMedication = async (med: MedicationRequestCreate) => {
    const medicationToAdd = await fetchProductAndBuildMedication(
      med,
      currentUser,
    );

    const newMedications: MedicationRequestCreate[] = [
      ...medications,
      {
        ...medicationToAdd,
        create_prescription: {
          status: PrescriptionStatus.active,
          alternate_identifier: "",
          note: prescriptionNote || undefined,
        },
      },
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
        ...medicationsWithProductKnowledge.map((med) => ({
          ...med,
          create_prescription: {
            status: PrescriptionStatus.active,
            alternate_identifier: "",
            note: prescriptionNote || undefined,
          },
        })),
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
      <div className="flex justify-between items-center flex-wrap">
        <QuestionLabel question={question} />

        {/* Add to Template Dialog */}
        <AddToTemplateDialog
          open={!!medicationToAddToTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setMedicationToAddToTemplate(null);
              setTemplateSearchQuery("");
              setIsCreatingNewTemplate(false);
              setNewTemplateName("");
              setSelectedOrganizations(null);
            }
          }}
          item={medicationToAddToTemplate}
          itemDisplayName={(med) => displayMedicationName(med)}
          itemType="medication"
          isCreatingNewTemplate={isCreatingNewTemplate}
          setIsCreatingNewTemplate={setIsCreatingNewTemplate}
          newTemplateName={newTemplateName}
          setNewTemplateName={setNewTemplateName}
          templateSearchQuery={templateSearchQuery}
          setTemplateSearchQuery={setTemplateSearchQuery}
          templatesData={templatesData}
          isLoadingTemplates={isLoadingTemplates}
          onCreateNewTemplate={handleCreateNewTemplateWithMedication}
          onSelectTemplate={handleSelectTemplate}
          isCreating={createTemplateWithMedicationMutation.isPending}
          isAdding={addToTemplateMutation.isPending}
          facilityId={facilityId}
          selectedOrganizations={selectedOrganizations}
          onSelectedOrganizationsChange={setSelectedOrganizations}
        />

        {!prescriptionId && (
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
                          formatFrequency(instructions[0]) || "-";
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
                      render: (status: string) =>
                        t(`medication_status__${status}`),
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
                                  {expandedMedicationIndex !== index &&
                                    (() => {
                                      const freq =
                                        formatFrequency(dosageInstruction);
                                      return (
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

                                          {freq && ` · ${freq}`}

                                          {dosageInstruction?.timing?.repeat
                                            ?.bounds_duration?.value &&
                                            ` · ${formatDurationLabel(dosageInstruction.timing.repeat.bounds_duration)}`}
                                        </div>
                                      );
                                    })()}
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
                                  onCopyRequesterToAll={
                                    handleApplyRequesterToAll
                                  }
                                  index={index}
                                  questionId={questionnaireResponse.question_id}
                                  errors={errors}
                                  facilityId={facilityId}
                                  showAdvancedFields={true}
                                  showCopyRequester={medications.length > 1}
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
                          onCopyRequesterToAll={handleApplyRequesterToAll}
                          index={index}
                          questionId={questionnaireResponse.question_id}
                          errors={errors}
                          facilityId={facilityId}
                          showAdvancedFields={showAdvancedFields}
                          onToggleAdvanced={() =>
                            setShowAdvancedFields(!showAdvancedFields)
                          }
                          showCopyRequester={medications.length > 1}
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

      {!prescriptionId &&
        (!desktopLayout ? (
          <>
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
          </>
        ) : (
          <div className="max-w-4xl flex gap-1">
            <MedicationValueSetSelect
              placeholder={addMedicationPlaceholder}
              onSelect={handleAddMedication}
              onProductSelect={handleAddProductMedication}
              disabled={disabled}
              title={t("select_medication")}
            />
          </div>
        ))}

      {/* Prescription Note Field - show when editing, or when creating with at least one medication */}
      {(prescriptionId || medications.length > 0) && (
        <div className="max-w-4xl space-y-2">
          <Label htmlFor="prescription-note">{t("note")}</Label>
          {prescriptionId ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md min-h-[80px] text-sm text-gray-700 whitespace-pre-wrap">
              {prescription?.note || (
                <span className="text-gray-400 italic">{t("no_notes")}</span>
              )}
            </div>
          ) : (
            <Textarea
              id="prescription-note"
              placeholder={t("prescription_note_placeholder")}
              value={prescriptionNote}
              onChange={(e) => updatePrescriptionNote(e.target.value)}
              disabled={disabled}
              className="min-h-[80px]"
            />
          )}
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
  onCopyRequesterToAll?: (requester: UserReadMinimal) => void;
  index: number;
  questionId: string;
  errors?: QuestionValidationError[];
  facilityId?: string;
  showAdvancedFields?: boolean;
  onToggleAdvanced?: () => void;
  showCopyRequester?: boolean;
}

const MedicationRequestGridRow: React.FC<MedicationRequestGridRowProps> = ({
  medication,
  disabled,
  onUpdate,
  onRemove,
  onAddToTemplate,
  onCopyRequesterToAll,
  index,
  questionId,
  errors,
  facilityId,
  showAdvancedFields = false,
  onToggleAdvanced,
  showCopyRequester = false,
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
        <DosageFrequencyInput
          dosageInstruction={dosageInstruction}
          onDosageInstructionChange={handleUpdateDosageInstruction}
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
        <DurationInput
          value={dosageInstruction?.timing?.repeat?.bounds_duration}
          onChange={(duration) => {
            if (!duration) {
              // Clear duration
              if (dosageInstruction?.timing) {
                handleUpdateDosageInstruction({
                  timing: {
                    ...dosageInstruction.timing,
                    repeat: {
                      ...dosageInstruction.timing.repeat,
                      bounds_duration: { value: "0", unit: "d" },
                    },
                  },
                });
              }
              return;
            }

            if (dosageInstruction?.timing) {
              // Timing exists -- update bounds_duration
              handleUpdateDosageInstruction({
                timing: {
                  ...dosageInstruction.timing,
                  repeat: {
                    ...dosageInstruction.timing.repeat,
                    bounds_duration: duration,
                  },
                },
              });
            } else {
              // No timing yet -- create a minimal timing with just duration.
              // Only infer frequency from M-A-N text patterns (e.g. "1-1/2-0").
              // For non-M-A-N text like "STAT", create timing with just duration.
              if (
                dosageInstruction?.text &&
                sumManSlots(dosageInstruction.text) !== null
              ) {
                handleUpdateDosageInstruction({
                  timing: buildTimingForTextDosage(
                    dosageInstruction.text,
                    duration,
                  ),
                });
              } else {
                handleUpdateDosageInstruction({
                  timing: {
                    repeat: {
                      frequency: 1,
                      period: "1",
                      period_unit: "d",
                      bounds_duration: duration,
                    },
                  },
                });
              }
            }
          }}
          disabled={
            disabled || dosageInstruction?.as_needed_boolean || isReadOnly
          }
          hasError={hasError(MEDICATION_REQUEST_FIELDS.DURATION.key)}
        />
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
          <div className="lg:px-1 lg:py-1 p-1 lg:border-r border-gray-200 overflow-hidden flex gap-1">
            <UserSelector
              selected={medication.requester}
              onChange={(user) => {
                onUpdate?.({ requester: user });
              }}
              placeholder={t("select_requester")}
              facilityId={facilityId}
              disabled={disabled || isReadOnly}
            />
            {showCopyRequester && medication.requester && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopyRequesterToAll?.(medication.requester!)}
                disabled={disabled || isReadOnly}
                title={t("copy_requester_to_all")}
              >
                <CopyPlus className="size-4" />
              </Button>
            )}
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
                <div className="flex gap-1">
                  <UserSelector
                    selected={medication.requester}
                    onChange={(user) => {
                      onUpdate?.({ requester: user });
                    }}
                    placeholder={t("select_requester")}
                    facilityId={facilityId}
                    disabled={disabled || isReadOnly}
                  />
                  {showCopyRequester && medication.requester && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onCopyRequesterToAll?.(medication.requester!)
                      }
                      disabled={disabled || isReadOnly}
                      title={t("copy_requester_to_all")}
                    >
                      <CopyPlus className="size-4" />
                    </Button>
                  )}
                </div>
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
                <DropdownMenuItem
                  onClick={() => onAddToTemplate(medication)}
                  className="cursor-pointer"
                >
                  {t("add_to_template")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={onRemove}
              className="text-red-500 cursor-pointer"
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
