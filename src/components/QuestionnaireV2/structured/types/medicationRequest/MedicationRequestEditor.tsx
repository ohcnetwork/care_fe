import { useQuery } from "@tanstack/react-query";
import {
  BookmarkIcon,
  ChevronsDownUp,
  ChevronsUpDown,
  Pipette,
  PlusIcon,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useQueryParams } from "raviger";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import { DosageFrequencyInput } from "@/components/Medicine/DosageFrequencyInput";
import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import { DurationInput } from "@/components/Medicine/DurationInput";
import { FormattedDosage } from "@/components/Medicine/FormattedDosage";
import InstructionsPopover from "@/components/Medicine/InstructionsPopover";
import { formatDuration, formatFrequency } from "@/components/Medicine/utils";
import { EntitySelectionDrawer } from "@/components/Questionnaire/EntitySelectionDrawer";
import ManageResponseTemplatesSheet from "@/components/Questionnaire/ManageResponseTemplatesSheet";
import MedicationValueSetSelect from "@/components/Questionnaire/MedicationValueSetSelect";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
import { StructuredFieldError } from "@/components/QuestionnaireV2/structured/core/StructuredFieldError";
import {
  type StructuredColumn,
  type StructuredColumnContext,
  StructuredList,
  type StructuredRowAction,
} from "@/components/QuestionnaireV2/structured/core/StructuredList";
import type {
  BaselineRow,
  RowId,
} from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import { applyTemplateItems } from "@/components/QuestionnaireV2/structured/shared/responseTemplates/applyTemplateItems";
import { useAddToTemplate } from "@/components/QuestionnaireV2/structured/shared/responseTemplates/useAddToTemplate";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import { Avatar } from "@/components/Common/Avatar";
import UserSelector from "@/components/Common/UserSelector";

import useAuthUser from "@/hooks/useAuthUser";
import useBreakpoints from "@/hooks/useBreakpoints";

