import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CatalogOption } from "@/types/beckn/becknModels";

interface CatalogPickerProps {
  options: CatalogOption[];
  value?: string;
  onChange: (option: CatalogOption) => void;
  disabled?: boolean;
}

/** Provider/offer dropdown built from an `on_discover` catalog. */
export default function CatalogPicker({
  options,
  value,
  onChange,
  disabled,
}: CatalogPickerProps) {
  const { t } = useTranslation();

  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {t("beckn_no_providers_returned")}
      </p>
    );
  }

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(key) => {
        const option = options.find((o) => o.key === key);
        if (option) onChange(option);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={t("beckn_select_provider_offer")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
