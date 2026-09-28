import { X } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { ImmunizationPolicyCoding } from "@/types/emr/immunizationPolicy/immunizationPolicy";

interface PolicyCodePickerProps {
  codes: ImmunizationPolicyCoding[];
  onChange: (codes: ImmunizationPolicyCoding[]) => void;
  kind: "vaccine" | "disease";
  disabled: boolean;
  error?: string;
}

export function PolicyCodePicker({
  codes,
  onChange,
  kind,
  disabled,
  error,
}: PolicyCodePickerProps) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {t(
          kind === "vaccine"
            ? "immunization_vaccine_codes"
            : "immunization_target_diseases",
        )}
        {kind === "vaccine" && <span aria-hidden="true"> *</span>}
      </Label>
      {codes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {codes.map((code, index) => (
            <li
              key={`${code.system}|${code.code}|${code.version}|${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-gray-200 bg-gray-50 py-1 pl-2 pr-1 text-sm"
            >
              <span
                className="min-w-0 break-words"
                title={[code.system, code.code, code.version]
                  .filter(Boolean)
                  .join(" | ")}
              >
                {code.display || code.code}
              </span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  aria-label={t("immunization_remove_code", {
                    name: code.display || code.code,
                  })}
                  onClick={() =>
                    onChange(
                      codes.filter((_, codeIndex) => codeIndex !== index),
                    )
                  }
                >
                  <X className="size-3" aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ValueSetSelect
        id={id}
        system={
          kind === "vaccine" ? "system-medication" : "system-condition-code"
        }
        placeholder={t(
          kind === "vaccine"
            ? "immunization_add_vaccine"
            : "immunization_add_disease",
        )}
        aria-label={t(
          kind === "vaccine"
            ? "immunization_add_vaccine"
            : "immunization_add_disease",
        )}
        aria-required={kind === "vaccine"}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
        className="h-9 w-full justify-between text-left font-normal"
        onSelect={(code) => {
          if (
            !codes.some(
              (entry) =>
                entry.system === code.system && entry.code === code.code,
            )
          )
            onChange([...codes, code]);
        }}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
