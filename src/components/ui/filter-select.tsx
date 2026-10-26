import { ListFilter, X } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
    <ButtonGroup className={className}>
      <Select
        value={value}
        onValueChange={(newValue) => onValueChange(newValue || undefined)}
      >
        <SelectTrigger>
          <div className="flex w-full items-center gap-2">
            {icon || <ListFilter aria-hidden="true" />}
            {value ? (
              <>
                <span>
                  <Trans
                    i18nKey="filter_label_is"
                    components={{
                      style: <span className="text-muted-foreground ml-1" />,
                    }}
                    values={{ label }}
                  />
                </span>
                <span className="underline underline-offset-4">{t(value)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {placeholder ? placeholder : label}
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
          type="button"
          variant="outline"
          size="icon"
          onClick={onClear}
          aria-label={t("remove_filter")}
          aria-description={label}
        >
          <X className="size-4" />
        </Button>
      )}
    </ButtonGroup>
  );
}
