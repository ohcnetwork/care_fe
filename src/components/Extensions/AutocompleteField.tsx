import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import Autocomplete from "@/components/ui/autocomplete";

import { ExtensionFieldMetadata } from "@/Utils/schema/types";

import query from "@/Utils/request/query";
import { HttpMethod } from "@/Utils/request/types";
import { API } from "@/Utils/request/utils";

interface AutocompleteFieldProps<TFieldValues extends FieldValues> {
  /** Field metadata from JSON Schema */
  metadata: ExtensionFieldMetadata;
  /** React Hook Form control */
  control: Control<TFieldValues>;
  /** Full field path (e.g., "extensions.facility_id") */
  fieldPath: Path<TFieldValues>;
  /** Additional class name for the form item */
  className?: string;
}

/**
 * Autocomplete metadata structure expected in x-ui.metadata
 */
interface AutocompleteMetadata {
  /** API endpoint URL (absolute or relative) - required if options not provided */
  url?: string;
  /** Static options (alternative to URL-based fetching) */
  options?: Array<{ label: string; value: string }>;
  /** Query parameter name for search term (default: "search") */
  searchParam?: string;
  /** Field name to use as the option value (required if url is provided) */
  valueField?: string;
  /** Field name to display as the option label (required if url is provided) */
  labelField?: string;
  /** Whether to send authentication token (default: true) */
  sendToken?: boolean;
  /** Extra query parameters to include */
  additionalParams?: Record<string, string>;
}

/**
 * Gets a value at a nested path using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;

  return path.split(".").reduce<unknown>((current, part) => {
    if (current == null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, obj);
}

/**
 * Extracts results array from API response
 */
function extractResultsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "results" in data) {
    const results = (data as { results: unknown }).results;
    if (Array.isArray(results)) return results;
  }
  return [];
}

/**
 * Schema-driven autocomplete field that fetches options from a configured API endpoint
 * Configuration is provided via x-ui.metadata in the JSON Schema
 */
export function AutocompleteField<TFieldValues extends FieldValues>({
  metadata,
  control,
  fieldPath,
  className,
}: AutocompleteFieldProps<TFieldValues>) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const config = metadata.uiMetadata as AutocompleteMetadata | undefined;
  const {
    url,
    options: staticOptions,
    searchParam = "search",
    valueField,
    labelField,
    sendToken = true,
    additionalParams = {},
  } = config || {};

  const hasStaticOptions = !!staticOptions?.length;
  const hasUrlConfig = !!url && !!valueField && !!labelField;
  const hasValidConfig = hasStaticOptions || hasUrlConfig;

  // Build query params only for URL-based autocomplete
  const queryParams: Record<string, string> = { ...additionalParams };
  if (searchQuery) {
    queryParams[searchParam] = searchQuery;
  }

  // Query for URL-based autocomplete (must be called unconditionally for React Hooks)
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["autocomplete", url, searchQuery, additionalParams],
    queryFn: query.debounced(
      {
        ...API<unknown>(`${HttpMethod.GET} ${url || "/"}`),
        noAuth: !sendToken,
      },
      { queryParams },
    ),
    enabled: hasUrlConfig,
  });

  if (!hasValidConfig) {
    return (
      <div className={className}>
        <FormLabel>{metadata.label}</FormLabel>
        <div className="text-sm text-red-500">
          {t("autocomplete_configuration_error")}
        </div>
      </div>
    );
  }

  // Get options based on mode
  const options = hasStaticOptions
    ? staticOptions!.filter((option) =>
        !searchQuery
          ? true
          : option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : extractResultsArray(searchResults).map((item) => ({
        value: String(getNestedValue(item, valueField!) ?? ""),
        label: String(getNestedValue(item, labelField!) ?? ""),
      }));

  return (
    <Controller
      control={control}
      name={fieldPath}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>
            {metadata.label}
            {metadata.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Autocomplete
              value={field.value || ""}
              onChange={(value) => field.onChange(value === "" ? null : value)}
              onSearch={setSearchQuery}
              options={options}
              isLoading={hasUrlConfig && isLoading}
              placeholder={`Select ${metadata.label}`}
              inputPlaceholder={`Search ${metadata.label}...`}
              noOptionsMessage={t("no_results_found")}
              disabled={metadata.readOnly}
              aria-invalid={!!fieldState.error}
              closeOnSelect
            />
          </FormControl>
          {metadata.description && (
            <FormDescription>{metadata.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
