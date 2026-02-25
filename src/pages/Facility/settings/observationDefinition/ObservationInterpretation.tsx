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
  FormLabel,
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
  COLOR_OPTIONS,
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
import { AlertTriangle, Edit, Trash2, X } from "lucide-react";
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
                interpretation: { display: "", icon: "", color: "" },
                min: undefined,
                max: undefined,
              },
            ]
          : [],
      valueset_interpretation:
        selectedInterpretationType === InterpretationType.valuesets
          ? [
              {
                interpretation: { display: "", icon: "", color: "" },
                valueset: "",
              },
            ]
          : [],
      _interpretation_type: selectedInterpretationType,
    };

    const updatedRanges = [...(qualifiedRanges || []), newRange];
    setQualifiedRanges(updatedRanges);

    form.setValue(name as any, updatedRanges as any);

    setEditedRange(newRange);
    handleSheetState(true);
  };

  const handleEditInterpretation = (index: number) => {
    handleSheetState(true);
    const rangeToEdit = { ...qualifiedRanges[index], id: index };
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
      newRanges[editingIndex] = editedRange;
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
    const valuesetCount = range.valueset_interpretation?.length || 0;
    let operationSummary = (range.conditions ?? [])
      .slice(0, 2)
      .map((condition, index) => {
        return (
          <ConditionOperationSummary
            key={`condition-${index}`}
            condition={condition}
          />
        );
      });
    if ((range.conditions?.length ?? 0) > 2) {
      operationSummary.push(<span>+{range.conditions!.length - 2}...</span>);
    }
    const rangeSummary = range.ranges?.slice(0, 2).map((range, index) => {
      return <span key={`range-${index}`}>{getRangeSummary(range)}</span>;
    });
    const valuesetSummary = range.valueset_interpretation
      ?.slice(0, 2)
      .map((valueset, index) => {
        return (
          <span key={`valueset-${index}`}>{getValuesetSummary(valueset)}</span>
        );
      });
    if (range.ranges.length > 2) {
      rangeSummary.push(<span>+{range.ranges.length - 2}...</span>);
    }
    if (
      range.valueset_interpretation?.length &&
      range.valueset_interpretation.length > 2
    ) {
      valuesetSummary?.push(
        <span>+{range.valueset_interpretation.length - 2}...</span>,
      );
    }
    return (
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start flex-1 text-sm">
        <span>#{index + 1}</span>
        {operationSummary.length > 0 && (
          <div className="flex flex-col gap-1 sm:w-1/2">
            <span className="text-xs font-medium">{t("conditions")}</span>
            <div className="flex flex-col gap-1 text-gray-500">
              {operationSummary}
            </div>
          </div>
        )}
        {rangeCount > 0 && (
          <div className="flex flex-col gap-1 sm:w-1/2">
            <span className="text-xs font-medium">{t("effect")}</span>
            <div className="flex flex-col gap-1 text-gray-500">
              {rangeSummary}
            </div>
          </div>
        )}
        {valuesetCount > 0 && (
          <div className="flex flex-col gap-1 sm:w-1/2">
            <span className="text-xs font-medium">{t("effect")}</span>
            <div className="flex flex-col gap-1 text-gray-500">
              {valuesetSummary}
            </div>
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
    if (field && value !== undefined) {
      const updatedRange = {
        ...range,
        [field]: value,
      };
      setEditedRange(updatedRange);

      // Update form state if we have a field name
      if (editedRange && editedRange.id !== undefined) {
        const fieldPath = `${name}.${editedRange.id}.${field}`;
        form.setValue(fieldPath as any, value as any);
      }
    } else {
      // Full range update
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
        <p className="text-sm text-gray-500 py-4 text-center">
          {t("no_interpretations_configured")}
        </p>
      ) : (
        <div className="space-y-4">
          {qualifiedRanges?.map((range, index) => {
            const errors = form.getFieldState(
              `${name}.${index}` as any,
              form.formState,
            ).error;
            return (
              <div
                key={index}
                className={cn(
                  "flex flex-col sm:flex-row gap-2 items-center justify-between p-3 rounded-md border",
                  wouldBeAffectedByTypeChange(range, index)
                    ? "bg-red-50 border-red-300"
                    : "bg-gray-50 border-gray-200",
                  errors ? "border border-red-500" : "",
                )}
              >
                {getInterpretationSummary(range, index)}
                {wouldBeAffectedByTypeChange(range, index) && (
                  <span className="text-sm text-red-500">
                    {t("type_changed_values_need_to_be_updated")}
                  </span>
                )}
                <div className="flex flex-row justify-between gap-1 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditInterpretation(index)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInterpretation(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={handleSheetState}>
        <SheetContent className="sm:max-w-xl">
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
    <div>
      <div className="flex flex-col gap-3 mt-6 p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        <ConditionComponent
          conditions={editedRange.conditions ?? []}
          setConditions={handleSetConditions}
          form={form}
          fieldName={`${fieldName}.conditions`}
        />
        {/* TODO: Hide interpretation type selector until BE is ready*/}
        {/*         <div>
          <div className="flex flex-col sm:flex-row justify-between gap-2 bg-gray-50 rounded-md px-2 pt-1 pb-2 border border-gray-200">
            <span className="text-sm font-medium mt-2">
              {t("interpretation_type")}
            </span>
            <div className="flex flex-row">
              <RadioGroup
                value={interpretationType}
                onValueChange={(newType) => {
                  handleTypeChange(newType as InterpretationType);
                }}
                className="flex flex-row gap-6 mt-2 flex-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={InterpretationType.ranges}
                    id="ranges"
                  />
                  <FormLabel htmlFor="ranges" className="text-sm">
                    {t("numeric_ranges")}
                  </FormLabel>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={InterpretationType.valuesets}
                    id="valuesets"
                  />
                  <FormLabel htmlFor="valuesets" className="text-sm">
                    {t("value_sets")}
                  </FormLabel>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div> */}
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
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="button" onClick={handleSave} disabled={isDisabled}>
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
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    value={field.value}
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
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Select
                    value={field.value || valueType}
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
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    value={field.value}
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
}: {
  conditions: Condition[];
  setConditions: (value: Condition[]) => void;
  form: UseFormReturn<TFieldValues>;
  fieldName: string;
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
    <div className="flex flex-col gap-3 bg-white rounded-md p-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-700">
          {t("conditions")}
        </h3>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleAddCondition}
        >
          {t("add_condition")}
        </Button>
      </div>
      {conditions.length > 0 &&
        conditions.map((condition, index) => {
          const metric = metrics?.find((m) => m.name === condition.metric);
          if (!metric) return null;
          return (
            <div
              key={index}
              className="flex flex-col gap-2 bg-gray-50 rounded-md p-3 border border-gray-200"
            >
              <div className="text-sm flex justify-between flex-1">
                {t("condition")} {index + 1}
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex flex-col gap-2 flex-1">
                    <FormLabel className="text-sm">{t("type")}</FormLabel>
                    <FormField
                      control={form.control}
                      name={`${fieldName}.${index}.metric` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                handleSetMetric(value, index);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("select_a_metric")}
                                />
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
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <FormLabel className="text-sm">{t("comperator")}</FormLabel>
                    <FormField
                      control={form.control}
                      name={`${fieldName}.${index}.operation` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                handleSetOperation(
                                  value as ConditionOperation,
                                  index,
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("select_an_operation")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {metric.allowed_operations.map(
                                  (operation: ConditionOperation) => (
                                    <SelectItem
                                      key={operation}
                                      value={operation}
                                    >
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
                  </div>
                </div>

                {condition.operation && (
                  <div className="flex flex-col gap-2">
                    <FormLabel className="text-sm">{t("value")}</FormLabel>
                    <RenderConditionInput
                      condition={condition}
                      index={index}
                      handleSetValue={handleSetValue}
                      handleSetValueType={handleSetValueType}
                      form={form}
                      fieldName={`${fieldName}.${index}`}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
}: {
  form: UseFormReturn<TFieldValues>;
  interpretation: Interpretation;
  setInterpretation: (interpretation: Interpretation) => void;
  fieldName: string;
}) {
  const { t } = useTranslation();
  const handleDisplayChange = (value: string) => {
    setInterpretation({
      ...interpretation,
      display: value,
    });
  };

  const handleIconChange = (value: string) => {
    setInterpretation({
      ...interpretation,
      icon: value,
    });
  };

  const handleColorChange = (value: string) => {
    setInterpretation({
      ...interpretation,
      color: value,
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full justify-between">
      <div className="flex flex-col gap-2 flex-1">
        <FormLabel className="text-sm">{t("display")}</FormLabel>
        <FormField
          control={form.control}
          name={`${fieldName}.display` as any}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  value={field.value}
                  className="h-9"
                  onChange={(e) => handleDisplayChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <FormLabel className="text-sm">{t("icon")}</FormLabel>
        <Input
          value={interpretation.icon}
          onChange={(e) => handleIconChange(e.target.value)}
          className="h-9"
        />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <FormLabel className="text-sm">{t("color")}</FormLabel>
        <FormField
          control={form.control}
          name={`${fieldName}.color` as any}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select value={field.value} onValueChange={handleColorChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("select_a_value")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COLOR_OPTIONS).map(([key, value]) => (
                      <SelectItem key={key} value={value.hex}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full ${value.class}`}
                          />
                          {value.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
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
        interpretation: { display: "", icon: "", color: "" },
        min: undefined,
        max: undefined,
      },
    ]);
  };

  const handleRemoveRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3 bg-white rounded-md p-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-700">{t("ranges")}</h3>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleAddRange}
        >
          {t("add_range")}
        </Button>
      </div>
      {ranges.map((range, index) => {
        const { min, max } = range;
        return (
          <div
            key={index}
            className="flex flex-col gap-2 bg-gray-50 rounded-md p-3 border border-gray-200"
          >
            <div className="flex text-sm items-center justify-between">
              {t("range")} {index + 1}
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => handleRemoveRange(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
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
              <div className="flex flex-row gap-2">
                <div className="flex flex-col gap-2 flex-1">
                  <FormLabel className="text-sm">{t("min")}</FormLabel>
                  <FormField
                    control={form.control}
                    name={`${fieldName}.ranges.${index}.min` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={min}
                            className="h-9"
                            onChange={(e) =>
                              handleSetMin(e.target.value, index)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <FormLabel className="text-sm">{t("max")}</FormLabel>
                  <FormField
                    control={form.control}
                    name={`${fieldName}.ranges.${index}.max` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={max}
                            className="h-9"
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
            </div>
          </div>
        );
      })}
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
      { valueset: "", interpretation: { display: "", icon: "", color: "" } },
    ]);
  };

  const handleRemoveValueset = (index: number) => {
    setValuesetInterpretations(
      valuesetInterpretations.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="flex flex-col gap-3 bg-white rounded-md p-3 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-700">
          {t("custom_valueset_interpretations")}
        </h3>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleAddValueset}
        >
          {t("add")}
        </Button>
      </div>
      {valuesetInterpretations.map((valuesetInterpretation, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 bg-gray-50 rounded-md p-3 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {t("valueset_interpretation")} {index + 1}
            </span>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => handleRemoveValueset(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <Select
            value={valuesetInterpretation.valueset}
            onValueChange={(value) => handleSetValueset(value, index)}
          >
            <SelectTrigger>
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
      ))}
    </div>
  );
}
