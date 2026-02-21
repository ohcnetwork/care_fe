import { Check, ChevronDown, Component, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RadioInput from "@/components/ui/RadioInput";
import { Switch } from "@/components/ui/switch";

import { CompactConditionEditor } from "@/components/Billing/CompactConditionEditor";

import { cn } from "@/lib/utils";

import {
  ConditionForm,
  getConditionDiscriminatorValue,
  Metrics,
} from "@/types/base/condition/condition";
import {
  formatComponentValue,
  getComponentNumericValue,
  isComponentSelected,
  isPercentageBased,
  isSameComponentCode,
  MonetaryComponent,
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";

export interface MonetaryComponentSelectorProps {
  /** Title displayed above the selector */
  title?: string;
  /** Available monetary components to select from */
  components: MonetaryComponentRead[];
  /** Currently selected components */
  selectedComponents: MonetaryComponent[];
  /** Callback when selection changes - provides the full updated list */
  onSelectionChange: (components: MonetaryComponent[]) => void;
  /** Type of monetary component (tax or discount) */
  type: MonetaryComponentType;
  /** Whether to show conditions editor for discounts */
  showConditionsEditor?: boolean;
  /** Available metrics for conditions (required if showConditionsEditor is true) */
  availableMetrics?: Metrics[];
  /** Callback when conditions change for a component */
  onConditionsChange?: (
    component: MonetaryComponent,
    conditions: ConditionForm[],
  ) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Display mode: 'inline' for compact table cell, 'full' for full-width, 'short' for minimal count display */
  displayMode?: "inline" | "full" | "short";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Convert a MonetaryComponentRead to MonetaryComponent for selection
 */
function toMonetaryComponent(
  component: MonetaryComponentRead,
  type: MonetaryComponentType,
): MonetaryComponent {
  return {
    monetary_component_type: type,
    code: component.code,
    factor: isPercentageBased(component) ? component.factor : null,
    amount: !isPercentageBased(component) ? component.amount : null,
    conditions: [],
    global_component: true,
  };
}

/**
 * Shared component for selecting tax and discount monetary components.
 * Supports both inline (compact) and full display modes.
 */
export function MonetaryComponentSelector({
  title,
  components,
  selectedComponents,
  onSelectionChange,
  type,
  showConditionsEditor = false,
  availableMetrics = [],
  onConditionsChange,
  disabled = false,
  displayMode = "full",
  className = "",
}: MonetaryComponentSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftSelection, setDraftSelection] = useState<MonetaryComponent[]>([]);

  // Initialize draft selection when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setDraftSelection(selectedComponents);
    }
  }, [isOpen, selectedComponents]);

  // Group components by code (CGST, SGST, IGST, etc.)
  const groupedComponents = useMemo(() => {
    return components.reduce<Record<string, MonetaryComponentRead[]>>(
      (acc, component) => {
        const key = component.code?.code;
        if (key) {
          (acc[key] ||= []).push(component);
        }
        return acc;
      },
      {},
    );
  }, [components]);

  const { groupComponents, nonGroupComponents } = useMemo(() => {
    const groups: Record<string, MonetaryComponentRead[]> = {};
    const nonGroups: MonetaryComponentRead[] = [];

    Object.entries(groupedComponents).forEach(([key, comps]) => {
      if (comps.length > 1) {
        groups[key] = comps;
      } else {
        nonGroups.push(comps[0]);
      }
    });

    return { groupComponents: groups, nonGroupComponents: nonGroups };
  }, [groupedComponents]);

  const filteredGroupComponents = useMemo(() => {
    return Object.entries(groupComponents).reduce<
      Record<string, MonetaryComponentRead[]>
    >((acc, [key, comps]) => {
      const filtered = comps.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code?.code?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (filtered.length > 0) {
        acc[key] = filtered;
      }
      return acc;
    }, {});
  }, [groupComponents, searchQuery]);

  const filteredNonGroupComponents = useMemo(() => {
    return nonGroupComponents.filter(
      (c) =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code?.code?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [nonGroupComponents, searchQuery]);

  const handleRadioChange = (groupKey: string, selectedValue: string) => {
    if (!selectedValue) {
      setDraftSelection((prev) =>
        prev.filter((c) => c.code?.code !== groupKey),
      );
      return;
    }

    const group = groupComponents[groupKey];
    if (!group) return;

    const selectedComponent = group.find(
      (c) => getComponentNumericValue(c).toString() === selectedValue,
    );
    if (!selectedComponent) return;

    setDraftSelection((prev) => {
      const filtered = prev.filter((c) => c.code?.code !== groupKey);
      return [...filtered, toMonetaryComponent(selectedComponent, type)];
    });
  };

  const handleCheckboxToggle = (
    component: MonetaryComponentRead,
    checked: boolean,
  ) => {
    if (checked) {
      setDraftSelection((prev) => [
        ...prev,
        toMonetaryComponent(component, type),
      ]);
    } else {
      setDraftSelection((prev) =>
        prev.filter((c) => !isSameComponentCode(c, component)),
      );
    }
  };

  const handleDone = () => {
    onSelectionChange(draftSelection);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSearchQuery("");
    setDraftSelection([]);
  };

  const handleRemoveComponent = (component: MonetaryComponent) => {
    onSelectionChange(
      selectedComponents.filter((c) => !isSameComponentCode(c, component)),
    );
  };

  const handleToggleGlobal = (component: MonetaryComponent) => {
    const isCurrentlyGlobal = component.global_component === true;
    onSelectionChange(
      selectedComponents.map((c) =>
        isSameComponentCode(c, component)
          ? {
              ...c,
              global_component: !isCurrentlyGlobal,
              // Clear conditions when switching to global
              ...(!isCurrentlyGlobal ? { conditions: [] } : {}),
            }
          : c,
      ),
    );
  };

  const renderGroupCheckList = (
    groups: Record<string, MonetaryComponentRead[]>,
  ) => {
    if (Object.keys(groups).length === 0) return null;

    return Object.entries(groups).map(([groupCode, groupItems]) => {
      const selectedInGroup = groupItems.find((item) =>
        isComponentSelected(item, draftSelection),
      );
      const selectedValue = selectedInGroup
        ? getComponentNumericValue(selectedInGroup)
        : "";

      const radioOptions = groupItems.map((item) => ({
        label: formatComponentValue(item),
        value: getComponentNumericValue(item),
      }));

      return (
        <div key={groupCode} className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-2 p-2">
            <Component className="size-4 text-black/80" strokeWidth={1.25} />
            <div className="text-sm font-semibold text-gray-900 uppercase">
              {groupCode}
            </div>
          </div>
          <RadioInput
            value={selectedValue}
            onValueChange={(value: string) =>
              handleRadioChange(groupCode, value)
            }
            options={radioOptions}
            className="flex flex-row gap-1 justify-end mr-2"
          />
        </div>
      );
    });
  };

  const renderCheckList = (listComponents: MonetaryComponentRead[]) => {
    if (listComponents.length === 0) return null;

    return listComponents.map((component, idx) => {
      const isSelected = isComponentSelected(component, draftSelection);
      return (
        <div
          key={`${component.title}-${component.code?.code || idx}`}
          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              handleCheckboxToggle(component, checked as boolean)
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          <div className="flex flex-row justify-between items-center flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              {component.code?.display}
            </div>
            <div className="text-sm text-gray-600">
              {formatComponentValue(component)}
            </div>
          </div>
        </div>
      );
    });
  };

  const renderTrigger = () => {
    if (displayMode === "short") {
      const label =
        type === MonetaryComponentType.tax ? t("tax") : t("discount");
      const addLabel =
        type === MonetaryComponentType.tax ? t("add_tax") : t("add_discount");
      const ariaLabel =
        type === MonetaryComponentType.tax
          ? t("select_tax_components")
          : t("select_discount_components");

      const valuesDisplay = selectedComponents
        .map((c) => formatComponentValue(c))
        .join(", ");

      return (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {selectedComponents.length === 0 ? (
            <span>{addLabel}</span>
          ) : (
            <span>
              {label}: {valuesDisplay}
            </span>
          )}
          <ChevronDown />
        </Button>
      );
    }

    if (displayMode === "inline") {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-full min-w-[100px] justify-between text-xs h-9"
        >
          {selectedComponents.length === 0 ? (
            <span className="text-muted-foreground">
              {type === MonetaryComponentType.tax
                ? t("add_tax")
                : t("add_discount")}
            </span>
          ) : (
            <div className="flex items-center gap-1 overflow-hidden">
              {selectedComponents.slice(0, 2).map((c, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-[10px] px-1 rounded-sm"
                >
                  {c.code?.display} @ {formatComponentValue(c)}
                </Badge>
              ))}
              {selectedComponents.length > 2 && (
                <Badge variant="secondary" className="text-[10px] px-1">
                  +{selectedComponents.length - 2}
                </Badge>
              )}
            </div>
          )}
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      );
    }

    // Full display mode
    return (
      <div className="bg-white border rounded-md p-3 cursor-pointer hover:border-gray-400 transition-colors min-h-11 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedComponents.length === 0 ? (
            <span className="text-gray-500 text-sm">
              {t(
                type === MonetaryComponentType.tax ? "add_tax" : "add_discount",
              )}
            </span>
          ) : type === MonetaryComponentType.tax ? (
            <>
              {selectedComponents.slice(0, 3).map((component, idx) => (
                <Badge
                  key={`${component.code?.code}-${idx}`}
                  variant="secondary"
                  className="text-xs p-1 rounded-sm"
                >
                  {component.code?.display} @ {formatComponentValue(component)}
                </Badge>
              ))}
              {selectedComponents.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedComponents.length - 3} {t("more")}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-gray-700 text-sm">
              {selectedComponents.length} {t("selected")}
            </span>
          )}
        </div>
        <ChevronDown className="size-4 text-gray-400" />
      </div>
    );
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Selected Components Section with Conditions - Only for Discounts in full mode */}
      {displayMode === "full" &&
        showConditionsEditor &&
        type === MonetaryComponentType.discount &&
        selectedComponents.length > 0 && (
          <div className="space-y-1 mb-2">
            <p className="text-sm font-medium text-gray-700">
              {t("selected")} {title?.toLowerCase()}
            </p>
            {selectedComponents.map((component, idx) => {
              const componentRead = components.find((c) =>
                isSameComponentCode(c, component),
              );
              const isGlobal = component.global_component === true;

              return (
                <div
                  key={`selected-${componentRead?.title}-${componentRead?.code?.code || idx}`}
                  className="p-3 rounded-lg bg-white border border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium text-md">
                        {idx + 1}. {componentRead?.code?.display} -{" "}
                        {formatComponentValue(component)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveComponent(component)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isGlobal}
                        onCheckedChange={() => handleToggleGlobal(component)}
                        aria-label={t("use_facility_global_value")}
                      />
                      <span className="text-sm text-gray-600">
                        {isGlobal
                          ? t("use_facility_global_value")
                          : t("override_with_local_value")}
                      </span>
                    </div>
                    {isGlobal && (
                      <Badge variant="secondary" className="text-xs">
                        {t("global")}
                      </Badge>
                    )}
                  </div>

                  {!isGlobal && onConditionsChange && (
                    <CompactConditionEditor
                      conditions={
                        component.conditions?.map((condition) => ({
                          ...condition,
                          _conditionType: getConditionDiscriminatorValue(
                            condition.metric,
                            condition.operation,
                          ),
                        })) || []
                      }
                      availableMetrics={availableMetrics}
                      onChange={(conditions) =>
                        onConditionsChange(
                          { ...component, monetary_component_type: type },
                          conditions,
                        )
                      }
                      className="mt-3"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Title */}
      {title && displayMode === "full" && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-900">{title}</p>
        </div>
      )}

      {/* Trigger and Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>

        <PopoverContent
          className={cn("p-0", displayMode === "inline" ? "w-80" : "w-68")}
          align="start"
        >
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  type === MonetaryComponentType.tax
                    ? "search_for_tax_code"
                    : "search_for_discount_code",
                )}
                className="pl-10"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[30vh] overflow-y-auto p-2">
            {renderGroupCheckList(filteredGroupComponents)}
            {renderCheckList(filteredNonGroupComponents)}

            {Object.keys(filteredGroupComponents).length === 0 &&
              filteredNonGroupComponents.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">
                  {t(
                    type === MonetaryComponentType.tax
                      ? "no_taxes_configured"
                      : "no_discounts_configured",
                  )}
                </p>
              )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t flex gap-2">
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleDone}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="size-4 mr-1" />
              {t("done")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
