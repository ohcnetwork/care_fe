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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ConditionOperationSummary,
  getConditionDiscriminatorValue,
} from "@/types/base/condition/condition";
import {
  getRangeSummary,
  getValuesetSummary,
  InterpretationType,
  QualifiedRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import { AlertTriangle, Edit, Ruler, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QualifiedRangeEditor } from "./QualifiedRangeEditor";

export function ObservationInterpretation<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  qualifiedRanges,
  setQualifiedRanges,
  disabled = false,
  onClearRequest,
  conflictMessage,
  name = "qualified_ranges",
  onCancel,
  onSheetOpen,
  facilityId,
}: {
  form: UseFormReturn<TFieldValues>;
  qualifiedRanges: QualifiedRange[];
  setQualifiedRanges: (value: QualifiedRange[]) => void;
  disabled?: boolean;
  onClearRequest?: () => void;
  conflictMessage?: string;
  name?: string;
  onSheetOpen?: () => void;
  onCancel?: () => void;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedInterpretationType, setSelectedInterpretationType] =
    useState<InterpretationType>(InterpretationType.ranges);
  const [showTypeChangeWarning, setShowTypeChangeWarning] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] =
    useState<InterpretationType | null>(null);
  const [recentlyChangedRanges, setRecentlyChangedRanges] = useState<
    Set<number>
  >(new Set());
  const [editedRange, setEditedRange] = useState<QualifiedRange | null>(null);

  // Detect current interpretation type from existing data
  useEffect(() => {
    if (qualifiedRanges?.length > 0) {
      const firstRange = qualifiedRanges[0];
      const hasRanges = firstRange.ranges?.length > 0;
      const hasValuesets =
        (firstRange.valueset_interpretation?.length || 0) > 0;

      if (hasRanges && !hasValuesets) {
        setSelectedInterpretationType(InterpretationType.ranges);
      } else if (hasValuesets && !hasRanges) {
        setSelectedInterpretationType(InterpretationType.valuesets);
      }
    }
  }, [qualifiedRanges]);

  const handleSheetState = (open: boolean) => {
    setIsSheetOpen(open);
    if (open) {
      onSheetOpen?.();
    }
  };

  const hasExistingData = () => {
    return qualifiedRanges.some(
      (range) =>
        (range.conditions?.length ?? 0) > 0 ||
        range.ranges.length > 0 ||
        (range.valueset_interpretation?.length || 0) > 0,
    );
  };

  // TODO: For handling type change (Valueset support/BE not ready yet)
  const _handleTypeChange = (newType: InterpretationType) => {
    if (newType === selectedInterpretationType) return;

    if (hasExistingData() && qualifiedRanges.length > 1) {
      setPendingTypeChange(newType);
      setShowTypeChangeWarning(true);
    } else {
      setSelectedInterpretationType(newType);
      if (editedRange) {
        const updatedRange = {
          ...editedRange,
          _interpretation_type: newType,
          ranges:
            newType === InterpretationType.ranges ? editedRange?.ranges : [],
          valueset_interpretation:
            newType === InterpretationType.valuesets
              ? editedRange?.valueset_interpretation
              : [],
        };
        setEditedRange(updatedRange);
      }
    }
  };

  const confirmTypeChange = () => {
    if (pendingTypeChange) {
      setSelectedInterpretationType(pendingTypeChange);

      // Track which ranges were changed
      const changedIndices = new Set<number>();

      const updatedRanges = qualifiedRanges.map((range, index) => {
        const wasChanged = range._interpretation_type !== pendingTypeChange;
        if (wasChanged) {
          changedIndices.add(index);
        }

        return {
          ...range,
          _interpretation_type: pendingTypeChange,
          // Clear the data that doesn't match the new type
          ranges:
            pendingTypeChange === InterpretationType.ranges ? range.ranges : [],
          valueset_interpretation:
            pendingTypeChange === InterpretationType.valuesets
              ? range.valueset_interpretation
              : [],
        };
      });
      setQualifiedRanges(updatedRanges);

      form.setValue(name as any, updatedRanges as any, {
        shouldValidate: true,
      });

      setRecentlyChangedRanges(changedIndices);

      // Update editedRange if we're currently editing a range that was affected
      if (editedRange && editedRange.id !== undefined) {
        const editingIndex = editedRange.id;
        const updatedEditedRange = updatedRanges[editingIndex];
        setEditedRange(updatedEditedRange);
      }
    }
    setShowTypeChangeWarning(false);
    setPendingTypeChange(null);
  };

  const cancelTypeChange = () => {
    setShowTypeChangeWarning(false);
    setPendingTypeChange(null);
  };

  const wouldBeAffectedByTypeChange = (
    range: QualifiedRange,
    index: number,
  ) => {
    // Show highlighting for ranges that were recently changed by type change
    return recentlyChangedRanges.has(index);
  };

  const handleAddInterpretation = () => {
    const newRange: QualifiedRange = {
      id: qualifiedRanges?.length || 0,
      conditions: [],
      ranges:
        selectedInterpretationType === InterpretationType.ranges
          ? [
              {
                interpretation: {
                  display: "",
                  highlight: false,
                  code: undefined,
                },
                min: undefined,
                max: undefined,
              },
            ]
          : [],
      valueset_interpretation:
        selectedInterpretationType === InterpretationType.valuesets
          ? [
              {
                interpretation: {
                  display: "",
                  highlight: false,
                  code: undefined,
                },
                valueset: "",
              },
            ]
          : [],
      _interpretation_type: selectedInterpretationType,
    };
    setEditedRange(newRange);
    handleSheetState(true);
  };

  const handleEditInterpretation = (index: number) => {
    handleSheetState(true);
    const sourceRange = qualifiedRanges[index];
    const rangeToEdit: QualifiedRange = {
      ...sourceRange,
      id: index,
      conditions: sourceRange.conditions?.map((condition) => ({
        ...condition,
      })),
      ranges: sourceRange.ranges?.map((range) => ({
        ...range,
        interpretation: { ...range.interpretation },
      })),
      valueset_interpretation: sourceRange.valueset_interpretation?.map(
        (valuesetInterpretation) => ({
          ...valuesetInterpretation,
          interpretation: { ...valuesetInterpretation.interpretation },
        }),
      ),
      default_interpretation: sourceRange.default_interpretation
        ? { ...sourceRange.default_interpretation }
        : undefined,
    };
    setEditedRange(rangeToEdit);
    setSelectedInterpretationType(rangeToEdit._interpretation_type);

    // Clear highlighting for this range when user starts editing
    if (recentlyChangedRanges.has(index)) {
      const newRecentlyChanged = new Set(recentlyChangedRanges);
      newRecentlyChanged.delete(index);
      setRecentlyChangedRanges(newRecentlyChanged);
    }
  };

  const handleRemoveInterpretation = (index: number) => {
    const updatedRanges = qualifiedRanges.filter((_, i) => i !== index);
    setQualifiedRanges(updatedRanges);

    form.setValue(name as any, updatedRanges as any);

    const newRecentlyChanged = new Set<number>();
    recentlyChangedRanges.forEach((changedIndex) => {
      if (changedIndex < index) {
        newRecentlyChanged.add(changedIndex);
      } else if (changedIndex > index) {
        newRecentlyChanged.add(changedIndex - 1);
      }
    });
    setRecentlyChangedRanges(newRecentlyChanged);
  };

  const handleSaveInterpretation = async () => {
    if (editedRange && editedRange.id !== undefined) {
      const editingIndex = editedRange.id;
      let newRanges = [...qualifiedRanges];
      if (editingIndex >= newRanges.length) {
        newRanges = [...newRanges, editedRange];
      } else {
        newRanges[editingIndex] = editedRange;
      }
      newRanges = [
        ...newRanges.map((r) => ({
          ...r,
          conditions: r.conditions?.map((condition) => ({
            ...condition,
            _conditionType: getConditionDiscriminatorValue(
              condition.metric,
              condition.operation,
            ),
          })),
        })),
      ];
      setQualifiedRanges(newRanges);

      form.setValue(name as any, newRanges as any);
      const isValid = await form.trigger();

      if (!isValid) {
        return;
      }

      // Clear highlighting for this range when user saves
      if (recentlyChangedRanges.has(editingIndex)) {
        const newRecentlyChanged = new Set(recentlyChangedRanges);
        newRecentlyChanged.delete(editingIndex);
        setRecentlyChangedRanges(newRecentlyChanged);
      }
    }
    handleSheetState(false);
    setEditedRange(null);
  };

  const handleCancelEdit = () => {
    onCancel?.();
    handleSheetState(false);
    setEditedRange(null);
    form.clearErrors(`${name}.${editedRange?.id || 0}` as any);
  };

  const getInterpretationSummary = (range: QualifiedRange, index: number) => {
    const rangeCount = range.ranges?.length || 0;
    const conditionCount = range.conditions?.length ?? 0;
    const valuesetCount = range.valueset_interpretation?.length || 0;
    const hasDefault = !!range.default_interpretation;

    const rangeSummary = range.ranges?.map((r, i) => {
      return <span key={`range-${i}`}>{getRangeSummary(r)}</span>;
    });
    const valuesetSummary = range.valueset_interpretation?.map(
      (valueset, i) => (
        <span key={`valueset-${i}`}>{getValuesetSummary(valueset)}</span>
      ),
    );

    return (
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center size-6 rounded-full bg-gray-900 text-white text-xs font-medium shrink-0">
            {index + 1}
          </span>
          {range.title && (
            <span className="text-sm font-medium text-gray-900">
              {range.title}
            </span>
          )}
          {hasDefault && (
            <span className="inline-flex items-center rounded-md border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">
              {t("default_interpretation")} {t("enabled")}
            </span>
          )}
        </div>
        {(conditionCount > 0 || rangeCount > 0 || valuesetCount > 0) && (
          <div className="flex flex-col gap-1 sm:pl-8 text-xs text-gray-500">
            {range.conditions?.map((condition, i) => (
              <div key={`condition-${i}`} className="text-gray-600">
                <ConditionOperationSummary condition={condition} shortDisplay />
              </div>
            ))}
            {rangeSummary}
            {valuesetSummary}
          </div>
        )}
      </div>
    );
  };

  const handleEditRange = (
    range: QualifiedRange,
    field: keyof QualifiedRange | undefined,
    value: any,
  ) => {
    if (field) {
      const updatedRange = {
        ...range,
        [field]: value,
      };
      setEditedRange(updatedRange);
    } else {
      setEditedRange(range);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white rounded-md p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-700">
          {t("observation_interpretation")} ({qualifiedRanges?.length})
        </h3>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddInterpretation}
          >
            {t("add_interpretation")}
          </Button>
        )}
      </div>

      {disabled && conflictMessage && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              <p className="text-sm text-amber-800">{conflictMessage}</p>
            </div>
            <div className="flex items-center gap-2 justify-center">
              {onClearRequest && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearRequest}
                  className="mt-2 text-amber-700 hover:text-amber-800 hover:bg-amber-200 bg-amber-100"
                >
                  {t("clear_conflicting_interpretations")}
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {qualifiedRanges?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Ruler className="size-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            {t("no_interpretations_configured")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {qualifiedRanges.map((range, index) => {
            const errors = form.getFieldState(
              `${name}.${index}` as any,
              form.formState,
            ).error;
            return (
              <div
                key={index}
                className={cn(
                  "group flex flex-col sm:flex-row gap-3 items-start p-3 rounded-lg border transition-colors",
                  wouldBeAffectedByTypeChange(range, index)
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50",
                  errors && "border-red-400 bg-red-50/50",
                )}
              >
                {getInterpretationSummary(range, index)}
                <div className="flex flex-col gap-0.5 shrink-0 w-full sm:w-auto">
                  {wouldBeAffectedByTypeChange(range, index) && (
                    <span className="text-xs text-red-500 mb-1">
                      {t("type_changed_values_need_to_be_updated")}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 self-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-gray-400 hover:text-gray-700"
                      onClick={() => handleEditInterpretation(index)}
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-gray-400 hover:text-red-600"
                      onClick={() => handleRemoveInterpretation(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={handleSheetState}>
        <SheetContent className="sm:max-w-3xl flex flex-col">
          <SheetHeader>
            <SheetTitle>{t("add_edit_interpretation")}</SheetTitle>
            <SheetDescription>{t("configure_interpretation")}</SheetDescription>
          </SheetHeader>

          {editedRange && (
            <QualifiedRangeEditor
              form={form}
              editedRange={editedRange}
              setEditedRange={handleEditRange}
              onSave={handleSaveInterpretation}
              onCancel={handleCancelEdit}
              interpretationType={selectedInterpretationType}
              fieldName={`${name}.${editedRange.id || 0}`}
              facilityId={facilityId}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={showTypeChangeWarning}
        onOpenChange={setShowTypeChangeWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              {t("change_interpretation_type")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("changing_interpretation_type_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelTypeChange}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTypeChange}
              className={buttonVariants({ variant: "destructive" })}
            >
              {t("continue_and_clear")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
