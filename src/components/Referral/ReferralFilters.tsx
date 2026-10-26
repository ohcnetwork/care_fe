import { CircleDashed, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { departmentFilter } from "@/components/ui/multi-filter/filterConfigs";
import { GenericSelectedBadge } from "@/components/ui/multi-filter/genericFilter";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  createFilterConfig,
  FilterOption,
} from "@/components/ui/multi-filter/utils/Utils";

import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";

export interface ReferralDepartmentFilterConfig {
  facilityId: string;
  departmentId: string | null;
  department?: FacilityOrganizationRead;
}

export interface ReferralFilterUpdates {
  department?: FacilityOrganizationRead | null;
  status?: string | null;
  assignedToMe?: boolean;
}

interface ReferralFiltersProps {
  departmentFilter?: ReferralDepartmentFilterConfig;
  status: string | null;
  statusOptions: FilterOption[];
  assignedToMe?: boolean;
  onChange: (updates: ReferralFilterUpdates) => void;
}

export function ReferralFilters({
  departmentFilter: departmentConfig,
  status,
  statusOptions,
  assignedToMe,
  onChange,
}: ReferralFiltersProps) {
  const { t } = useTranslation();
  const [pickedDepartment, setPickedDepartment] =
    useState<FacilityOrganizationRead | null>(null);
  const selectedDepartment =
    departmentConfig?.department?.id === departmentConfig?.departmentId
      ? departmentConfig?.department
      : pickedDepartment?.id === departmentConfig?.departmentId
        ? pickedDepartment
        : undefined;
  const handleUpdate = (values: Record<string, unknown>) => {
    const updates: ReferralFilterUpdates = {};
    if ("department" in values) {
      updates.department =
        (values.department as FacilityOrganizationRead | null) ?? null;
      setPickedDepartment(updates.department);
    }
    if ("status" in values)
      updates.status = (values.status as string | null) ?? null;
    if ("assignedToMe" in values)
      updates.assignedToMe = values.assignedToMe === "true";
    onChange(updates);
  };
  const filters = [
    ...(departmentConfig ? [departmentFilter("department", "single")] : []),
    createFilterConfig("status", t("status"), "command", statusOptions, {
      mode: "single",
      icon: <CircleDashed className="size-4" />,
      renderSelected: (values) => {
        const value = (values as string[])[0];
        if (!value) return null;
        return (
          <GenericSelectedBadge
            selectedValue={
              statusOptions.find((option) => option.value === value)?.label ??
              value
            }
            selectedLength={1}
          />
        );
      },
    }),
    ...(assignedToMe !== undefined
      ? [
          createFilterConfig(
            "assignedToMe",
            t("assigned_to_me"),
            "command",
            [{ value: "true", label: t("yes") }],
            {
              mode: "single",
              icon: <UserRound className="size-4" />,
              renderSelected: () => (
                <GenericSelectedBadge selectedValue="yes" selectedLength={1} />
              ),
            },
          ),
        ]
      : []),
  ];
  const filterState = useMultiFilterState(filters, handleUpdate, {
    ...(departmentConfig
      ? { department: selectedDepartment ? [selectedDepartment] : [] }
      : {}),
    status: status ? [status] : [],
    ...(assignedToMe !== undefined
      ? { assignedToMe: assignedToMe ? ["true"] : [] }
      : {}),
  });

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <MultiFilter
        facilityId={departmentConfig?.facilityId}
        placeholder={t("filter")}
        selectedFilters={filterState.selectedFilters}
        onFilterChange={filterState.handleFilterChange}
        onOperationChange={filterState.handleOperationChange}
        onClearAll={filterState.handleClearAll}
        onClearFilter={filterState.handleClearFilter}
        className="w-full min-w-0 items-start sm:flex-row sm:flex-wrap sm:items-center"
        triggerButtonClassName="self-start sm:self-center"
      />
      {departmentConfig?.departmentId && !selectedDepartment && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleUpdate({ department: null })}
        >
          {t("remove_filter")}
        </Button>
      )}
    </div>
  );
}
