import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

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
      className={cn(
        "flex items-center overflow-hidden rounded-md border border-gray-400",
        className,
      )}
    >
      <Select
        value={value}
        onValueChange={(newValue) => onValueChange(newValue || undefined)}
      >
        <SelectTrigger className="border-0 hover:bg-transparent rounded-none focus:ring-0 focus:ring-offset-0">
          <div className="flex w-full items-center gap-2">
            {icon || <CareIcon icon="l-filter" className="size-4" />}
            {value ? (
              <>
                <span className="text-gray-950">{t(label)}</span>
                <span className="text-gray-600 lowercase">{t("is")}</span>
                <span className="text-gray-950 underline">{t(value)}</span>
              </>
            ) : (
              <span className="text-gray-500">
                {placeholder ? t(placeholder) : t(label)}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 border-l hover:bg-transparent w-9 rounded-none text-gray-400 border-gray-400"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