import type { Code } from "@/types/base/code/code";
import {
  displayMedicationName,
  getTimingBounds,
  INACTIVE_MEDICATION_STATUSES,
  MEDICATION_REQUEST_INTENT,
  type MedicationRequestDosageInstruction,
  type MedicationRequestIntent,
  type MedicationRequestRead,
  type MedicationRequestTemplateSpec,
  timingBoundsToRepeat,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import type { MedicationStatementRead } from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import type { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import type { QuestionnaireResponseTemplateReadSpec } from "@/types/questionnaire/questionnaireResponseTemplate";
import type { UserReadMinimal } from "@/types/user/user";
import { round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";

import { DosageDialog } from "./DosageDialog";
import {
  buildMedicationRequestForTemplate,
  dosageInstructionFieldKeys,
  maxDosageInstructionCount,
  MEDICATION_REQUEST_SOFT_DELETE,
  type MedicationRequestRow,
  medicationRowFromTemplate,
  newMedicationRowFromCode,
  newMedicationRowFromProduct,
  projectValues,
  toBaselineRows,
} from "./model";

/**
 * Three-state baseline:
 *  - no `prescriptionId`: nothing to prefetch — returns `[]` immediately,
 *    never `undefined`, so every added medication is a genuine `add`
 *    against an honestly empty baseline;
 *  - `prescriptionId` present, query in flight or errored: `undefined`
 *    (the ordinary loading window);
 *  - resolved: the converted rows.
 */
function useMedicationBaseline(
  patientId: string | undefined,
  encounterId: string | undefined,
  facilityId: string | undefined,
  prescriptionId: string | undefined,
  currentUser: UserReadMinimal,
): {
  baseline: readonly BaselineRow<MedicationRequestRow>[] | undefined;
  totalCount: number | undefined;
} {
  const { data } = useQuery({
    queryKey: ["medication_requests", patientId, encounterId, prescriptionId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId! },
      queryParams: {
        encounter: encounterId,
        prescription: prescriptionId,
        ordering: "-modified_date",
        limit: 100,
        facility: facilityId,
      },
    }),
    enabled: !!patientId && !!prescriptionId,
  });

  const baseline = useMemo(() => {
    if (!prescriptionId) return [];
    if (!data) return undefined;
    return toBaselineRows(data.results, currentUser);
  }, [prescriptionId, data, currentUser]);

  return { baseline, totalCount: data?.count };
}

function formatDoseRange(range?: {
  low?: { value?: string };
  high?: { value?: string; unit?: { display?: string } };
}): string {
  if (!range?.high?.value) return "";
  return `${round(range.low?.value ?? "0")} → ${round(range.high.value)} ${range.high.unit?.display ?? ""}`;
}

const isInactiveMedication = (row: MedicationRequestRow) =>
  (INACTIVE_MEDICATION_STATUSES as readonly string[]).includes(
    row.status ?? "",
  );

/** Merges a patch onto ONE dosage instruction by index — the sole mutation
 *  primitive every dose/frequency/duration/instructions/route/site/method
 *  cell below routes through, so "add/remove instruction" and "edit slot N"
 *  can never desync on how the array is rebuilt. */
function useUpdateInstruction(
  ctx: StructuredColumnContext<MedicationRequestRow>,
) {
  return useCallback(
    (index: number, patch: Partial<MedicationRequestDosageInstruction>) => {
      ctx.update({
        dosage_instruction: ctx.row.row.dosage_instruction.map(
          (instruction, i) =>
            i === index ? { ...instruction, ...patch } : instruction,
        ),
      });
    },
    // ctx.update / ctx.row change identity across renders (see
    // StructuredList's caveat on `update`'s stability); the callback is
    // cheap to rebuild, so listing them (rather than the whole `ctx` the
    // rule asks for) is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx.update, ctx.row],
  );
}

// ---------------------------------------------------------------------------
// Dosage / Frequency / Duration cells — the genuinely custom sub-model
// ---------------------------------------------------------------------------

function DoseCell({
  ctx,
  questionId,
}: {
  ctx: StructuredColumnContext<MedicationRequestRow>;
  questionId: string;
}) {
  const { t } = useTranslation();
  const [showDosageDialog, setShowDosageDialog] = useState<number | null>(null);
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const updateInstruction = useUpdateInstruction(ctx);
  const isReadOnly = !!ctx.row.row.id;
  const instructions = ctx.row.row.dosage_instruction;
  const disabled = ctx.disabled || isReadOnly;

  const handleAddInstruction = () =>
    ctx.update({
      dosage_instruction: [...instructions, { as_needed_boolean: false }],
    });
  const handleRemoveInstruction = (index: number) => {
    if (instructions.length <= 1) return;
    ctx.update({
      dosage_instruction: instructions.filter((_, i) => i !== index),
    });
  };
  const handleDoseRangeClick = (index: number) => {
    const instruction = instructions[index] ?? {};
    const doseQuantity = instruction.dose_and_rate?.dose_quantity;
    if (doseQuantity) {
      updateInstruction(index, {
        dose_and_rate: {
          type: "ordered",
          dose_quantity: undefined,
          dose_range: { low: doseQuantity, high: doseQuantity },
        },
      });
    }
    setShowDosageDialog(index);
  };

  return (
    <div className="space-y-1">
      {instructions.map((instruction, index) => {
        const fieldKey = `dosage_instruction[${index}].dose`;
        const doseInvalid = ctx.errors.some((e) => e.field_key === fieldKey);
        const doseRange = instruction.dose_and_rate?.dose_range;
        const dosageDialog = doseRange && (
          <DosageDialog
            dosageRange={doseRange}
            disabled={disabled}
            onSave={(range) => {
              updateInstruction(index, {
                dose_and_rate: { type: "ordered", dose_range: range },
              });
              setShowDosageDialog(null);
            }}
            onClear={() => {
              updateInstruction(index, { dose_and_rate: undefined });
              setShowDosageDialog(null);
            }}
          />
        );
        return (
          <div key={index}>
            {index > 0 && (
              <div className="border-t border-dashed border-gray-300 my-1" />
            )}
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                {doseRange ? (
                  <Input
                    readOnly
                    value={formatDoseRange(doseRange)}
                    onClick={() => setShowDosageDialog(index)}
                    aria-label={`${ctx.ariaLabel} ${index + 1}`}
                    className={cn(
                      "h-9 text-sm cursor-pointer",
                      doseInvalid && "border-red-500",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      doseInvalid && "rounded-md border border-red-500",
                    )}
                  >
                    <ComboboxQuantityInput
                      quantity={instruction.dose_and_rate?.dose_quantity}
                      onChange={(value) =>
                        updateInstruction(index, {
                          dose_and_rate: value
                            ? {
                                type: "ordered",
                                dose_quantity: value,
                                dose_range: undefined,
                              }
                            : undefined,
                        })
                      }
                      disabled={disabled}
                      className="lg:max-w-[200px]"
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="size-3 rounded-full text-gray-500"
                onClick={() => handleDoseRangeClick(index)}
                disabled={disabled}
                title={t("taper_titrate_dosage")}
              >
                <Pipette className="size-3" />
              </button>
              {instructions.length > 1 && !isReadOnly && (
                <button
                  type="button"
                  className="shrink-0 text-gray-500 hover:text-red-500"
                  onClick={() => handleRemoveInstruction(index)}
                  disabled={ctx.disabled}
                  title={t("remove_dosage_step")}
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
            <StructuredFieldError
              id={`${fieldKey}-error`}
              questionId={questionId}
              rowId={ctx.row.rowId}
              fieldKeys={[fieldKey]}
              errors={ctx.errors}
            />
            {doseRange &&
              (desktopLayout ? (
                <Popover
                  open={showDosageDialog === index}
                  onOpenChange={(open) =>
                    setShowDosageDialog(open ? index : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <div className="w-full" />
                  </PopoverTrigger>
                  <PopoverContent className="w-55 p-4" align="start">
                    {dosageDialog}
                  </PopoverContent>
                </Popover>
              ) : (
                <Dialog
                  open={showDosageDialog === index}
                  onOpenChange={(open) =>
                    setShowDosageDialog(open ? index : null)
                  }
                >
                  <DialogContent>{dosageDialog}</DialogContent>
                </Dialog>
              ))}
          </div>
        );
      })}
      {/* Lives in the always-rendered dosage cell so an instruction can be
          added from mobile too — the medicine-name column is desktop-only. */}
      {!isReadOnly && (
        <button
          type="button"
          className="text-[10px] text-gray-400 hover:text-primary-600 transition-colors"
          onClick={handleAddInstruction}
          disabled={ctx.disabled}
        >
          <span className="inline-flex items-center gap-0.5">
            <PlusIcon className="size-3" />
            {t("add_dosage_step")}
          </span>
        </button>
      )}
    </div>
  );
}

function FrequencyCell({
  ctx,
  questionId,
}: {
  ctx: StructuredColumnContext<MedicationRequestRow>;
  questionId: string;
}) {
  const updateInstruction = useUpdateInstruction(ctx);
  const isReadOnly = !!ctx.row.row.id;
  const instructions = ctx.row.row.dosage_instruction;
  return (
    <div className="space-y-1">
      {instructions.map((instruction, index) => {
        const fieldKey = `dosage_instruction[${index}].frequency`;
        const invalid = ctx.errors.some((e) => e.field_key === fieldKey);
        return (
          <div key={index}>
            {index > 0 && (
              <div className="border-t border-dashed border-gray-300 my-1" />
            )}
            <DosageFrequencyInput
              dosageInstruction={instruction}
              onDosageInstructionChange={(updates) =>
                updateInstruction(index, updates)
              }
              disabled={ctx.disabled || isReadOnly}
              hasError={invalid}
            />
            <StructuredFieldError
              id={`${fieldKey}-error`}
              questionId={questionId}
              rowId={ctx.row.rowId}
              fieldKeys={[fieldKey]}
              errors={ctx.errors}
            />
          </div>
        );
      })}
    </div>
  );
}

function DurationCell({
  ctx,
  questionId,
}: {
  ctx: StructuredColumnContext<MedicationRequestRow>;
  questionId: string;
}) {
  const updateInstruction = useUpdateInstruction(ctx);
  const isReadOnly = !!ctx.row.row.id;
  const instructions = ctx.row.row.dosage_instruction;
  return (
    <div className="space-y-1">
      {instructions.map((instruction, index) => {
        const fieldKey = `dosage_instruction[${index}].duration`;
        const invalid = ctx.errors.some((e) => e.field_key === fieldKey);
        return (
          <div key={index}>
            {index > 0 && (
              <div className="border-t border-dashed border-gray-300 my-1" />
            )}
            <DurationInput
              value={getTimingBounds(instruction.timing?.repeat)}
              onChange={(bounds) => {
                if (instruction.timing) {
                  updateInstruction(index, {
                    timing: {
                      ...instruction.timing,
                      repeat: {
                        ...instruction.timing.repeat,
                        ...timingBoundsToRepeat(bounds),
                      },
                    },
                  });
                } else {
                  updateInstruction(index, {
                    timing: {
                      repeat: {
                        frequency: 1,
                        period: "1",
                        period_unit: "d",
                        ...timingBoundsToRepeat(bounds),
                      },
                    },
                  });
                }
              }}
              disabled={
                ctx.disabled || instruction.as_needed_boolean || isReadOnly
              }
              hasError={invalid}
            />
            <StructuredFieldError
              id={`${fieldKey}-error`}
              questionId={questionId}
              rowId={ctx.row.rowId}
              fieldKeys={[fieldKey]}
              errors={ctx.errors}
            />
          </div>
        );
      })}
    </div>
  );
}

function InstructionsCell({
  ctx,
}: {
  ctx: StructuredColumnContext<MedicationRequestRow>;
}) {
  const { t } = useTranslation();
  const updateInstruction = useUpdateInstruction(ctx);
  const isReadOnly = !!ctx.row.row.id;
  const instructions = ctx.row.row.dosage_instruction;
  return (
    <div className="space-y-1">
      {instructions.map((instruction, index) => {
        const current = instruction.additional_instruction ?? [];
        const addInstruction = (code: Code) => {
          if (current.some((item) => item.code === code.code)) {
            toast.warning(t("item_already_selected", { name: code.display }));
            return;
          }
          updateInstruction(index, {
            additional_instruction: [...current, code],
          });
        };
        const removeInstruction = (code: string) =>
          updateInstruction(index, {
            additional_instruction: current.filter(
              (item) => item.code !== code,
            ),
          });
        return (
          <div key={index}>
            {index > 0 && (
              <div className="border-t border-dashed border-gray-300 my-1" />
            )}
            {instruction.as_needed_boolean && (
              <ValueSetSelect
                system="system-as-needed-reason"
                value={instruction.as_needed_for || null}
                placeholder={t("select_prn_reason")}
                onSelect={(value) =>
                  updateInstruction(index, {
                    as_needed_for: value || undefined,
                  })
                }
                disabled={ctx.disabled || isReadOnly}
                aria-label={`${t("select_prn_reason")} ${index + 1}`}
                className="mb-1"
              />
            )}
            <InstructionsPopover
              currentInstructions={current}
              removeInstruction={removeInstruction}
              addInstruction={addInstruction}
              isReadOnly={isReadOnly}
              disabled={ctx.disabled}
            />
          </div>
        );
      })}
    </div>
  );
}

/** `route` / `site` / `method` — a plain `ValueSetSelect` looped over every
 *  dosage instruction; the only differences between the three are the
 *  ValueSet `system` and which field they write. */
function ValueSetLoopCell({
  ctx,
  system,
  field,
  ariaLabel,
  placeholder,
  count,
}: {
  ctx: StructuredColumnContext<MedicationRequestRow>;
  system: string;
  field: "route" | "site" | "method";
  ariaLabel: string;
  placeholder: string;
  count?: number;
}) {
  const updateInstruction = useUpdateInstruction(ctx);
  const isReadOnly = !!ctx.row.row.id;
  const instructions = ctx.row.row.dosage_instruction;
  return (
    <div className="space-y-1">
      {instructions.map((instruction, index) => (
        <div key={index}>
          {index > 0 && (
            <div className="border-t border-dashed border-gray-300 my-1" />
          )}
          <ValueSetSelect
            system={system}
            value={instruction[field]}
            onSelect={(value) => updateInstruction(index, { [field]: value })}
            placeholder={placeholder}
            disabled={ctx.disabled || isReadOnly}
            aria-label={`${ariaLabel} ${index + 1}`}
            count={count}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The editor
// ---------------------------------------------------------------------------

/**
 * Resolves a template's stored data into a fresh row, fetching the product
 * knowledge by its stored SLUG (a template never stores the product UUID —
 * the slug stays resolvable across product re-versions).
 *
 * A failed/absent product lookup is tolerated, not a per-item failure: the
 * medication still resolves to a row without its product.
 * `applyTemplateItems`'s per-item try/catch is only for a `resolve` that
 * throws.
 */
async function resolveTemplateMedicationRequest(
  templateMedication: MedicationRequestTemplateSpec,
  currentUser: UserReadMinimal,
): Promise<MedicationRequestRow> {
  const requestedProductSlug =
    typeof templateMedication.requested_product === "string"
      ? templateMedication.requested_product
      : undefined;
  let productKnowledge: ProductKnowledgeBase | undefined;
  if (requestedProductSlug) {
    try {
      productKnowledge = await query(
        productKnowledgeApi.retrieveProductKnowledge,
        { pathParams: { slug: requestedProductSlug } },
      )({ signal: new AbortController().signal });
    } catch (error) {
      console.warn(
        `Failed to fetch product knowledge for slug: ${requestedProductSlug}`,
        error,
      );
    }
  }
  return medicationRowFromTemplate(
    templateMedication,
    productKnowledge,
    currentUser,
  );
}

export function MedicationRequestEditor({
  question,
  disabled,
  errors,
  patientId,
  encounterId,
  facilityId,
  questionnaireSlug,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const currentUser = useAuthUser() as UserReadMinimal;
  const desktopLayout = useBreakpoints({ lg: true, default: false });
  const [{ prescription: prescriptionId }] = useQueryParams<{
    prescription?: string;
  }>();

  const { baseline, totalCount } = useMedicationBaseline(
    patientId,
    encounterId,
    facilityId,
    prescriptionId,
    currentUser,
  );

  const { data: prescription } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId: patientId!, id: prescriptionId! },
    }),
    enabled: !!patientId && !!prescriptionId,
  });

  const list = useStructuredRows({
    questionId: question.id,
    baseline,
    projectValues,
    softDelete: MEDICATION_REQUEST_SOFT_DELETE,
    disabled,
  });

  // Removal is gated behind a confirmation dialog: removing a prescribed
  // medication is destructive (an existing row flips to `entered_in_error`
  // rather than vanishing), so a single menu click must not do it silently.
  const [pendingRemoveRowId, setPendingRemoveRowId] = useState<RowId | null>(
    null,
  );
  const pendingRemoveRow = list.rows.find(
    (row) => row.rowId === pendingRemoveRowId,
  );

  // The hook derives the `template_data` key from `itemKey`, keeping template
  // storage keys aligned with this structured type.
  const { dialog: addToTemplateDialog, openAddToTemplate } =
    useAddToTemplate<MedicationRequestRow>({
      questionnaireSlug,
      facilityId,
      itemKey: "medication_request",
      itemType: "medication",
      toTemplateSpec: buildMedicationRequestForTemplate,
      itemDisplayName: (row) => displayMedicationName(row),
      messages: {
        addedToTemplate: "medication_added_to_template",
        createdWithItem: "template_created_with_medication",
      },
    });

  const handleApplyTemplate = useCallback(
    async (template: QuestionnaireResponseTemplateReadSpec) => {
      const rows = await applyTemplateItems(
        template.template_data?.medication_request,
        (templateMedication) =>
          resolveTemplateMedicationRequest(templateMedication, currentUser),
        template.name,
        {
          empty: "template_has_no_medications",
          allFailed: "failed_to_apply_template",
          partial: "template_partially_applied",
          success: "template_applied_medications",
        },
      );
      // ONE `addRows` call, never a loop of `addRow` — two mutator calls in
      // one synchronous handler would both read the same stale `edits`
      // snapshot (`useStructuredRows.ts`'s own documented CAVEAT), silently
      // dropping every row but the last.
      list.addRows(rows);
    },
    [currentUser, list],
  );

  const handleAddSingleFromTemplate = useCallback(
    async (templateMedication: MedicationRequestTemplateSpec) => {
      try {
        const row = await resolveTemplateMedicationRequest(
          templateMedication,
          currentUser,
        );
        list.addRow(row);
      } catch {
        toast.error(t("failed_to_add_medication"));
      }
    },
    [currentUser, list, t],
  );

  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [newMedicationInSheet, setNewMedicationInSheet] =
    useState<MedicationRequestRow | null>(null);

  const handleSelectCode = useCallback(
    (code: Code) => {
      const row = newMedicationRowFromCode(code, currentUser);
      if (desktopLayout) list.addRow(row);
      else setNewMedicationInSheet(row);
    },
    [desktopLayout, currentUser, list],
  );

  const handleSelectProduct = useCallback(
    (product: ProductKnowledgeBase) => {
      const row = newMedicationRowFromProduct(product, currentUser);
      if (desktopLayout) list.addRow(row);
      else setNewMedicationInSheet(row);
    },
    [desktopLayout, currentUser, list],
  );

  const handleConfirmSheet = useCallback(() => {
    if (!newMedicationInSheet) return;
    list.addRow(newMedicationInSheet);
    setNewMedicationInSheet(null);
  }, [newMedicationInSheet, list]);

  const handleAddHistorical = useCallback(
    (selected: (MedicationRequestRead | MedicationStatementRead)[]) => {
      const rows = selected.map((record): MedicationRequestRow => {
        if ("dosage_instruction" in record) {
          const {
            id: _id,
            requested_product,
            prescription: _prescription,
            ...rest
          } = record;
          return {
            ...rest,
            requested_product: requested_product?.id,
            requested_product_internal: requested_product,
            requester: currentUser,
            medication: requested_product?.id ? undefined : rest.medication,
          } as MedicationRequestRow;
        }
        return {
          ...newMedicationRowFromCode(record.medication, currentUser),
          note: record.note,
        };
      });
      list.addRows(rows);
    },
    [currentUser, list],
  );

  // Prescription note. Read from and write to the first added row only. A
  // synchronous loop of `list.updateRow` calls would reuse the same stale
  // `edits` closure and lose all but the last write; `toRequests` fans the
  // first note out to all new rows with a complete view of the edit log.
  const firstAddedRow = list.rows.find((row) => row.origin === "added");
  const prescriptionNote = firstAddedRow?.row.create_prescription?.note ?? "";
  const handleUpdateNote = useCallback(
    (note: string) => {
      if (!firstAddedRow) return;
      list.updateRow(firstAddedRow.rowId, {
        create_prescription: {
          status:
            firstAddedRow.row.create_prescription?.status ??
            PrescriptionStatus.active,
          alternate_identifier:
            firstAddedRow.row.create_prescription?.alternate_identifier ?? "",
          note: note || undefined,
        },
      });
    },
    [firstAddedRow, list],
  );

  const maxInstructions = useMemo(
    () => maxDosageInstructionCount(list.rows),
    [list.rows],
  );
  const doseFieldKeys = useMemo(
    () => dosageInstructionFieldKeys(maxInstructions, "dose"),
    [maxInstructions],
  );
  const frequencyFieldKeys = useMemo(
    () => dosageInstructionFieldKeys(maxInstructions, "frequency"),
    [maxInstructions],
  );
  const durationFieldKeys = useMemo(
    () => dosageInstructionFieldKeys(maxInstructions, "duration"),
    [maxInstructions],
  );

  const baseColumns: StructuredColumn<MedicationRequestRow>[] = useMemo(
    () => [
      {
        key: "medicine",
        header: t("medicine"),
        width: "minmax(12rem, 1fr)",
        mobileHidden: true,
        render: ({ row }) => {
          const inactive = isInactiveMedication(row.row);
          return (
            <span
              className={cn(
                "line-clamp-2 wrap-break-word text-sm font-medium",
                inactive && row.row.status !== "ended" && "line-through",
              )}
              title={displayMedicationName(row.row)}
            >
              {displayMedicationName(row.row)}
            </span>
          );
        },
      },
      {
        key: "dosage",
        header: t("dosage"),
        required: true,
        width: "minmax(11rem, 1fr)",
        errorFieldKeys: doseFieldKeys,
        ownsErrorDisplay: true,
        render: (ctx) => <DoseCell ctx={ctx} questionId={question.id} />,
      },
      {
        key: "frequency",
        header: t("frequency"),
        required: true,
        width: "minmax(9rem, 1fr)",
        errorFieldKeys: frequencyFieldKeys,
        ownsErrorDisplay: true,
        render: (ctx) => <FrequencyCell ctx={ctx} questionId={question.id} />,
      },
      {
        key: "duration",
        header: t("duration"),
        width: "minmax(9rem, 1fr)",
        errorFieldKeys: durationFieldKeys,
        ownsErrorDisplay: true,
        render: (ctx) => <DurationCell ctx={ctx} questionId={question.id} />,
      },
    ],
    [t, doseFieldKeys, frequencyFieldKeys, durationFieldKeys, question.id],
  );

  const advancedColumns: StructuredColumn<MedicationRequestRow>[] = useMemo(
    () => [
      {
        key: "instructions",
        header: t("instructions"),
        width: "minmax(12rem, 1fr)",
        render: (ctx) => <InstructionsCell ctx={ctx} />,
      },
      {
        key: "route",
        header: t("route"),
        width: "9rem",
        render: (ctx) => (
          <ValueSetLoopCell
            ctx={ctx}
            system="system-route"
            field="route"
            ariaLabel={t("route")}
            placeholder={t("select_route")}
          />
        ),
      },
      {
        key: "site",
        header: t("site"),
        width: "9rem",
        render: (ctx) => (
          <ValueSetLoopCell
            ctx={ctx}
            system="system-body-site"
            field="site"
            ariaLabel={t("site")}
            placeholder={t("select_site")}
          />
        ),
      },
      {
        key: "method",
        header: t("method"),
        width: "9rem",
        render: (ctx) => (
          <ValueSetLoopCell
            ctx={ctx}
            system="system-administration-method"
            field="method"
            ariaLabel={t("method")}
            placeholder={t("select_method")}
            count={20}
          />
        ),
      },
      {
        key: "intent",
        header: t("intent"),
        width: "10rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Select
            value={row.row.intent}
            onValueChange={(value: MedicationRequestIntent) =>
              update({ intent: value })
            }
            disabled={cellDisabled || !!row.row.id}
          >
            <SelectTrigger {...controlProps} className="h-9 text-sm">
              <SelectValue placeholder={t("select_intent")} />
            </SelectTrigger>
            <SelectContent>
              {MEDICATION_REQUEST_INTENT.map((intent) => (
                <SelectItem key={intent} value={intent}>
                  {t(`medication_request_intent__${intent}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "authored_on",
        header: t("authored_on"),
        width: "11rem",
        // CombinedDatePicker (src/components/ui/) accepts neither `id` nor
        // `aria-label`. A native date input is not used here (unlike
        // allergy/diagnosis) because this column needs the `blockDate`
        // future-date blocking the primitive owns.
        render: ({ row, update, disabled: cellDisabled }) => (
          <CombinedDatePicker
            value={
              row.row.authored_on ? new Date(row.row.authored_on) : undefined
            }
            onChange={(date) => update({ authored_on: date?.toISOString() })}
            disabled={cellDisabled || !!row.row.id}
            blockDate={(date) => date > new Date()}
          />
        ),
      },
      {
        key: "requester",
        header: t("requester"),
        width: "12rem",
        render: ({ row, update, disabled: cellDisabled }) => (
          <UserSelector
            selected={row.row.requester}
            onChange={(user) => update({ requester: user })}
            placeholder={t("select_requester")}
            facilityId={facilityId}
            disabled={cellDisabled || !!row.row.id}
            aria-label={t("requester")}
          />
        ),
      },
    ],
    [t, facilityId],
  );

  const noteColumn: StructuredColumn<MedicationRequestRow> = useMemo(
    () => ({
      key: "note",
      header: t("note"),
      width: "minmax(10rem, 1fr)",
      render: ({ row, update, disabled: cellDisabled, controlProps }) => (
        <Input
          {...controlProps}
          value={row.row.note ?? ""}
          onChange={(e) => update({ note: e.target.value })}
          placeholder={t("additional_notes")}
          disabled={cellDisabled}
          className="h-9 text-base sm:text-sm"
        />
      ),
    }),
    [t],
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      ...(showAdvancedFields ? advancedColumns : []),
      noteColumn,
    ],
    [baseColumns, advancedColumns, showAdvancedFields, noteColumn],
  );

  const addMedicationPlaceholder = t("add_medication", {
    count: list.rows.length + 1,
  });

  return (
    <div className="space-y-4">
      {addToTemplateDialog}

      <ConfirmActionDialog
        open={pendingRemoveRowId !== null}
        onOpenChange={(open) => !open && setPendingRemoveRowId(null)}
        title={t("remove_medication")}
        description={t("remove_medication_confirmation", {
          medication: pendingRemoveRow
            ? displayMedicationName(pendingRemoveRow.row)
            : "",
        })}
        onConfirm={() => {
          if (pendingRemoveRowId) list.removeRow(pendingRemoveRowId);
          setPendingRemoveRowId(null);
        }}
        confirmText={t("remove")}
        variant="destructive"
      />

      <StructuredDroppedRowsNotice
        droppedEdits={list.droppedEdits}
        rowLabel={displayMedicationName}
      />

      {!prescriptionId && (
        <div className="flex flex-wrap items-center justify-end gap-2">
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
                    render: (instructions) =>
                      instructions?.length ? (
                        <DosageInstructionList
                          instructions={instructions}
                          renderItem={(di) => (
                            <div className="flex flex-col">
                              <FormattedDosage instruction={di} fallback="" />
                              {formatFrequency(di) && (
                                <span>{formatFrequency(di)}</span>
                              )}
                            </div>
                          )}
                          gap="sm"
                        />
                      ) : (
                        "-"
                      ),
                  },
                  {
                    key: "dosage_instruction",
                    label: t("duration"),
                    render: (instructions) =>
                      instructions?.length ? (
                        <DosageInstructionList
                          instructions={instructions}
                          renderItem={(di) => formatDuration(di) || "-"}
                          gap="sm"
                        />
                      ) : (
                        "-"
                      ),
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
                    render: (
                      instructions: MedicationRequestDosageInstruction[],
                    ) =>
                      instructions
                        ?.flatMap(
                          (di) =>
                            di.additional_instruction?.map((i) => i.display) ??
                            [],
                        )
                        .filter(Boolean)
                        .join(", ") || undefined,
                  },
                  { key: "note", label: t("notes"), render: (note) => note },
                ],
                queryKey: ["medication_requests", patientId ?? ""],
                queryFn: async (
                  limit: number,
                  offset: number,
                  signal: AbortSignal,
                ) =>
                  query(medicationRequestApi.list, {
                    pathParams: { patientId: patientId! },
                    queryParams: {
                      limit,
                      offset,
                      status:
                        "active,on_hold,draft,unknown,ended,completed,cancelled",
                    },
                  })({ signal }),
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
                ],
                expandableFields: [
                  { key: "note", label: t("notes"), render: (note) => note },
                ],
                queryKey: ["medication_statements", patientId ?? ""],
                queryFn: async (
                  limit: number,
                  offset: number,
                  signal: AbortSignal,
                ) =>
                  query(medicationStatementApi.list, {
                    pathParams: { patientId: patientId! },
                    queryParams: {
                      limit,
                      offset,
                      status:
                        "active,on_hold,completed,stopped,unknown,not_taken,intended",
                    },
                  })({ signal }),
              },
            ]}
            buttonLabel={t("medication_history")}
            onAddSelected={handleAddHistorical}
            disableAPI={!patientId}
          />
          {questionnaireSlug && (
            <ManageResponseTemplatesSheet
              questionnaireSlug={questionnaireSlug}
              facilityId={facilityId}
              onTemplateSelect={handleApplyTemplate}
              onMedicationSelect={handleAddSingleFromTemplate}
              disabled={disabled}
              currentMedications={list.rows.map((row) => row.row)}
              key_filter="medication_request"
            />
          )}
        </div>
      )}

      {!!totalCount && totalCount > 100 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            {t("medication_list_truncated_warning", {
              shown: 100,
              total: totalCount,
            })}
          </AlertDescription>
        </Alert>
      )}

      {list.rows.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFields((value) => !value)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="size-3.5" />
            {showAdvancedFields
              ? t("hide_advanced_fields")
              : t("show_advanced_fields")}
            {showAdvancedFields ? (
              <ChevronsDownUp className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5" />
            )}
          </Button>
        </div>
      )}

      <StructuredList
        questionId={question.id}
        label={t("structured_type__medication_request")}
        rows={list.rows}
        columns={columns}
        errors={errors}
        disabled={disabled}
        onUpdateRow={list.updateRow}
        onRemoveRow={(rowId) => setPendingRemoveRowId(rowId)}
        // "Add to Template" shares the overflow menu with Remove. Only
        // offered when this fill session has a questionnaire slug to scope
        // templates to.
        rowActions={
          questionnaireSlug
            ? (row): StructuredRowAction[] => [
                {
                  key: "add_to_template",
                  label: t("add_to_template"),
                  icon: BookmarkIcon,
                  onSelect: () => openAddToTemplate(row.row),
                },
              ]
            : undefined
        }
        rowTitle={(row) => displayMedicationName(row.row)}
        rowSummary={(row) =>
          row.row.dosage_instruction
            .map((di) => {
              const parts: string[] = [];
              const dq = di.dose_and_rate?.dose_quantity;
              if (dq)
                parts.push(`${round(dq.value)} ${dq.unit?.display ?? ""}`);
              const dr = di.dose_and_rate?.dose_range;
              if (dr) parts.push(formatDoseRange(dr));
              const freq = formatFrequency(di);
              if (freq) parts.push(freq);
              const duration = formatDuration(di);
              if (duration) parts.push(duration);
              return parts.join(" · ");
            })
            .join(" | ")
        }
        rowDisabled={(row) => isInactiveMedication(row.row)}
        addControl={
          !prescriptionId ? (
            desktopLayout ? (
              <div className="max-w-4xl flex gap-1">
                <MedicationValueSetSelect
                  placeholder={addMedicationPlaceholder}
                  onSelect={handleSelectCode}
                  onProductSelect={handleSelectProduct}
                  disabled={disabled}
                  title={t("select_medication")}
                />
              </div>
            ) : (
              <EntitySelectionDrawer
                open={!!newMedicationInSheet}
                onOpenChange={(open) => {
                  if (!open) setNewMedicationInSheet(null);
                }}
                system="system-medication"
                entityType="medication"
                searchPostFix=" clinical drug"
                disabled={disabled}
                onEntitySelected={handleSelectCode}
                onProductEntitySelected={handleSelectProduct}
                onConfirm={handleConfirmSheet}
                placeholder={addMedicationPlaceholder}
                enableProduct
              >
                {newMedicationInSheet && (
                  <StagedMedicationFields
                    row={newMedicationInSheet}
                    onUpdate={(patch) =>
                      setNewMedicationInSheet((current) =>
                        current ? { ...current, ...patch } : current,
                      )
                    }
                    disabled={disabled}
                  />
                )}
              </EntitySelectionDrawer>
            )
          ) : undefined
        }
      />

      {(prescriptionId || list.rows.length > 0) && (
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
              onChange={(e) => handleUpdateNote(e.target.value)}
              disabled={disabled || !firstAddedRow}
              className="min-h-[80px]"
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The staged mobile add-flow's initial fields — dose + frequency, the two
 * REQUIRED slots, so a clinician on a phone can satisfy validation before
 * ever leaving the drawer. Route/site/method/instructions/intent/
 * authored_on/requester stay reachable by expanding the newly-added row in
 * the main list afterward, through the same `StructuredList` columns as every
 * other row. The drawer intentionally avoids a second copy of the full dosage
 * sub-editor for a staged, not-yet-committed row.
 */
function StagedMedicationFields({
  row,
  onUpdate,
  disabled,
}: {
  row: MedicationRequestRow;
  onUpdate: (patch: Partial<MedicationRequestRow>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const instruction = row.dosage_instruction[0] ?? { as_needed_boolean: false };

  const updateFirstInstruction = (
    patch: Partial<MedicationRequestDosageInstruction>,
  ) => {
    const [first, ...rest] = row.dosage_instruction.length
      ? row.dosage_instruction
      : [{ as_needed_boolean: false }];
    onUpdate({ dosage_instruction: [{ ...first, ...patch }, ...rest] });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("dosage")}</label>
        <ComboboxQuantityInput
          quantity={instruction.dose_and_rate?.dose_quantity}
          onChange={(value) =>
            updateFirstInstruction({
              dose_and_rate: value
                ? {
                    type: "ordered",
                    dose_quantity: value,
                    dose_range: undefined,
                  }
                : undefined,
            })
          }
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("frequency")}</label>
        <DosageFrequencyInput
          dosageInstruction={instruction}
          onDosageInstructionChange={updateFirstInstruction}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
