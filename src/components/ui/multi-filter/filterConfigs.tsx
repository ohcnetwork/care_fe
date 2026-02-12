import {
  ENCOUNTER_PRIORITY,
  EncounterClass,
  EncounterPriority,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";
import {
  Beaker,
  Building,
  CalendarFold,
  CircleDashed,
  MapPin,
  Tag,
  Users,
} from "lucide-react";

import { t } from "i18next";
import {
  ActivityDefinitionFilterValue,
  SelectedActivityDefinitionBadge,
} from "./activityDefinitionFilter";
import { SelectedCareTeamBadge } from "./careTeamFilter";
import { SelectedDateBadge, getDateOperations } from "./dateFilter";
import { SelectedDepartmentBadge } from "./departmentFilter";
import { GenericSelectedBadge } from "./genericFilter";
import { SelectedTagBadge } from "./tagFilter";
import {
  DateRangeOption,
  FilterConfig,
  FilterDateRange,
  FilterMode,
  FilterValues,
  Operation,
  createFilterConfig,
  getVariantColorClasses,
} from "./utils/Utils";

import { SelectedFacilityUserBadge } from "@/components/ui/multi-filter/facilityUserFilter";
import {
  ACCOUNT_BILLING_STATUS_COLORS,
  ACCOUNT_STATUS_COLORS,
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemServiceResource,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import {
  INVOICE_STATUS_COLORS,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import {
  ENCOUNTER_CLASS_FILTER_COLORS,
  ENCOUNTER_PRIORITY_FILTER_COLORS,
  ENCOUNTER_STATUS_FILTER_COLORS,
} from "@/types/emr/encounter/encounter";
import careConfig from "@careConfig";
export const encounterStatusFilter = (
  key: string = "encounter_status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    "status",
    "command",
    Object.values(EncounterStatus).map((value) => ({
      value: value,
      label: t(value),
      color: ENCOUNTER_STATUS_FILTER_COLORS[value],
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          const color =
            ENCOUNTER_STATUS_FILTER_COLORS[option as EncounterStatus];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
              className={color}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="w-4 h-4" />,
    },
  );
export const encounterClassFilter = (
  key: string = "encounter_class",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("encounter_class"),
    "command",
    careConfig.encounterClasses.map((value) => ({
      value: value,
      label: t(`encounter_class__${value}`),
      color: ENCOUNTER_CLASS_FILTER_COLORS[value],
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedClass = selected as string[];
        if (typeof selectedClass[0] === "string") {
          const option = selectedClass[0];
          const color = ENCOUNTER_CLASS_FILTER_COLORS[option as EncounterClass];
          return (
            <GenericSelectedBadge
              selectedValue={`encounter_class__${option}`}
              selectedLength={selectedClass.length}
              className={color}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
    },
  );

export const encounterPriorityFilter = (
  key: string = "encounter_priority",
  mode: FilterMode = "single",
  customOperations?: Operation[],
  label?: string,
) =>
  createFilterConfig(
    key,
    label ? t(label) : t("priority"),
    "command",
    Array.from(ENCOUNTER_PRIORITY).map((value) => ({
      value: value.toLowerCase(),
      label: t(`encounter_priority__${value}`),
      color: ENCOUNTER_PRIORITY_FILTER_COLORS[value as EncounterPriority],
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedPriority = selected as string[];
        if (typeof selectedPriority[0] === "string") {
          const option = selectedPriority[0];
          const color =
            ENCOUNTER_PRIORITY_FILTER_COLORS[option as EncounterPriority];
          return (
            <GenericSelectedBadge
              selectedValue={`encounter_priority__${option}`}
              selectedLength={selectedPriority.length}
              className={color}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
    },
  );
export const dateFilter = (
  key: string = "started_date",
  label?: string,
  dateRangeOptions?: DateRangeOption[],
  disableClear?: boolean,
) =>
  createFilterConfig(key, label || t("started_date"), "date", [], {
    renderSelected: (
      selected: FilterValues,
      filter?: FilterConfig,
      onFilterChange?: (filterKey: string, values: FilterValues) => void,
    ) => {
      return (
        <SelectedDateBadge
          selected={selected as FilterDateRange}
          filter={filter!}
          onFilterChange={onFilterChange!}
        />
      );
    },
    getOperations: (selected: FilterValues) =>
      getDateOperations(selected as FilterDateRange),
    mode: "single",
    icon: <CalendarFold className="w-4 h-4" />,
    dateRangeOptions,
    disableClear,
  });
export const tagFilter = (
  key: string = "tags",
  resource: TagResource = TagResource.ENCOUNTER,
  mode: FilterMode = "multi",
  label?: string,
) =>
  createFilterConfig(
    key,
    label ? t(label) : t("tags", { count: 2 }),
    "tag",
    [],
    {
      resource: resource,
      renderSelected: (selected: FilterValues) => {
        return <SelectedTagBadge selected={selected as TagConfig[]} />;
      },
      getOperations: (selected: FilterValues) => {
        const selectedTags = selected as TagConfig[];
        if (selectedTags.length === 1)
          return [{ label: "includes", value: "all" }];
        return [
          { label: "has_all_of", value: "all" },
          { label: "has_any_of", value: "any" },
        ];
      },
      mode,
      icon: <Tag className="w-4 h-4" />,
      operationKey: "tags_behavior",
    },
  );

export const departmentFilter = (
  key: string = "organization",
  mode: FilterMode = "single",
  label?: string,
) =>
  createFilterConfig(
    key,
    label ? t(label) : t("department"),
    "department",
    [],
    {
      renderSelected: (selected: FilterValues) => {
        return (
          <SelectedDepartmentBadge
            selected={selected as FacilityOrganizationRead[]}
          />
        );
      },
      getOperations: () => [{ label: "is" }],
      mode,
      icon: <Building className="w-4 h-4" />,
    },
  );

export const locationFilter = (
  key: string = "location",
  mode: FilterMode = "single",
  label?: string,
) =>
  createFilterConfig(key, label ? t(label) : t("location"), "location", [], {
    renderSelected: (selected: FilterValues) => {
      const locations = selected as LocationRead[];
      if (locations.length === 0) return null;
      const location = locations[0];
      return (
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <MapPin className="h-3 w-3 text-gray-600 shrink-0" />
          <span className="text-sm whitespace-nowrap truncate max-w-[150px]">
            {location.name}
          </span>
          {locations.length > 1 && (
            <span className="text-xs text-gray-500">
              +{locations.length - 1}
            </span>
          )}
        </div>
      );
    },
    getOperations: () => [{ label: "is" }],
    mode,
    icon: <MapPin className="w-4 h-4" />,
  });

export const accountBillingStatusFilter = (
  key: string = "billing_status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("billing_status"),
    "command",
    Object.values(AccountBillingStatus).map((value) => ({
      value: value,
      label: t(value),
      color: getVariantColorClasses(ACCOUNT_BILLING_STATUS_COLORS[value]),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          const variant =
            ACCOUNT_BILLING_STATUS_COLORS[option as AccountBillingStatus];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
              variant={variant}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="w-4 h-4" />,
    },
  );

export const accountStatusFilter = (
  key: string = "status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("account_status"),
    "command",
    Object.values(AccountStatus).map((value) => ({
      value: value,
      label: t(value),
      color: getVariantColorClasses(ACCOUNT_STATUS_COLORS[value]),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          const variant = ACCOUNT_STATUS_COLORS[option as AccountStatus];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
              variant={variant}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="w-4 h-4" />,
    },
  );

export const invoiceStatusFilter = (
  key: string = "status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("invoice_status"),
    "command",
    Object.values(InvoiceStatus).map((value) => ({
      value: value,
      label: t(value),
      color: getVariantColorClasses(INVOICE_STATUS_COLORS[value]),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          const variant = INVOICE_STATUS_COLORS[option as InvoiceStatus];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
              variant={variant}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="size-4" />,
    },
  );

export const paymentStatusFilter = (
  key: string = "payment_status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("payment_status"),
    "command",
    Object.values(PaymentReconciliationStatus).map((value) => ({
      value: value,
      label: t(value),
      color: getVariantColorClasses(
        PAYMENT_RECONCILIATION_STATUS_COLORS[value],
      ),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          const variant =
            PAYMENT_RECONCILIATION_STATUS_COLORS[
              option as PaymentReconciliationStatus
            ];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
              variant={variant}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="size-4" />,
      showColorIndicators: true,
    },
  );

export const paymentTypeFilter = (
  key: string = "payment_type",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("payment_type"),
    "command",
    Object.values(PaymentReconciliationType).map((value) => ({
      value: value,
      label: t(value),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="size-4" />,
      showColorIndicators: false,
    },
  );

export const paymentMethodFilter = (
  key: string = "payment_method",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("payment_method"),
    "command",
    Object.values(PaymentReconciliationPaymentMethod).map((value) => ({
      value: value,
      label: t(PAYMENT_RECONCILIATION_METHOD_MAP[value]),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option =
            PAYMENT_RECONCILIATION_METHOD_MAP[
              selectedStatus[0] as PaymentReconciliationPaymentMethod
            ];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="size-4" />,
      showColorIndicators: false,
    },
  );

export const chargeItemStatusFilter = (
  key: string = "status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("status"),
    "command",
    Object.values(ChargeItemStatus).map((value) => ({
      value: value,
      label: t(value),
      color: getVariantColorClasses(CHARGE_ITEM_STATUS_COLORS[value]),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          const variant = CHARGE_ITEM_STATUS_COLORS[option as ChargeItemStatus];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
              variant={variant}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="size-4" />,
      showColorIndicators: true,
    },
  );

export const chargeItemServiceResourceFilter = (
  key: string = "service_resource",
  mode: FilterMode = "multi",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("service_resource"),
    "command",
    Object.values(ChargeItemServiceResource).map((value) => ({
      value: value,
      label: t(value),
    })),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedValues = selected as string[];
        if (typeof selectedValues[0] === "string") {
          const option = selectedValues[0];
          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedValues.length}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "includes" }],
      mode,
      icon: <CircleDashed className="size-4" />,
    },
  );

export const activityDefinitionFilter = (
  key: string = "activity_definition",
  mode: FilterMode = "single",
  label?: string,
) =>
  createFilterConfig(
    key,
    label ? t(label) : t("activity_definition"),
    "activity_definition",
    [],
    {
      renderSelected: (selected: FilterValues) => {
        return (
          <SelectedActivityDefinitionBadge
            selected={selected as ActivityDefinitionFilterValue[]}
          />
        );
      },
      getOperations: () => [{ label: "is" }],
      mode,
      icon: <Beaker className="size-4" />,
    },
  );

export const careTeamFilter = (
  key: string = "care_team",
  mode: FilterMode = "single",
  label?: string,
) =>
  createFilterConfig(key, label ? t(label) : t("care_team"), "care_team", [], {
    renderSelected: (selected: FilterValues) => {
      return <SelectedCareTeamBadge selected={selected as UserReadMinimal[]} />;
    },
    getOperations: () => [{ label: "is" }],
    mode,
    icon: <Users className="size-4" />,
  });

export const createdByFilter = (
  key: string = "created_by",
  mode: FilterMode = "single",
  label?: string,
) =>
  createFilterConfig(
    key,
    label ? t(label) : t("created_by"),
    "facility_user",
    [],
    {
      renderSelected: (selected: FilterValues) => {
        return (
          <SelectedFacilityUserBadge selected={selected as UserReadMinimal[]} />
        );
      },
      getOperations: () => [{ label: "is" }],
      mode,
    },
  );
