import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, SearchCheck, Trash2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

import valueSetApi from "@/types/valueSet/valueSetApi";
import { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

import type { ValueSetFormData } from "./ValueSetForm";

type ConceptFieldName =
  `compose.${"include" | "exclude"}.${number}.concept.${number}`;

interface CodeLookup {
  code: string;
  system: string;
  name: ConceptFieldName;
  signal: AbortSignal;
}

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
  const requestController = useRef<AbortController | null>(null);
  const code = useWatch({ control: form.control, name: `${name}.code` });
  const display = useWatch({ control: form.control, name: `${name}.display` });
  const isVerified = Boolean(display?.trim());
  const {
    mutate: lookup,
    isPending,
    isError,
    variables,
    reset: resetLookup,
  } = useMutation({
    mutationFn: async ({ code, system, signal }: CodeLookup) => {
      try {
        const response = await callApi(valueSetApi.lookup, {
          body: { system, code: code.trim() },
          signal,
          silent: true,
        });
        if (!response.metadata?.display?.trim()) {
          throw new Error("The terminology service returned no display name");
        }
        return response;
      } catch (error) {
        // Network errors and cancelled fetches are plain Errors in callApi.
        // Keep their feedback in this row instead of showing a global toast.
        if (error instanceof HTTPError) throw error;
        throw new HTTPError({
          message:
            error instanceof Error ? error.message : "Code lookup failed",
          status: 0,
          silent: true,
        });
      }
    },
    onSuccess: (response, request) => {
      // A removed row, changed system, or edited code must never receive the
      // display name from an earlier lookup (including an earlier row index).
      if (
        request.signal.aborted ||
        form.getValues(`${request.name}.code`) !== request.code
      ) {
        return;
      }
      form.setValue(`${request.name}.code`, request.code.trim(), {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue(`${request.name}.display`, response.metadata.display, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(t("code_verified_successfully"));
    },
  });

  useEffect(() => {
    return () => requestController.current?.abort();
  }, [code, disabled, name, system]);

  const isCurrentLookup =
    variables?.name === name &&
    variables?.code === code &&
    variables?.system === system &&
    !variables.signal.aborted;
  const isLookupPending = isPending && isCurrentLookup;
  const lookupFailed = isError && isCurrentLookup && !isVerified;

  const handleVerify = () => {
    const currentCode = form.getValues(`${name}.code`);
    if (
      disabled ||
      isVerified ||
      isLookupPending ||
      !system ||
      !currentCode?.trim()
    ) {
      return;
    }

    requestController.current?.abort();
    requestController.current = new AbortController();
    lookup({
      system,
      code: currentCode,
      name,
      signal: requestController.current.signal,
    });
  };

  const handleCodeChange = () => {
    requestController.current?.abort();
    resetLookup();
    form.setValue(`${name}.display`, "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
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
