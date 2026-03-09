import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { GENDER_TYPES } from "@/common/constants";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";

import {
  AgeOperationEqualityValue,
  AgeOperationInRangeValue,
  CONDITION_AGE_VALUE_TYPES,
  ConditionForm,
  ConditionOperation,
  ConditionOperationSummary,
  conditionSchema,
  extractTagInformation,
  getConditionDiscriminatorValue,
  getConditionValue,
  getDefaultCondition,
  Metrics,
  TagOperationValue,
} from "@/types/base/condition/condition";
import { ENCOUNTER_CLASS } from "@/types/emr/encounter/encounter";

interface CompactConditionEditorProps {
  conditions: ConditionForm[];
  availableMetrics: Metrics[];
  onChange: (conditions: ConditionForm[]) => void;
  className?: string;
}

// Keep only TagSelector as a separate component since it needs to use a hook
function TagSelector({
  value,
  onChange,
  resource,
}: {
  value: TagOperationValue;
  onChange: (value: TagOperationValue) => void;
  resource: TagResource;
}) {
  const { tagIds } = extractTagInformation(value);

  const tagQueries = useTagConfigs({
    ids: tagIds,
    disabled: !tagIds,
  });

  const selectedTags = tagQueries
    .map(({ data }) => data)
    .filter(Boolean) as TagConfig[];

  const handleChange = (tags: TagConfig[]) => {
    onChange({
      value: tags.map((tag) => tag.id).join(","),
      value_type: resource,
    });
  };

  return (
    <div className="flex gap-1 items-center">
      <TagSelectorPopover
        selected={selectedTags}
        resource={resource}
        onChange={handleChange}
        className="h-9 w-full"
      />
    </div>
  );
}

