import { GENDER_TYPES } from "@/common/constants";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";
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
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AgeOperationEqualityValue,
  AgeOperationInRangeValue,
  Condition,
  CONDITION_AGE_VALUE_TYPES,
  ConditionOperation,
  ConditionOperationInRangeValue,
  ConditionOperationSummary,
  extractTagInformation,
  getConditionDiscriminatorValue,
  getConditionValue,
  getDefaultCondition,
  Metrics,
  TagOperationValue,
} from "@/types/base/condition/condition";
import {
  CustomValueSet,
  getRangeSummary,
  getValuesetSummary,
  Interpretation,
  InterpretationType,
  NumericRange,
  QualifiedRange,
} from "@/types/base/qualifiedRange/qualifiedRange";
import { ENCOUNTER_CLASS } from "@/types/emr/encounter/encounter";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Edit,
  Highlighter,
  Plus,
  Ruler,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

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
    const rangeCount = range.ranges.length;
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
          {qualifiedRanges?.map((range, index) => {
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
              //handleTypeChange={handleTypeChange}
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

function QualifiedRangeEditor<TFieldValues extends FieldValues = FieldValues>({
  form,
  editedRange,
  setEditedRange,
  onSave,
  onCancel,
  interpretationType,
  //handleTypeChange,
  fieldName,
  facilityId,
}: {
  form: UseFormReturn<TFieldValues>;
  editedRange: QualifiedRange;
  setEditedRange: (
    range: QualifiedRange,
    field?: keyof QualifiedRange,
    value?: any,
  ) => void;
  onSave: () => void;
  onCancel: () => void;
  interpretationType: InterpretationType;
  //handleTypeChange: (newType: InterpretationType) => void;
  fieldName: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();

  const handleSetConditions = (value: Condition[]) => {
    setEditedRange(editedRange, "conditions", value);
  };

  const handleSetRanges = (value: NumericRange[]) => {
    setEditedRange(editedRange, "ranges", value);
  };

  const customValueSetInterpretations =
    editedRange.valueset_interpretation || [];

  const handleSetCustomValuesetInterpretations = (value: CustomValueSet[]) => {
    setEditedRange(editedRange, "valueset_interpretation", value);
  };

  const handleSave = () => {
    onSave();
  };

  const isDisabled =
    (interpretationType === InterpretationType.ranges &&
      editedRange.ranges.length === 0) ||
    (interpretationType === InterpretationType.valuesets &&
      (editedRange.valueset_interpretation || []).length === 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto py-2 px-0.5">
        <FormField
          control={form.control}
          name={`${fieldName}.title` as any}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  value={editedRange.title ?? ""}
                  placeholder={t("interpretation_title_placeholder")}
                  className="h-10 text-base font-medium border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                  onChange={(e) =>
                    setEditedRange(editedRange, "title", e.target.value)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ConditionComponent
          conditions={editedRange.conditions ?? []}
          setConditions={handleSetConditions}
          form={form}
          fieldName={`${fieldName}.conditions`}
          facilityId={facilityId}
        />
        {interpretationType === InterpretationType.ranges ? (
          <NumericRangeComponent
            form={form}
            ranges={editedRange.ranges}
            setRanges={handleSetRanges}
            fieldName={fieldName}
          />
        ) : (
          <CustomValueSetInterpretationComponent
            form={form}
            valuesetInterpretations={customValueSetInterpretations}
            setValuesetInterpretations={handleSetCustomValuesetInterpretations}
            fieldName={fieldName}
          />
        )}
        <DefaultInterpretationComponent
          form={form}
          defaultInterpretation={editedRange.default_interpretation}
          setDefaultInterpretation={(value) =>
            setEditedRange(editedRange, "default_interpretation", value)
          }
          fieldName={`${fieldName}.default_interpretation`}
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 mt-auto border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          {t("cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isDisabled}
          className="w-full sm:w-auto"
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
}

export function RenderConditionInput({
  condition,
  index,
  handleSetValue,
  handleSetValueType,
  form,
  fieldName,
  facilityId,
}: {
  condition: Condition;
  index: number;
  handleSetValue: (
    value:
      | string
      | ConditionOperationInRangeValue
      | AgeOperationEqualityValue
      | TagOperationValue,
    index: number,
  ) => void;
  handleSetValueType: (value: string, index: number) => void;
  form: UseFormReturn<any>;
  fieldName: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const operation = condition.operation;
  const value =
    "value" in condition ? condition.value : { min: undefined, max: undefined };
  const { tagIds, tagResource } = extractTagInformation(
    value,
    condition.metric,
  );
  const tagQueries = useTagConfigs({
    ids: tagIds,
    disabled: operation !== ConditionOperation.has_tag,
  });
  switch (condition.metric) {
    case "patient_gender": {
      if (operation === ConditionOperation.equality) {
        return (
          <FormField
            control={form.control}
            name={`${fieldName}.value` as any}
            render={() => (
              <FormItem>
                <FormControl>
                  <Select
                    value={condition.value as string}
                    onValueChange={(value) => {
                      handleSetValue(value, index);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_a_value")} />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_TYPES.map((gender) => (
                        <SelectItem key={gender.id} value={gender.id}>
                          {t(`GENDER__${gender.id}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
      break;
    }
    case "patient_age": {
      function AgeTypeSelector() {
        const valueType =
          typeof value === "object" && value !== null && "value_type" in value
            ? (value.value_type as string)
            : "years";
        return (
          <FormField
            control={form.control}
            name={`${fieldName}.value.value_type` as any}
            render={() => (
              <FormItem className="flex-1">
                <FormControl>
                  <Select
                    value={valueType}
                    onValueChange={(value) => {
                      handleSetValueType(value, index);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_a_value")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_AGE_VALUE_TYPES.map((age) => (
                        <SelectItem key={age} value={age}>
                          {t(`condition_age_value_type__${age}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
      if (operation === ConditionOperation.equality) {
        const currentValueType =
          typeof value === "object" && value !== null && "value_type" in value
            ? value.value_type
            : "years";
        const currentValue =
          typeof value === "object" && value !== null && "value" in value
            ? value.value
            : undefined;
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <FormField
              control={form.control}
              name={`${fieldName}.value.value` as any}
              render={() => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("value")}
                      value={currentValue}
                      onChange={(e) => {
                        handleSetValue(
                          {
                            value:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            value_type: currentValueType,
                          } as AgeOperationEqualityValue,
                          index,
                        );
                      }}
                      className="sm:w-fit h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AgeTypeSelector />
          </div>
        );
      } else if (operation === ConditionOperation.in_range) {
        const currentRange =
          typeof value === "object" && value !== null && "min" in value
            ? (value as any)
            : { min: undefined, max: undefined, value_type: "years" };
        const min = currentRange.min;
        const max = currentRange.max;
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <FormField
              control={form.control}
              name={`${fieldName}.value.min` as any}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder={t("min")}
                      className="w-full min-w-30 h-9"
                      value={min}
                      onChange={(e) => {
                        handleSetValue(
                          {
                            min:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            max: currentRange.max,
                            value_type: currentRange.value_type || "years",
                          } as any,
                          index,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${fieldName}.value.max` as any}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder={t("max")}
                      className="w-full min-w-30 h-9"
                      value={max}
                      onChange={(e) => {
                        handleSetValue(
                          {
                            min: currentRange.min,
                            max:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            value_type: currentRange.value_type || "years",
                          } as any,
                          index,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AgeTypeSelector />
          </div>
        );
      }
      break;
    }
    case "encounter_class": {
      if (operation === ConditionOperation.equality) {
        return (
          <FormField
            control={form.control}
            name={`${fieldName}.value` as any}
            render={() => (
              <FormItem>
                <FormControl>
                  <Select
                    value={condition.value as string}
                    onValueChange={(value) => {
                      handleSetValue(value, index);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_a_value")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ENCOUNTER_CLASS.map((encounterClass) => (
                        <SelectItem key={encounterClass} value={encounterClass}>
                          {t(`encounter_class__${encounterClass}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
      break;
    }
    default: {
      if (operation === ConditionOperation.equality) {
        const value = condition.value as string;
        return (
          <FormField
            control={form.control}
            name={`${fieldName}.value` as any}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder={t("value")}
                    value={value}
                    onChange={(e) => {
                      handleSetValue(e.target.value, index);
                    }}
                    className="w-fit h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (operation === ConditionOperation.in_range) {
        const currentRange =
          typeof value === "object" && value !== null && "min" in value
            ? (value as ConditionOperationInRangeValue)
            : { min: undefined, max: undefined };
        const min = currentRange.min;
        const max = currentRange.max;
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <FormField
              control={form.control}
              name={`${fieldName}.value.min` as any}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder={t("min")}
                      className="w-full h-9"
                      value={min}
                      onChange={(e) => {
                        handleSetValue(
                          {
                            min:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            max: currentRange.max,
                          },
                          index,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${fieldName}.value.max` as any}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder={t("max")}
                      className="w-full h-9"
                      value={max}
                      onChange={(e) => {
                        handleSetValue(
                          {
                            min: currentRange.min,
                            max:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          },
                          index,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      } else if (operation === ConditionOperation.has_tag) {
        const selectedTags = tagQueries
          .map((query) => query.data)
          .filter(Boolean) as TagConfig[];
        const handleSetTagValue = (value: string) => {
          handleSetValue(
            {
              value: value,
              value_type: tagResource,
            },
            index,
          );
        };
        return (
          <>
            <FormField
              control={form.control}
              name={`${fieldName}.value.value` as any}
              render={() => {
                const errorMessage = form.getFieldState(
                  `${fieldName}.value.value`,
                  form.formState,
                ).error?.message;
                return (
                  <FormItem>
                    <FormControl>
                      <TagSelectorPopover
                        facilityId={facilityId}
                        selected={selectedTags}
                        resource={tagResource}
                        onChange={(tags) => {
                          handleSetTagValue(
                            tags.map((tag) => tag.id).join(","),
                          );
                        }}
                        className={errorMessage ? "border-red-500" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </>
        );
      }
      break;
    }
  }
}

export function ConditionComponent<
  TFieldValues extends FieldValues = FieldValues,
>({
  conditions,
  setConditions,
  form,
  fieldName,
  facilityId,
}: {
  conditions: Condition[];
  setConditions: (value: Condition[]) => void;
  form: UseFormReturn<TFieldValues>;
  fieldName: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["metrics"],
    queryFn: query(observationDefinitionApi.getAllMetrics),
  });

  const metrics = data?.filter((m) => !m.name.includes("patient_tag"));

  // No longer enforce a default condition — conditions are optional

  const handleSetMetric = (metric: string, index: number) => {
    const newMetric = metrics?.find((m) => m.name === metric) || metrics?.[0];
    const firstOperation = newMetric
      ?.allowed_operations?.[0] as ConditionOperation;
    const value = getConditionValue(newMetric?.name || "", firstOperation);

    const updatedCondition: Condition = {
      ...conditions[index],
      metric: newMetric?.name || "",
      operation: firstOperation,
      value,
    } as Condition;

    setConditions(
      conditions.map((c, i) => (i === index ? updatedCondition : c)),
    );
  };

  const handleAddCondition = () => {
    if (!metrics?.[0]) return;
    const newCondition = getDefaultCondition(metrics);
    setConditions([...conditions, newCondition]);
  };

  const handleSetOperation = (value: ConditionOperation, index: number) => {
    setConditions(
      conditions.map((c, i) =>
        i === index
          ? ({
              ...c,
              operation: value,
            } as Condition)
          : c,
      ),
    );
  };

  const handleSetValue = (
    value:
      | string
      | ConditionOperationInRangeValue
      | AgeOperationEqualityValue
      | TagOperationValue,
    index: number,
  ) => {
    let updatedCondition = conditions[index];
    updatedCondition = { ...updatedCondition, value: value } as Condition;
    setConditions(
      conditions.map((c, i) => (i === index ? updatedCondition : c)),
    );
  };

  const handleSetValueType = (value: string, index: number) => {
    const metric = conditions[index].metric;
    if (metric === "patient_age") {
      const currentValue = conditions[index].value;
      const updatedValue = {
        ...(currentValue as
          | AgeOperationInRangeValue
          | AgeOperationEqualityValue),
        value_type: value,
      };
      setConditions(
        conditions.map((c, i) =>
          i === index ? ({ ...c, value: updatedValue } as Condition) : c,
        ),
      );
    }
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t("conditions")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAddCondition}
          className="h-7 text-xs gap-1"
        >
          <Plus className="size-3" />
          {t("add")}
        </Button>
      </div>
      {conditions.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
          {conditions.map((condition, index) => {
            const metric = metrics?.find((m) => m.name === condition.metric);
            if (!metric) return null;
            return (
              <div key={index} className="flex gap-2 p-2.5 items-start">
                <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
                  <FormField
                    control={form.control}
                    name={`${fieldName}.${index}.metric` as any}
                    render={() => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Select
                            value={condition.metric}
                            onValueChange={(value) => {
                              handleSetMetric(value, index);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t("select_a_metric")} />
                            </SelectTrigger>
                            <SelectContent>
                              {metrics?.map((metric: Metrics) => (
                                <SelectItem
                                  key={metric.name}
                                  value={metric.name}
                                >
                                  {t(`condition_metric__${metric.name}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`${fieldName}.${index}.operation` as any}
                    render={() => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Select
                            value={condition.operation}
                            onValueChange={(value) => {
                              handleSetOperation(
                                value as ConditionOperation,
                                index,
                              );
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs max-w-40">
                              <SelectValue
                                placeholder={t("select_an_operation")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {metric.allowed_operations.map(
                                (operation: ConditionOperation) => (
                                  <SelectItem key={operation} value={operation}>
                                    {t(`condition_operation__${operation}`)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {condition.operation && (
                    <div className="flex-1">
                      <RenderConditionInput
                        condition={condition}
                        index={index}
                        handleSetValue={handleSetValue}
                        handleSetValueType={handleSetValueType}
                        form={form}
                        fieldName={`${fieldName}.${index}`}
                        facilityId={facilityId}
                      />
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="size-7 shrink-0 text-gray-400 hover:text-red-600 mt-0.5"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function InterpretationComponent<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  interpretation,
  setInterpretation,
  fieldName,
  disableDisplay = false,
}: {
  form: UseFormReturn<TFieldValues>;
  interpretation: Interpretation;
  setInterpretation: (interpretation: Interpretation) => void;
  fieldName: string;
  disableDisplay?: boolean;
}) {
  const { t } = useTranslation();
  const handleDisplayChange = (value: string) => {
    setInterpretation({
      ...interpretation,
      display: value,
    });
  };

  const handleHighlightChange = (value: boolean) => {
    setInterpretation({
      ...interpretation,
      highlight: value,
    });
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {!disableDisplay && (
        <FormField
          control={form.control}
          name={`${fieldName}.display` as any}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  {...field}
                  value={interpretation.display}
                  placeholder={t("display")}
                  className="h-8 text-xs"
                  onChange={(e) => handleDisplayChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <label className="inline-flex items-center gap-1.5 cursor-pointer shrink-0">
        <Switch
          checked={interpretation.highlight ?? false}
          onCheckedChange={handleHighlightChange}
        />
        <Highlighter className="size-3 text-gray-400" />
      </label>
    </div>
  );
}
function DefaultInterpretationComponent<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  defaultInterpretation,
  setDefaultInterpretation,
  fieldName,
}: {
  form: UseFormReturn<TFieldValues>;
  defaultInterpretation?: Interpretation;
  setDefaultInterpretation: (
    interpretation: Interpretation | undefined,
  ) => void;
  fieldName: string;
}) {
  const { t } = useTranslation();
  const isEnabled = !!defaultInterpretation;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      setDefaultInterpretation({ display: "", highlight: true });
    } else {
      setDefaultInterpretation(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t("default_interpretation")}
        </h3>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      </div>
      <p className="text-xs text-gray-400">
        {t("default_interpretation_description")}
      </p>
      {isEnabled && defaultInterpretation && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5">
          <InterpretationComponent
            form={form}
            interpretation={defaultInterpretation}
            setInterpretation={setDefaultInterpretation}
            fieldName={fieldName}
            disableDisplay
          />
        </div>
      )}
    </div>
  );
}

function NumericRangeComponent<TFieldValues extends FieldValues = FieldValues>({
  form,
  ranges,
  setRanges,
  fieldName,
}: {
  form: UseFormReturn<TFieldValues>;
  ranges: NumericRange[];
  setRanges: (value: NumericRange[]) => void;
  fieldName: string;
}) {
  const { t } = useTranslation();
  const handleSetRange = (value: NumericRange, index: number) => {
    const newRanges = [...ranges];
    newRanges[index] = value;
    setRanges(newRanges);
  };

  const handleSetInterpretation = (
    interpretation: Interpretation,
    index: number,
  ) => {
    handleSetRange(
      {
        ...ranges[index],
        interpretation,
      },
      index,
    );
  };

  const handleSetMin = (value: string, index: number) => {
    handleSetRange({ ...ranges[index], min: value || undefined }, index);
  };

  const handleSetMax = (value: string, index: number) => {
    handleSetRange({ ...ranges[index], max: value || undefined }, index);
  };

  const handleAddRange = () => {
    setRanges([
      ...ranges,
      {
        interpretation: { display: "", highlight: false, code: undefined },
        min: undefined,
        max: undefined,
      },
    ]);
  };

  const handleRemoveRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t("ranges")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAddRange}
          className="h-7 text-xs gap-1"
        >
          <Plus className="size-3" />
          {t("add")}
        </Button>
      </div>
      {ranges.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
          {ranges.map((range, index) => {
            const { min, max } = range;
            return (
              <div key={index} className="flex gap-2 p-2.5 items-start">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {range?.interpretation && (
                    <InterpretationComponent
                      form={form}
                      interpretation={range.interpretation}
                      setInterpretation={(value) =>
                        handleSetInterpretation(value, index)
                      }
                      fieldName={`${fieldName}.ranges.${index}.interpretation`}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <FormField
                      control={form.control}
                      name={`${fieldName}.ranges.${index}.min` as any}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              value={min}
                              placeholder={t("min")}
                              className="h-8 text-xs"
                              onChange={(e) =>
                                handleSetMin(e.target.value, index)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="text-gray-300 text-xs shrink-0">–</span>
                    <FormField
                      control={form.control}
                      name={`${fieldName}.ranges.${index}.max` as any}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              value={max}
                              placeholder={t("max")}
                              className="h-8 text-xs"
                              onChange={(e) =>
                                handleSetMax(e.target.value, index)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="size-7 shrink-0 text-gray-400 hover:text-red-600 mt-0.5"
                  onClick={() => handleRemoveRange(index)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomValueSetInterpretationComponent<
  TFieldValues extends FieldValues = FieldValues,
>({
  form,
  valuesetInterpretations,
  setValuesetInterpretations,
  fieldName,
}: {
  form: UseFormReturn<TFieldValues>;
  valuesetInterpretations: CustomValueSet[];
  setValuesetInterpretations: (value: CustomValueSet[]) => void;
  fieldName: string;
}) {
  const { t } = useTranslation();

  const { data: valuesets } = useQuery({
    queryKey: ["valuesets"],
    queryFn: query(valueSetApi.list),
  });

  const handleSetValueset = (valueset: string, index: number) => {
    setValuesetInterpretations(
      valuesetInterpretations.map((valuesetInterpretation, i) =>
        i === index
          ? { ...valuesetInterpretation, valueset }
          : valuesetInterpretation,
      ),
    );
  };

  const handleSetInterpretation = (
    interpretation: Interpretation,
    index: number,
  ) => {
    setValuesetInterpretations(
      valuesetInterpretations.map((valuesetInterpretation, i) =>
        i === index
          ? {
              ...valuesetInterpretation,
              interpretation,
            }
          : valuesetInterpretation,
      ),
    );
  };
  const handleAddValueset = () => {
    setValuesetInterpretations([
      ...valuesetInterpretations,
      {
        valueset: "",
        interpretation: { display: "", highlight: false, code: undefined },
      },
    ]);
  };

  const handleRemoveValueset = (index: number) => {
    setValuesetInterpretations(
      valuesetInterpretations.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t("custom_valueset_interpretations")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAddValueset}
          className="h-7 text-xs gap-1"
        >
          <Plus className="size-3" />
          {t("add")}
        </Button>
      </div>
      {valuesetInterpretations.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
          {valuesetInterpretations.map((valuesetInterpretation, index) => (
            <div key={index} className="flex gap-2 p-2.5 items-start">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Select
                  value={valuesetInterpretation.valueset}
                  onValueChange={(value) => handleSetValueset(value, index)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t("select_a_value_set")} />
                  </SelectTrigger>
                  <SelectContent>
                    {valuesets?.results?.map((valueset) => (
                      <SelectItem key={valueset.slug} value={valueset.slug}>
                        {valueset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {valuesetInterpretation.valueset && (
                  <InterpretationComponent
                    form={form}
                    interpretation={valuesetInterpretation.interpretation}
                    setInterpretation={(value) =>
                      handleSetInterpretation(value, index)
                    }
                    fieldName={`${fieldName}.valueset_interpretation.${index}.interpretation`}
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="size-7 shrink-0 text-gray-400 hover:text-red-600 mt-0.5"
                onClick={() => handleRemoveValueset(index)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
