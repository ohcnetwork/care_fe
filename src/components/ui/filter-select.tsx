import { ChevronDown, ListFilter } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterSelectProps {
  value: string;
  onValueChange: (value: string | undefined) => void;
  options: string[];
  label: string;
  onClear: () => void;
  icon?: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  label,
  onClear,
  icon,
  className,
  placeholder,
}: FilterSelectProps) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="filter-select"
      className={cn("inline-flex min-w-0", className)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          appearance="field"
          className="w-full justify-between"
        >
          {icon || <ListFilter aria-hidden="true" />}
          <span>{value ? label : placeholder || label}</span>
          {value && <span className="text-muted-foreground">{t(value)}</span>}
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            aria-label={label}
            value={value}
            onValueChange={(newValue) => {
              if (newValue === "") {
                onClear();
              } else {
                onValueChange(newValue);
              }
            }}
          >
            {!options.includes("all") && (
              <DropdownMenuRadioItem value="">{t("all")}</DropdownMenuRadioItem>
            )}
            {options.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {t(option)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