function RenderInput({
  metric,
  operation,
  form,
}: {
  metric: string;
  operation: ConditionOperation;
  form: UseFormReturn<ConditionForm, unknown, ConditionForm>;
}) {
  const { t } = useTranslation();
  // For patient_gender with equality operation
  if (
    metric === "patient_gender" &&
    operation === ConditionOperation.equality
  ) {
    return (
      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Select
                value={field.value as string}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_gender")} />
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
          </FormItem>
        )}
      />
    );
  }

  // For patient_age with equality operation
  if (metric === "patient_age" && operation === ConditionOperation.equality) {
    const value = form.watch("value") as AgeOperationEqualityValue;
    return (
      <div className="flex flex-1 gap-1 justify-between">
        <FormItem className="flex-1">
          <FormControl>
            <Input
              type="number"
              placeholder={t("value")}
              value={value.value ?? ""}
              onChange={(e) => {
                const inputValue = e.target.value;
                const newValue =
                  inputValue === "" ? undefined : Number(inputValue);
                form.setValue(
                  "value",
                  { ...value, value: newValue } as AgeOperationEqualityValue,
                  { shouldValidate: false, shouldDirty: true },
                );
              }}
              className="grow h-9!"
            />
          </FormControl>
        </FormItem>

        <FormItem className="flex-1">
          <FormControl>
            <Select
              value={value.value_type || "years"}
              onValueChange={(value_type) => {
                form.setValue(
                  "value",
                  { ...value, value_type },
                  { shouldValidate: false, shouldDirty: true },
                );
              }}
            >
              <SelectTrigger className="h-9!">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_AGE_VALUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`condition_age_value_type__${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      </div>
    );
  }

  // For patient_age with in_range operation
  if (metric === "patient_age" && operation === ConditionOperation.in_range) {
    const value = form.watch("value") as AgeOperationInRangeValue;
    return (
      <div className="flex gap-1">
        <FormItem className="flex-1">
          <FormControl>
            <Input
              type="number"
              placeholder={t("min")}
              value={value.min ?? ""}
              onChange={(e) => {
                const inputValue = e.target.value;
                const min = inputValue === "" ? undefined : Number(inputValue);
                form.setValue(
                  "value",
                  { ...value, min },
                  { shouldValidate: false, shouldDirty: true },
                );
              }}
              className="grow h-9"
            />
          </FormControl>
        </FormItem>

        <FormItem className="flex-1">
          <FormControl>
            <Input
              type="number"
              placeholder={t("max")}
              value={value.max ?? ""}
              onChange={(e) => {
                const inputValue = e.target.value;
                const max = inputValue === "" ? undefined : Number(inputValue);
                form.setValue(
                  "value",
                  { ...value, max },
                  { shouldValidate: false, shouldDirty: true },
                );
              }}
              className="grow h-9"
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormControl>
            <Select
              value={value.value_type || "years"}
              onValueChange={(value_type) => {
                form.setValue(
                  "value",
                  { ...value, value_type },
                  { shouldValidate: false, shouldDirty: true },
                );
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_AGE_VALUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`condition_age_value_type__${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      </div>
    );
  }

  if (
    metric === "encounter_class" &&
    operation === ConditionOperation.equality
  ) {
    return (
      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Select
                value={field.value as string}
                onValueChange={(value) => {
                  field.onChange(value);
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
          </FormItem>
        )}
      />
    );
  }

  // For has_tag operation
  if (operation === ConditionOperation.has_tag) {
    const tagResource =
      metric === "encounter_tag" ? TagResource.ENCOUNTER : TagResource.PATIENT;
    return (
      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <TagSelector
                value={field.value as TagOperationValue}
                onChange={(value) => {
                  field.onChange(value);
                }}
                resource={tagResource}
              />
            </FormControl>
          </FormItem>
        )}
      />
    );
  }

  // Default case for equality operation
  if (operation === ConditionOperation.equality) {
    return (
      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                value={field.value as string}
                onChange={(e) => {
                  field.onChange(e.target.value);
                }}
                placeholder={t("value")}
              />
            </FormControl>
          </FormItem>
        )}
      />
    );
  }

  // Default case for in_range operation
  return (
    <div className="flex gap-1">
      <FormField
        control={form.control}
        name="value.min"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                type="number"
                placeholder={t("min_value")}
                value={field.value}
                onChange={(e) => {
                  const min = Number(e.target.value);
                  field.onChange(min);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="value.max"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                type="number"
                placeholder={t("max_value")}
                value={field.value}
                onChange={(e) => {
                  const max = Number(e.target.value);
                  field.onChange(max);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

export function CompactConditionEditor({
  conditions,
  availableMetrics,
  onChange,
  className = "",
}: CompactConditionEditorProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);

  const metrics = availableMetrics || [];

  const defaultCondition = getDefaultCondition(metrics);

  // Set up form with zod validation
  const form = useForm({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      ...defaultCondition,
    },
  });

  // Reset form when metrics become available
  useEffect(() => {
    if (metrics.length > 0) {
      form.reset(defaultCondition);
    }
  }, [metrics.length]);

  const { metric, operation } = form.watch();

  const handleAddCondition = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    let updatedConditions = [...conditions, form.getValues()];
    updatedConditions = updatedConditions.map((condition) => ({
      ...condition,
      _conditionType: getConditionDiscriminatorValue(
        condition.metric,
        condition.operation,
      ),
    }));
    onChange(updatedConditions);

    // Reset form to default values
    form.reset(defaultCondition);

    setIsAdding(false);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  // Use the watched metric value to find the selected metric
  const selectedMetric = metrics.find((m) => m.name === metric);

  const handleSetMetric = (metricName: string) => {
    form.clearErrors();
    const newMetric = metrics?.find((m) => m.name === metricName);
    const firstOperation = newMetric
      ?.allowed_operations?.[0] as ConditionOperation;

    // Set the metric
    form.setValue("metric", newMetric?.name || "");

    form.setValue(
      "operation",
      firstOperation as
        | ConditionOperation.equality
        | ConditionOperation.has_tag
        | ConditionOperation.in_range,
    );

    resetValue(firstOperation);
  };

  const resetValue = (op: ConditionOperation) => {
    const metric = form.getValues("metric");
    const value = getConditionValue(metric, op);
    form.setValue("value", value);
    form.setValue("_conditionType", getConditionDiscriminatorValue(metric, op));
  };

  return (
    <Form {...form}>
      <div className={`space-y-2 ${className}`}>
        {/* Existing conditions */}
        {conditions.length > 0 && (
          <div className="space-y-1">
            {conditions.map((condition, index) => {
              return (
                <div
                  key={index}
                  className="flex gap-2 items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border"
                >
                  <ConditionOperationSummary condition={condition} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemoveCondition(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new condition */}
        {isAdding ? (
          <div className="space-y-3 p-3 bg-gray-50 rounded border">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
              <FormField
                control={form.control}
                name="metric"
                render={({ field }) => (
                  <FormItem className="flex-1 w-auto">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSetMetric(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("metric")} />
                        </SelectTrigger>
                        <SelectContent>
                          {metrics.map((metric) => (
                            <SelectItem key={metric.name} value={metric.name}>
                              {t(`condition_metric__${metric.name}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operation"
                render={({ field }) => (
                  <FormItem className="flex-1 w-auto">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.clearErrors();
                          resetValue(value as ConditionOperation);
                        }}
                      >
                        <SelectTrigger className="grow">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedMetric?.allowed_operations.map(
                            (operation) => (
                              <SelectItem key={operation} value={operation}>
                                {t(`condition_operation__${operation}`)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <RenderInput metric={metric} operation={operation} form={form} />
            </div>
            {/* Error Summary */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <ul className="text-sm text-red-600 pl-4 list-disc">
                  {/* Map errors to user-friendly messages */}
                  {Object.entries(form.formState.errors).map(([key, error]) => {
                    // Get error message based on field
                    const errorMessage: Record<string, string> = {};
                    if (typeof error.message === "string") {
                      errorMessage[key] = error.message;
                    } else if (typeof error === "object") {
                      Object.entries(error).forEach(([k, v]: [string, any]) => {
                        if (v && typeof v.message === "string") {
                          errorMessage[k] = v.message;
                        }
                      });
                    }

                    return errorMessage ? (
                      <li key={key}>
                        {Object.entries(errorMessage).map(([k, v]) => (
                          <li key={k}>
                            {k}: {v}
                          </li>
                        ))}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Button type="button" size="sm" onClick={handleAddCondition}>
                {t("add")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.clearErrors();
                  setIsAdding(false);
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("add_condition")}
          </Button>
        )}
      </div>
    </Form>
  );
}
