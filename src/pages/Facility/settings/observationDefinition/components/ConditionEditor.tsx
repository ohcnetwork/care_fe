import { GENDER_TYPES } from "@/common/constants";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";
import { Button } from "@/components/ui/button";
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
  AgeOperationEqualityValue,
  AgeOperationInRangeValue,
  Condition,
  CONDITION_AGE_VALUE_TYPES,
  ConditionOperation,
  ConditionOperationInRangeValue,
  extractTagInformation,
  getConditionValue,
  getDefaultCondition,
  Metrics,
  TagOperationValue,
} from "@/types/base/condition/condition";
import { ENCOUNTER_CLASS } from "@/types/emr/encounter/encounter";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

function RenderConditionInput({
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

export function ConditionEditor<
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
              <div
                key={index}
                className="flex gap-2 p-2.5 items-center"
                title={`Condition ${index + 1}`}
              >
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
                            <SelectTrigger className="h-8 text-xs">
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
