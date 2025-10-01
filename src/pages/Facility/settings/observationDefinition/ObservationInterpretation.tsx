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
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  Condition,
  ConditionOperation,
  ConditionOperationInRangeValue,
  getConditionOperationSummary,
  Metrics,
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
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import valuesetApi from "@/types/valueset/valuesetApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
export function ObservationInterpretation({
  qualifiedRanges,
  setQualifiedRanges,
}: {
  qualifiedRanges: QualifiedRange[];
  setQualifiedRanges: (value: QualifiedRange[]) => void;
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

  const hasExistingData = () => {
    return qualifiedRanges.some(
      (range) =>
        range.conditions.length > 0 ||
        range.ranges.length > 0 ||
        (range.valueset_interpretation?.length || 0) > 0,
    );
  };

  const handleTypeChange = (newType: InterpretationType) => {
    if (newType === selectedInterpretationType) return;

    if (hasExistingData() && qualifiedRanges.length > 1) {
      setPendingTypeChange(newType);
      setShowTypeChangeWarning(true);
    } else {
      setSelectedInterpretationType(newType);
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
    setQualifiedRanges([...(qualifiedRanges || []), newRange]);
    setEditedRange(newRange);
    setIsSheetOpen(true);
  };

  const handleEditInterpretation = (index: number) => {
    setIsSheetOpen(true);
    const rangeToEdit = { ...qualifiedRanges[index], id: index };
    setEditedRange(rangeToEdit);

    // Clear highlighting for this range when user starts editing
    if (recentlyChangedRanges.has(index)) {
      const newRecentlyChanged = new Set(recentlyChangedRanges);
      newRecentlyChanged.delete(index);
      setRecentlyChangedRanges(newRecentlyChanged);
    }
  };

  const handleRemoveInterpretation = (index: number) => {
    setQualifiedRanges(qualifiedRanges.filter((_, i) => i !== index));
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

  const handleSaveInterpretation = (updatedRange: QualifiedRange) => {
    if (editedRange && updatedRange.id !== undefined) {
      const editingIndex = updatedRange.id;
      const newRanges = [...qualifiedRanges];
      newRanges[editingIndex] = updatedRange;
      setQualifiedRanges(newRanges);

      // Clear highlighting for this range when user saves
      if (recentlyChangedRanges.has(editingIndex)) {
        const newRecentlyChanged = new Set(recentlyChangedRanges);
        newRecentlyChanged.delete(editingIndex);
        setRecentlyChangedRanges(newRecentlyChanged);
      }
    }
    setIsSheetOpen(false);
    setEditedRange(null);
  };

  const removeNewUnsavedInterpretation = () => {
    // If we were adding a new interpretation, remove it
    if (editedRange && editedRange.id !== undefined) {
      const editingIndex = editedRange.id;
      if (
        editingIndex === qualifiedRanges.length - 1 &&
        qualifiedRanges[editingIndex]
      ) {
        const lastRange = qualifiedRanges[editingIndex];
        const isEmpty =
          lastRange.conditions.length === 0 &&
          lastRange.ranges.length <= 1 &&
          (lastRange.valueset_interpretation?.length || 0) <= 1;
        if (isEmpty) {
          setQualifiedRanges(qualifiedRanges.slice(0, -1));
        }
      }
    }
  };

  const handleCancelEdit = () => {
    removeNewUnsavedInterpretation();
    setIsSheetOpen(false);
    setEditedRange(null);
  };

  const getInterpretationSummary = (range: QualifiedRange, index: number) => {
    const rangeCount = range.ranges.length;
    const valuesetCount = range.valueset_interpretation?.length || 0;
    let operationSummary = range.conditions
      .slice(0, 2)
      .map((condition, index) => {
        return (
          <span key={`condition-${index}`}>
            {getConditionOperationSummary(condition, t(condition.metric))}
          </span>
        );
      });
    if (range.conditions.length > 2) {
      operationSummary.push(<span>+{range.conditions.length - 2}...</span>);
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
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">{t("conditions")}</span>
          <div className="flex flex-col gap-1 text-gray-500">
            {operationSummary}
          </div>
        </div>
        {rangeCount > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">{t("effect")}</span>
            <div className="flex flex-col gap-1 text-gray-500">
              {rangeSummary}
            </div>
          </div>
        )}
        {valuesetCount > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">{t("effect")}</span>
            <div className="flex flex-col gap-1 text-gray-500">
              {valuesetSummary}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 bg-white rounded-md p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-700">
          {t("observation_interpretation")} ({qualifiedRanges?.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddInterpretation}
        >
          {t("add_interpretation")}
        </Button>
      </div>

      {qualifiedRanges?.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          {t("no_interpretations_configured")}
        </p>
      ) : (
        <div className="space-y-4">
          {qualifiedRanges?.map((range, index) => (
            <div
              key={index}
              className={`flex flex-col sm:flex-row gap-2 items-center justify-between p-3 rounded-md border ${
                wouldBeAffectedByTypeChange(range, index)
                  ? "bg-red-50 border-red-300"
                  : "bg-gray-50 border-gray-200"
              }`}
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
          ))}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          className="sm:max-w-3xl"
          //onInteractOutside={removeNewUnsavedInterpretation}
        >
          <SheetHeader>
            <SheetTitle>{t("add_edit_interpretation")}</SheetTitle>
            <SheetDescription>{t("configure_interpretation")}</SheetDescription>
          </SheetHeader>

          {editedRange && (
            <QualifiedRangeEditor
              editedRange={editedRange}
              setEditedRange={setEditedRange}
              onSave={handleSaveInterpretation}
              onCancel={handleCancelEdit}
              interpretationType={selectedInterpretationType}
              handleTypeChange={handleTypeChange}
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

function QualifiedRangeEditor({
  editedRange,
  setEditedRange,
  onSave,
  onCancel,
  interpretationType,
  handleTypeChange,
}: {
  editedRange: QualifiedRange;
  setEditedRange: (range: QualifiedRange) => void;
  onSave: (updatedRange: QualifiedRange) => void;
  onCancel: () => void;
  interpretationType: InterpretationType;
  handleTypeChange: (newType: InterpretationType) => void;
}) {
  const { t } = useTranslation();

  const handleSetConditions = (value: Condition[]) => {
    setEditedRange({
      ...editedRange,
      conditions: value,
    });
  };

  const handleSetRanges = (value: NumericRange[]) => {
    setEditedRange({
      ...editedRange,
      ranges: value,
    });
  };

  const customValueSetInterpretations =
    editedRange.valueset_interpretation || [];

  const handleSetCustomValuesetInterpretations = (value: CustomValueSet[]) => {
    setEditedRange({
      ...editedRange,
      valueset_interpretation: value,
    });
  };

  const handleSave = () => {
    onSave(editedRange);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 mt-6 p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        <ConditionComponent
          conditions={editedRange.conditions}
          setConditions={handleSetConditions}
        />
        <div>
          <div className="flex flex-row justify-between gap-2 bg-gray-50 rounded-md px-2 pt-1 pb-2 border border-gray-200">
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
        </div>
        {interpretationType === InterpretationType.ranges ? (
          <NumericRangeComponent
            ranges={editedRange.ranges}
            setRanges={handleSetRanges}
          />
        ) : (
          <CustomValueSetInterpretationComponent
            valuesetInterpretations={customValueSetInterpretations}
            setValuesetInterpretations={handleSetCustomValuesetInterpretations}
          />
        )}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="button" onClick={handleSave}>
          {t("save")}
        </Button>
      </div>
    </div>
  );
}

export function ConditionComponent({
  conditions,
  setConditions,
}: {
  conditions: Condition[];
  setConditions: (value: Condition[]) => void;
}) {
  const { t } = useTranslation();
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: query(observationDefinitionApi.getAllMetrics),
  });

  useEffect(() => {
    if (metrics?.[0] && conditions.length === 0) {
      const defaultCondition = getDefaultCondition();
      setConditions([defaultCondition]);
    }
  }, [metrics, conditions]);

  const handleSetMetric = (metric: string, index: number) => {
    setConditions(
      conditions.map((c, i) =>
        i === index
          ? {
              ...c,
              metric: metrics?.find((m) => m.name === metric)?.name || "",
            }
          : c,
      ),
    );
  };

  const getDefaultCondition = () => {
    const firstOperation = metrics?.[0]
      ?.allowed_operations?.[0] as ConditionOperation;
    const newCondition: Condition = {
      metric: metrics?.[0].name || "",
      operation: firstOperation,
      ...(firstOperation === ConditionOperation.equality && {
        value: "",
      }),
      ...(firstOperation === ConditionOperation.in_range && {
        value: { min: undefined, max: undefined },
      }),
      ...(firstOperation === ConditionOperation.intersects_any && {
        values: [],
      }),
    } as Condition;
    return newCondition;
  };

  const handleAddCondition = () => {
    const newCondition = getDefaultCondition();
    setConditions([...conditions, newCondition]);
  };

  const handleSetOperation = (value: ConditionOperation, index: number) => {
    setConditions(
      conditions.map((c, i) =>
        i === index ? ({ ...c, operation: value } as Condition) : c,
      ),
    );
  };

  const handleSetValue = (
    value: string | ConditionOperationInRangeValue | { values: string[] },
    index: number,
  ) => {
    setConditions(
      conditions.map((c, i) =>
        i === index ? ({ ...c, value } as Condition) : c,
      ),
    );
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const renderOperation = (condition: Condition, index: number) => {
    const operation = condition.operation;
    const value =
      "value" in condition
        ? condition.value
        : { min: undefined, max: undefined };
    const values = "values" in condition ? condition.values : [];
    switch (operation) {
      case ConditionOperation.equality: {
        const currentValue = typeof value === "string" ? value : "";
        return (
          <Input
            type="number"
            placeholder={t("enter_value")}
            value={currentValue}
            onChange={(e) => handleSetValue(e.target.value, index)}
            className="w-fit"
          />
        );
      }
      case ConditionOperation.in_range: {
        const currentRange =
          typeof value === "object" && value !== null && "min" in value
            ? (value as ConditionOperationInRangeValue)
            : { min: undefined, max: undefined };
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              placeholder={t("enter_min_value")}
              className="w-full sm:w-32"
              value={currentRange.min || ""}
              onChange={(e) =>
                handleSetValue(
                  {
                    min: Number(e.target.value),
                    max: currentRange.max || 0,
                  },
                  index,
                )
              }
            />
            <Input
              type="number"
              placeholder={t("enter_max_value")}
              className="w-full sm:w-32"
              value={currentRange.max || ""}
              onChange={(e) =>
                handleSetValue(
                  {
                    min: currentRange.min || 0,
                    max: Number(e.target.value),
                  },
                  index,
                )
              }
            />
          </div>
        );
      }
      case ConditionOperation.intersects_any: {
        const currentValues = values as string[];
        return (
          <Input
            type="text"
            placeholder={t("enter_comma_separated_values")}
            value={currentValues.join(", ")}
            onChange={(e) => {
              const valuesArray = e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v);
              handleSetValue({ values: valuesArray }, index);
            }}
          />
        );
      }
    }
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
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex flex-col gap-2 flex-1">
                    <FormLabel className="text-sm">{t("type")}</FormLabel>
                    <Select
                      value={condition.metric}
                      onValueChange={(value) => handleSetMetric(value, index)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_a_metric")} />
                      </SelectTrigger>
                      <SelectContent>
                        {metrics?.map((metric: Metrics) => (
                          <SelectItem key={metric.name} value={metric.name}>
                            {t(metric.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <FormLabel className="text-sm">{t("comperator")}</FormLabel>
                    <Select
                      value={condition.operation}
                      onValueChange={(value) =>
                        handleSetOperation(value as ConditionOperation, index)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_an_operation")} />
                      </SelectTrigger>
                      <SelectContent>
                        {metric.allowed_operations.map(
                          (operation: ConditionOperation) => (
                            <SelectItem key={operation} value={operation}>
                              {t(operation)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {condition.operation && (
                  <div className="flex flex-col gap-2">
                    <FormLabel className="text-sm">{t("value")}</FormLabel>
                    {renderOperation(condition, index)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
function InterpretationComponent({
  interpretation,
  setInterpretation,
}: {
  interpretation: Interpretation;
  setInterpretation: (interpretation: Interpretation) => void;
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
    <div className="flex flex-col sm:flex-row gap-2 w-full justify-between">
      <div className="flex flex-col gap-2 flex-1">
        <FormLabel className="text-sm">{t("display")}</FormLabel>
        <Input
          value={interpretation.display}
          onChange={(e) => handleDisplayChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <FormLabel className="text-sm">{t("icon")}</FormLabel>
        <Input
          value={interpretation.icon}
          onChange={(e) => handleIconChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <FormLabel className="text-sm">{t("colour")}</FormLabel>
        <Select
          value={interpretation.color}
          onValueChange={(value) => handleColorChange(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("select_a_colour")} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(COLOR_OPTIONS).map(([key, value]) => (
              <SelectItem key={key} value={value.hex}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${value.class}`} />
                  {value.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
function NumericRangeComponent({
  ranges,
  setRanges,
}: {
  ranges: NumericRange[];
  setRanges: (value: NumericRange[]) => void;
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

  const handleSetMin = (value: number, index: number) => {
    handleSetRange({ ...ranges[index], min: value }, index);
  };

  const handleSetMax = (value: number, index: number) => {
    handleSetRange({ ...ranges[index], max: value }, index);
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
      {ranges.map((range, index) => (
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

          <div className="flex flex-col sm:flex-row gap-2">
            {range?.interpretation && (
              <InterpretationComponent
                interpretation={range.interpretation}
                setInterpretation={(value) =>
                  handleSetInterpretation(value, index)
                }
              />
            )}
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-2 flex-1">
                <FormLabel className="text-sm">{t("min")}</FormLabel>
                <Input
                  type="number"
                  value={range?.min}
                  onChange={(e) => handleSetMin(Number(e.target.value), index)}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <FormLabel className="text-sm">{t("max")}</FormLabel>
                <Input
                  type="number"
                  value={range?.max}
                  onChange={(e) => handleSetMax(Number(e.target.value), index)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomValueSetInterpretationComponent({
  valuesetInterpretations,
  setValuesetInterpretations,
}: {
  valuesetInterpretations: CustomValueSet[];
  setValuesetInterpretations: (value: CustomValueSet[]) => void;
}) {
  const { t } = useTranslation();

  const { data: valuesets } = useQuery({
    queryKey: ["valusets"],
    queryFn: query(valuesetApi.list),
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
              interpretation={valuesetInterpretation.interpretation}
              setInterpretation={(value) =>
                handleSetInterpretation(value, index)
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
