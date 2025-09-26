import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  Condition,
  ConditionOperation,
  ConditionOperationSummary,
  Metrics,
  conditionSchema,
} from "@/types/base/condition/condition";

interface CompactConditionEditorProps {
  conditions: Condition[];
  availableMetrics: Metrics[];
  onChange: (conditions: Condition[]) => void;
  className?: string;
}

export function CompactConditionEditor({
  conditions,
  availableMetrics,
  onChange,
  className = "",
}: CompactConditionEditorProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);

  // Set up form with zod validation
  const form = useForm({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      metric: "",
      operation: ConditionOperation.equality,
      value: "",
    },
  });

  const { metric, operation } = form.watch();

  const handleAddCondition = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const formValues = form.getValues();
    let condition: Condition;

    if (formValues.operation === ConditionOperation.equality) {
      if (formValues.metric === "patient_age") {
        condition = {
          metric: formValues.metric,
          operation: ConditionOperation.equality,
          value: formValues.value as AgeOperationEqualityValue,
        };
      } else {
        condition = {
          metric: formValues.metric,
          operation: ConditionOperation.equality,
          value: formValues.value as string,
        };
      }
    } else if (formValues.operation === ConditionOperation.in_range) {
      if (formValues.metric === "patient_age") {
        condition = {
          metric: formValues.metric,
          operation: ConditionOperation.in_range,
          value: formValues.value as AgeOperationInRangeValue,
        };
      } else {
        condition = {
          metric: formValues.metric,
          operation: ConditionOperation.in_range,
          value: formValues.value as { min: number; max: number },
        };
      }
    } else {
      condition = {
        metric: formValues.metric,
        operation: formValues.operation,
        value: formValues.value as string,
      };
    }

    onChange([...conditions, condition]);

    // Reset form
    form.reset({
      metric: "",
      operation: ConditionOperation.equality,
      value: "",
    });

    setIsAdding(false);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  // Use the watched metric value to find the selected metric
  const selectedMetric = availableMetrics.find((m) => m.name === metric);

  const handleSetMetric = (metricName: string) => {
    form.clearErrors();
    const newMetric = availableMetrics?.find((m) => m.name === metricName);
    const firstOperation = newMetric
      ?.allowed_operations?.[0] as ConditionOperation;

    // Set the metric
    form.setValue("metric", newMetric?.name || "");

    // Set the operation
    form.setValue(
      "operation",
      firstOperation as
        | ConditionOperation.equality
        | ConditionOperation.in_range
        | ConditionOperation.has_tag,
    );

    // Set minimal valid defaults based on operation type
    resetValue(firstOperation);
  };

  const resetValue = (op: ConditionOperation) => {
    if (op === ConditionOperation.in_range) {
      // For in_range, we need to set min/max as numbers to satisfy TypeScript
      form.setValue("value", {
        min: 0,
        max: 0,
        ...(metric === "patient_age" && { value_type: "years" }),
      });
    } else if (op === ConditionOperation.equality) {
      if (metric === "patient_age") {
        form.setValue("value", { value: 0, value_type: "years" });
      } else {
        form.setValue("value", "");
      }
    } else if (op === ConditionOperation.intersects_any) {
      form.setValue("value", "");
    } else if (op === ConditionOperation.has_tag) {
      form.setValue("value", "");
    } else {
      form.resetField("value");
    }
  };

  // Keep only TagSelector as a separate component since it needs to use a hook
  function TagSelector({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) {
    const tagIds = value || "";

    const tagQueries = useTagConfigs({
      ids: tagIds ? [tagIds] : [],
      disabled: !tagIds,
    });

    const selectedTags = tagQueries
      .map(({ data }) => data)
      .filter(Boolean) as TagConfig[];

    const handleChange = (tags: TagConfig[]) => {
      onChange(tags.map((tag) => tag.id).join(","));
    };

    return (
      <TagSelectorPopover
        selected={selectedTags}
        resource={TagResource.ENCOUNTER}
        onChange={handleChange}
        singleSelect={true}
      />
    );
  }

  const renderInputBasedOnMetricAndOperation = () => {
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
      return (
        <div className="flex gap-1 justify-between">
          <FormField
            control={form.control}
            name="value.value"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("value")}
                    value={field.value || ""}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      field.onChange(newValue);
                    }}
                    className="grow-1"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value.value_type"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    value={field.value || "years"}
                    onValueChange={(value_type) => {
                      field.onChange(value_type);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["years", "months", "days"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      );
    }

    // For patient_age with in_range operation
    if (metric === "patient_age" && operation === ConditionOperation.in_range) {
      return (
        <>
          <FormField
            control={form.control}
            name="value.min"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("min_value")}
                    value={field.value || ""}
                    onChange={(e) => {
                      const min = Number(e.target.value);
                      field.onChange(min);
                    }}
                    className="grow-1"
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
                    value={field.value || ""}
                    onChange={(e) => {
                      const max = Number(e.target.value);
                      field.onChange(max);
                    }}
                    className="grow-1"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value.value_type"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    value={field.value || "years"}
                    onValueChange={(value_type) => {
                      field.onChange(value_type);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["years", "months", "days"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </>
      );
    }

    // For has_tag operation
    if (operation === ConditionOperation.has_tag) {
      return (
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <TagSelector
                  value={field.value as string}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
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
                  value={(field.value as string) || ""}
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
                  value={field.value || ""}
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
                  value={field.value || ""}
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
                  className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border"
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
            <div className="flex flex-row gap-2 items-center">
              <FormField
                control={form.control}
                name="metric"
                render={({ field }) => (
                  <FormItem className="w-56!">
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
                          {availableMetrics.map((metric) => (
                            <SelectItem key={metric.name} value={metric.name}>
                              {metric.verbose_name}
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
                  <FormItem className="flex-1">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.clearErrors();
                          resetValue(value as ConditionOperation);
                        }}
                      >
                        <SelectTrigger className="grow-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedMetric?.allowed_operations.map(
                            (operation) => (
                              <SelectItem key={operation} value={operation}>
                                {operation}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {renderInputBasedOnMetricAndOperation()}
            </div>
            {/* Error Summary */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <ul className="text-sm text-red-600 pl-4 list-disc">
                  {/* Map errors to user-friendly messages */}
                  {Object.entries(form.formState.errors).map(([key, error]) => {
                    // Get error message based on field
                    let errorMessage = "";
                    if (typeof error.message === "string") {
                      errorMessage = error.message;
                    }

                    return errorMessage ? (
                      <li key={key}>{errorMessage}</li>
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
