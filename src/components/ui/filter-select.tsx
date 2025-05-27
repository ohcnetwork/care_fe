import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

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
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  label,
  onClear,
}: FilterSelectProps) {
  const { t } = useTranslation();
  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-400">
      <Select
        value={value}
        onValueChange={(newValue) => onValueChange(newValue || undefined)}
      >
        <SelectTrigger className="border-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <CareIcon icon="l-filter" className="size-4" />
            {value ? (
              <>
                <span>{t(label)}</span>
                <span className="text-gray-500">is</span>
                <span>{t(value)}</span>
              </>
            ) : (
              <span className="text-gray-500">{t(label)}</span>
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
          className="h-auto border-l px-2 hover:bg-transparent"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
