import { CheckCircle2, LoaderCircle, SearchCheck, Trash2 } from "lucide-react";
import { useId } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
  useCodeVerification,
  type ConceptFieldName,
} from "./useCodeVerification";
import type { ValueSetFormData } from "./valueSetFormTypes";

interface CodingFieldProps {
  system: string;
  name: ConceptFieldName;
  form: UseFormReturn<ValueSetFormData>;
  className?: string;
  disabled?: boolean;
  onRemove?: () => void;
  removeDisabled?: boolean;
}

export const CodingField = ({
  system,
  name,
  form,
  className,
  disabled,
  onRemove,
  removeDisabled,
}: CodingFieldProps) => {
  const { t } = useTranslation();
  const errorId = useId();
  const {
    code,
    isVerified,
    isLookupPending,
    lookupFailed,
    handleVerify,
    handleCodeChange,
  } = useCodeVerification({ form, name, system, disabled });
  return (
    <div
      className={cn(
        "grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto_auto] sm:items-start",
        className,
      )}
    >
      <FormField
        control={form.control}
        name={`${name}.code`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="sr-only">{t("code")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("code")}
                disabled={disabled}
                aria-invalid={lookupFailed || fieldState.invalid}
                aria-errormessage={lookupFailed ? errorId : undefined}
                onChange={(event) => {
                  field.onChange(event);
                  handleCodeChange();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleVerify();
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${name}.display`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">{t("display_name")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("unverified")}
                className={cn("bg-gray-50", !field.value && "text-gray-500")}
                readOnly
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-end gap-2 sm:contents">
        <Button
          aria-label={
            isVerified
              ? t("code_verified")
              : `${t("verify")} ${t("code").toLocaleLowerCase()}`
          }
          type="button"
          variant="outline"
          size="sm"
          onClick={handleVerify}
          disabled={
            disabled ||
            isLookupPending ||
            isVerified ||
            !system ||
            !code?.trim()
          }
          className={cn(
            "h-11 shrink-0 bg-white sm:h-10",
            isVerified
              ? "border-primary-200 bg-primary-100/60 text-primary-800 disabled:opacity-100"
              : "hover:border-gray-400 hover:bg-gray-100",
          )}
        >
          {isVerified ? (
            <>
              <CheckCircle2 className="size-4" />
              <span>{t("code_verified")}</span>
            </>
          ) : (
            <>
              {isLookupPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <SearchCheck className="size-4" />
              )}
              <span>
                {isLookupPending
                  ? t("verifying")
                  : lookupFailed
                    ? t("try_again")
                    : t("verify")}
              </span>
            </>
          )}
        </Button>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("remove")}
            onClick={onRemove}
            disabled={disabled || removeDisabled}
            className="size-11 shrink-0 text-gray-500 hover:text-red-600 sm:size-10"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      {lookupFailed && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 sm:col-span-4"
        >
          {t("valueset_code_verification_failed")}
        </p>
      )}
    </div>
  );
};
