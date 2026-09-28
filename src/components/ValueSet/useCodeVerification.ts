import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import valueSetApi from "@/types/valueSet/valueSetApi";
import { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

import type { ValueSetFormData } from "./valueSetFormTypes";

export type ConceptFieldName =
  `compose.${"include" | "exclude"}.${number}.concept.${number}`;

interface CodeLookup {
  code: string;
  system: string;
  name: ConceptFieldName;
  signal: AbortSignal;
}

interface CodeVerificationOptions {
  form: UseFormReturn<ValueSetFormData>;
  name: ConceptFieldName;
  system: string;
  disabled?: boolean;
}

/** Owns one row's verification request and cancels it when that row changes. */
export function useCodeVerification({
  form,
  name,
  system,
  disabled,
}: CodeVerificationOptions) {
  const { t } = useTranslation();
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
    // This POST only verifies a code; it does not change server data or
    // invalidate value-set caches. Its result belongs to this editable row.
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
  return {
    code,
    isVerified,
    isLookupPending,
    lookupFailed,
    handleVerify,
    handleCodeChange,
  };
}
