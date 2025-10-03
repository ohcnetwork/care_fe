import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Condition,
  ConditionOperation,
  getConditionValue,
  Metrics,
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
  const [newCondition, setNewCondition] = useState<{
    metric: string;
    operation: ConditionOperation;
    value: string | { min: number; max: number } | string[];
  }>({
    metric: "",
    operation: ConditionOperation.equality,
    value: "",
  });

  const handleAddCondition = () => {
    if (!newCondition.metric) return;
    if (
      newCondition.operation === ConditionOperation.intersects_any &&
      (!newCondition.value || (newCondition.value as string[]).length === 0)
    ) {
      return;
    }
    if (
      newCondition.operation !== ConditionOperation.intersects_any &&
      !newCondition.value
    ) {
      return;
    }

    let condition: Condition;
    if (newCondition.operation === ConditionOperation.equality) {
      condition = {
        metric: newCondition.metric,
        operation: ConditionOperation.equality,
        value: newCondition.value as string,
      };
    } else if (newCondition.operation === ConditionOperation.in_range) {
      condition = {
        metric: newCondition.metric,
        operation: ConditionOperation.in_range,
        value: newCondition.value as { min: number; max: number },
      };
    } else {
      condition = {
        metric: newCondition.metric,
        operation: ConditionOperation.intersects_any,
        values: newCondition.value as string[],
      };
    }

    onChange([...conditions, condition]);
    setNewCondition({
      metric: "",
      operation: ConditionOperation.equality,
      value: "",
    });
    setIsAdding(false);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const selectedMetric = availableMetrics.find(
    (m) => m.name === newCondition.metric,
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Existing conditions */}
      {conditions.length > 0 && (
        <div className="space-y-1">
          {conditions.map((condition, index) => {
            const metric = availableMetrics.find(
              (m) => m.name === condition.metric,
            );
            return (
              <div
                key={index}
                className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border"
              >
                <span>
                  {metric?.verbose_name || condition.metric}{" "}
                  <span className="font-mono pr-2 ">{condition.operation}</span>
                  {getConditionValue(condition)}
                </span>
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
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={newCondition.metric}
              onValueChange={(value) =>
                setNewCondition({ ...newCondition, metric: value })
              }
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

            <Select
              value={newCondition.operation}
              onValueChange={(value) => {
                const operation = value as ConditionOperation;
                setNewCondition({
                  ...newCondition,
                  operation,
                  value:
                    operation === ConditionOperation.in_range
                      ? { min: 0, max: 0 }
                      : operation === ConditionOperation.intersects_any
                        ? []
                        : "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedMetric?.allowed_operations.map((operation) => (
                  <SelectItem key={operation} value={operation}>
                    {operation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {newCondition.operation === ConditionOperation.equality ? (
              <Input
                value={newCondition.value as string}
                onChange={(e) =>
                  setNewCondition({ ...newCondition, value: e.target.value })
                }
                placeholder={t("value")}
              />
            ) : newCondition.operation === ConditionOperation.in_range ? (
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder={t("min_value")}
                  onChange={(e) =>
                    setNewCondition({
                      ...newCondition,
                      value: {
                        min: Number(e.target.value),
                        max:
                          (newCondition.value as { min: number; max: number })
                            ?.max || 0,
                      },
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder={t("max_value")}
                  onChange={(e) =>
                    setNewCondition({
                      ...newCondition,
                      value: {
                        min:
                          (newCondition.value as { min: number; max: number })
                            ?.min || 0,
                        max: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ) : (
              <Input
                value={(newCondition.value as string[])?.join(", ") || ""}
                onChange={(e) => {
                  const values = e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0);
                  setNewCondition({ ...newCondition, value: values });
                }}
                placeholder={t("enter_comma_separated_values")}
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAddCondition}>
              {t("add")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
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
  );
}
